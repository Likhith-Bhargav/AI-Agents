from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from api.models import Agent
import json

class WidgetEmbedCodeView(APIView):
    """
    API endpoint to generate embed code for the chat widget.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, agent_id):
        try:
            agent = Agent.objects.get(id=agent_id, user=request.user)
            
            # Default widget configuration
            widget_config = {
                'agentId': str(agent.id),
                'position': agent.widget_config.get('position', 'bottom-right'),
                'primaryColor': agent.widget_config.get('primaryColor', '#2563eb'),
                'title': agent.widget_config.get('title', 'Chat with us'),
                'subtitle': agent.widget_config.get('subtitle', "We're here to help!"),
                'greeting': agent.widget_config.get('greeting', 'Hello! How can I help you today?'),
                'showBranding': agent.widget_config.get('showBranding', True)
            }
            
            # Generate the embed code
            embed_code = f"""<!-- Add this to your website's <head> section -->
<script src="{request.build_absolute_uri('/static/widget.js')}"
        data-agent-id="{widget_config['agentId']}"
        data-position="{widget_config['position']}"
        data-color="{widget_config['primaryColor']}"
        data-title="{widget_config['title']}"
        data-subtitle="{widget_config['subtitle']}"
        data-greeting="{widget_config['greeting']}"
        data-branding="{str(widget_config['showBranding']).lower()}">
</script>"""
            
            return Response({
                'success': True,
                'data': {
                    'embed_code': embed_code,
                    'config': widget_config
                }
            })
            
        except Agent.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Agent not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WidgetConfigView(APIView):
    """
    API endpoint to get widget configuration.
    Public endpoint used by the widget.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, agent_id):
        try:
            agent = Agent.objects.get(id=agent_id, is_active=True)
            
            return Response({
                'success': True,
                'data': {
                    'agent_id': str(agent.id),
                    'name': agent.name,
                    'description': agent.description,
                    'widget_config': agent.widget_config,
                    'is_online': agent.is_online
                }
            })
            
        except Agent.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Agent not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
