from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Agent, Ticket, Message

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
        read_only_fields = ('id', 'is_active', 'date_joined')

class AgentSerializer(serializers.ModelSerializer):
    """Serializer for the Agent model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Agent
        fields = (
            'id', 'user', 'name', 'description', 'is_active', 'status', 
            'model', 'prompt', 'temperature', 'welcome_message', 'widget_config',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        """Create a new agent and associate it with the current user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TicketSerializer(serializers.ModelSerializer):
    """Serializer for the Ticket model."""
    customer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='CUSTOMER'),
        required=False,
        allow_null=True
    )
    customer_email = serializers.EmailField(write_only=True, required=False)
    customer_name = serializers.CharField(write_only=True, required=False, default='Customer')
    agent = serializers.PrimaryKeyRelatedField(
        queryset=Agent.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Ticket
        fields = (
            'id', 'title', 'description', 'status', 'priority',
            'customer', 'agent', 'customer_email', 'customer_name',
            'created_at', 'updated_at', 'closed_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'closed_at')
        
    def create(self, validated_data):
        """Create a new ticket, creating a customer if needed."""
        customer_email = validated_data.pop('customer_email', None)
        customer_name = validated_data.pop('customer_name', 'Customer')
        
        # If customer is not provided but email is, get or create the customer
        if 'customer' not in validated_data and customer_email:
            user, created = User.objects.get_or_create(
                email=customer_email,
                defaults={
                    'username': customer_email,
                    'first_name': customer_name.split(' ')[0],
                    'last_name': ' '.join(customer_name.split(' ')[1:]) if ' ' in customer_name else '',
                    'role': 'CUSTOMER',
                    'is_active': True
                }
            )
            validated_data['customer'] = user
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """Override to include nested representations of related models."""
        representation = super().to_representation(instance)
        representation['customer'] = UserSerializer(instance.customer).data
        if instance.agent:
            representation['agent'] = AgentSerializer(instance.agent).data
        return representation

class TicketStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating ticket status."""
    status = serializers.ChoiceField(choices=Ticket.Status.choices)
    
    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        if instance.status == Ticket.Status.CLOSED:
            instance.closed_at = timezone.now()
        instance.save()
        return instance

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages between users and agents."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ('id', 'agent', 'content', 'role', 'user', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        """Create a new message and associate it with the current user."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)
