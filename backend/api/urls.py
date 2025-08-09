from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter
from rest_framework_nested import routers
from . import views
from .views_widget import WidgetEmbedCodeView, WidgetConfigView

# Main router for top-level endpoints
router = DefaultRouter()
router.register(r'agents', views.AgentViewSet, basename='agent')
router.register(r'tickets', views.TicketViewSet, basename='ticket')

# Nested router for agent messages
agent_router = routers.NestedSimpleRouter(router, r'agents', lookup='agent')
agent_router.register(r'messages', views.MessageViewSet, basename='agent-messages')

app_name = 'api'

# Widget endpoints
widget_urls = [
    path('<uuid:agent_id>/embed-code/', WidgetEmbedCodeView.as_view(), name='widget-embed-code'),
    path('<uuid:agent_id>/config/', WidgetConfigView.as_view(), name='widget-config'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('', include(agent_router.urls)),
    path('widgets/', include((widget_urls, 'widget'), namespace='widget')),
]
