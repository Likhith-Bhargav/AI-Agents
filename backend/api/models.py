from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import openai
from django.utils import timezone

class Agent(models.Model):
    """Model representing a support agent."""
    class Status(models.TextChoices):
        ONLINE = 'ONLINE', _('Online')
        OFFLINE = 'OFFLINE', _('Offline')
        BUSY = 'BUSY', _('Busy')
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agents'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OFFLINE
    )
    model = models.CharField(
        max_length=100, 
        default='gpt-4', 
        help_text='The AI model to use for this agent'
    )
    prompt = models.TextField(
        default='You are a helpful assistant.',
        help_text='The system prompt for the AI agent'
    )
    temperature = models.FloatField(
        default=0.7, 
        help_text='Controls randomness in the AI response (0.0 to 1.0)'
    )
    max_tokens = models.IntegerField(
        default=500, 
        help_text='Maximum number of tokens in the AI response'
    )
    welcome_message = models.TextField(
        default='Hello! How can I help you today?',
        help_text='Initial message shown to users when they start a chat'
    )
    widget_config = models.JSONField(
        default=dict,
        help_text='Configuration for the chat widget (colors, position, etc.)',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    class Meta:
        ordering = ['name']


class Ticket(models.Model):
    """Model representing a support ticket."""
    class Status(models.TextChoices):
        OPEN = 'OPEN', _('Open')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        RESOLVED = 'RESOLVED', _('Resolved')
        CLOSED = 'CLOSED', _('Closed')
    
    class Priority(models.TextChoices):
        LOW = 'LOW', _('Low')
        MEDIUM = 'MEDIUM', _('Medium')
        HIGH = 'HIGH', _('High')
        URGENT = 'URGENT', _('Urgent')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets_created'
    )
    agent = models.ForeignKey(
        'Agent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets_assigned'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    class Meta:
        ordering = ['-created_at']
        permissions = [
            ('can_assign_ticket', 'Can assign ticket to agents'),
            ('can_close_ticket', 'Can close tickets'),
        ]


class Message(models.Model):
    """Model representing a chat message between a user and an agent."""
    class Role(models.TextChoices):
        USER = 'user', _('User')
        ASSISTANT = 'assistant', _('Assistant')
    
    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField()
    role = models.CharField(
        max_length=10,
        choices=Role.choices
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.role.upper()}: {self.content[:50]}{'...' if len(self.content) > 50 else ''}"
    
    def generate_agent_response(self):
        """Generate a response from the agent based on the user's message."""
        if self.role != 'user' or not hasattr(self, 'agent'):
            return None
            
        try:
            # Get the conversation history
            messages = Message.objects.filter(
                agent=self.agent,
                created_at__lte=self.created_at
            ).order_by('created_at')
            
            # Prepare conversation history for the AI
            conversation = []
            for msg in messages:
                if msg.role == 'user':
                    conversation.append({"role": "user", "content": msg.content})
                else:
                    conversation.append({"role": "assistant", "content": msg.content})
            
            # Add system prompt if available
            if self.agent.prompt:
                conversation.insert(0, {"role": "system", "content": self.agent.prompt})
            
            # Initialize the OpenAI client
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Call the OpenAI API
            response = client.chat.completions.create(
                model=self.agent.model,
                messages=conversation,
                temperature=float(self.agent.temperature),
                max_tokens=int(self.agent.max_tokens)
            )
            
            # Extract and return the response
            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            print(f"Error generating agent response: {str(e)}")
            return "I'm sorry, I encountered an error while processing your message."
            
        return "I'm not sure how to respond to that."
    
    class Meta:
        ordering = ['created_at']
