from rest_framework import viewsets, status, permissions, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound, APIException
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
import openai

from .models import Agent, Ticket, Message
from .serializers import AgentSerializer, TicketSerializer, TicketStatusUpdateSerializer, MessageSerializer
from users.models import User

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.customer == request.user or (hasattr(obj, 'agent') and obj.agent.user == request.user)

class AgentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows agents to be viewed or edited.
    """
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'status']
    search_fields = ['name', 'description', 'user__email']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']

    def get_queryset(self):
        """
        Return agents based on the user's role:
        - Admins see all agents
        - Regular users only see their own agents
        """
        queryset = super().get_queryset()
        if self.request.user.is_staff:
            return queryset
        
        # For non-admin users, only show their own agents
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Create a new agent and associate it with the current user.
        Only admin users can create agents.
        """
        if not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to create agents.")
        
        # Automatically assign the current user as the agent's user
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle the active status of an agent.
        Only accessible by admin users.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        agent = self.get_object()
        agent.is_active = not agent.is_active
        agent.save()
        
        return Response({
            'id': agent.id,
            'is_active': agent.is_active,
            'message': f'Agent {agent.name} is now {"active" if agent.is_active else "inactive"}.'
        })

class TicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tickets to be viewed or edited.
    """
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'agent', 'customer']
    search_fields = ['title', 'description', 'customer__email', 'agent__name']
    ordering_fields = ['created_at', 'updated_at', 'closed_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        This view should return a list of all tickets for admins,
        or only the tickets related to the current user (as customer or agent).
        """
        user = self.request.user
        queryset = Ticket.objects.all()
        
        if user.is_staff:
            return queryset
        
        # For non-admin users, return only their tickets or tickets assigned to them
        return queryset.filter(
            Q(customer=user) | 
            Q(agent__user=user) |
            (Q(agent__isnull=True) & Q(customer__role=User.Role.CUSTOMER))
        )

    def perform_create(self, serializer):
        """
        Set the customer to the current user when creating a ticket.
        """
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Custom action to update ticket status.
        """
        ticket = self.get_object()
        serializer = TicketStatusUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Only allow status update if user is staff, the ticket owner, or the assigned agent
            if (request.user.is_staff or 
                ticket.customer == request.user or 
                (ticket.agent and ticket.agent.user == request.user)):
                
                ticket.status = serializer.validated_data['status']
                if ticket.status == Ticket.Status.CLOSED and not ticket.closed_at:
                    ticket.closed_at = timezone.now()
                ticket.save()
                
                return Response(
                    {'status': 'Status updated', 'new_status': ticket.get_status_display()},
                    status=status.HTTP_200_OK
                )
            
            return Response(
                {'detail': 'You do not have permission to update this ticket.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def assign_agent(self, request, pk=None):
        """
        Assign an agent to a ticket.
        Only accessible by admin users.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket = self.get_object()
        agent_id = request.data.get('agent_id')
        
        try:
            agent = Agent.objects.get(id=agent_id, is_active=True)
            ticket.agent = agent
            ticket.status = Ticket.Status.IN_PROGRESS
            ticket.save()
            
            return Response({
                'message': f'Agent {agent.name} assigned to ticket {ticket.id}',
                'ticket': TicketSerializer(ticket).data
            })
            
        except Agent.DoesNotExist:
            return Response(
                {'agent_id': 'Invalid agent ID or agent is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows messages to be viewed or created for a specific agent.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['created_at']

    def get_queryset(self):
        """
        Return messages for the specified agent.
        Users can only see messages they've sent or received.
        """
        agent_id = self.kwargs.get('agent_pk')
        if not agent_id:
            raise NotFound("Agent ID is required")
            
        # Verify agent exists and is active
        agent = get_object_or_404(Agent, id=agent_id, is_active=True)
        
        queryset = Message.objects.filter(agent=agent)
        
        # Non-admin users can only see their own messages
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new message for the specified agent and generate a response."""
        agent_id = self.kwargs.get('agent_pk')
        if not agent_id:
            raise NotFound("Agent ID is required")
            
        # Verify agent exists and is active
        agent = get_object_or_404(Agent, id=agent_id, is_active=True)
        
        data = request.data.copy()
        data['agent'] = agent.id
        
        # Validate the incoming message
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                # Save the user's message
                message = serializer.save(user=request.user)
                
                # Only generate response for user messages
                if message.role == 'user':
                    # Generate agent response
                    agent_response_content = message.generate_agent_response()
                    
                    if agent_response_content:
                        # Create agent's response message
                        agent_message = Message.objects.create(
                            agent=agent,
                            content=agent_response_content,
                            role='assistant',
                            user=None  # System-generated message
                        )
                        
                        # Include both messages in the response
                        response_data = {
                            'user_message': serializer.data,
                            'agent_message': self.get_serializer(agent_message).data
                        }
                        
                        return Response(
                            response_data,
                            status=status.HTTP_201_CREATED,
                            headers=self.get_success_headers(serializer.data)
                        )
                
                # If no agent response was generated, just return the user's message
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED,
                    headers=self.get_success_headers(serializer.data)
                )
                
        except Exception as e:
            raise APIException(f"Error processing message: {str(e)}")
    
    @action(detail=False, methods=['get'])
    def history(self, request, agent_pk=None):
        """Get chat history for the specified agent."""
        messages = self.get_queryset()
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
