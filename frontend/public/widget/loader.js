(function() {
  // Default configuration
  const defaultConfig = {
    agentId: null,
    position: 'right',
    primaryColor: '#3b82f6',
    title: 'How can I help you?',
    subtitle: 'Ask me anything',
    icon: '🤖',
    zIndex: 9999,
    autoOpen: false,
    hideWhenOffline: false,
  };

  // Merge default config with data attributes
  function getConfig() {
    const script = document.currentScript || 
      document.querySelector('script[src$="loader.js"]');
    
    if (!script) {
      console.error('Widget script not found');
      return null;
    }

    const config = { ...defaultConfig };
    
    // Get config from data attributes
    for (const key in defaultConfig) {
      const value = script.getAttribute(`data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`);
      if (value !== null) {
        if (typeof defaultConfig[key] === 'number') {
          config[key] = parseFloat(value);
        } else if (typeof defaultConfig[key] === 'boolean') {
          config[key] = value === 'true';
        } else {
          config[key] = value;
        }
      }
    }

    // Validate required fields
    if (!config.agentId) {
      console.error('Agent ID is required');
      return null;
    }

    return config;
  }

  // Create widget container
  function createWidgetContainer(config) {
    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style[config.position] = '20px';
    container.style.zIndex = config.zIndex;
    container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.width = '360px';
    container.style.maxWidth = 'calc(100% - 40px)';
    container.style.transition = 'all 0.3s ease';
    container.style.display = 'none';

    // Add custom CSS variables for theming
    container.style.setProperty('--primary-color', config.primaryColor);
    container.style.setProperty('--primary-light', `${config.primaryColor}1a`);
    container.style.setProperty('--text-primary', '#1f2937');
    container.style.setProperty('--text-secondary', '#4b5563');
    container.style.setProperty('--bg-primary', '#ffffff');
    container.style.setProperty('--bg-secondary', '#f3f4f6');
    container.style.setProperty('--border-color', '#e5e7eb');
    container.style.setProperty('--shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)');
    container.style.setProperty('--radius', '12px');

    return container;
  }

  // Create widget button
  function createWidgetButton(config) {
    const button = document.createElement('button');
    button.id = 'chat-widget-button';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style[config.position] = '20px';
    button.style.zIndex = config.zIndex;
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = config.primaryColor;
    button.style.color = '#ffffff';
    button.style.border = 'none';
    button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.fontSize = '24px';
    button.style.transition = 'all 0.2s ease';
    button.setAttribute('aria-label', 'Open chat');
    
    // Add icon
    const icon = document.createElement('span');
    icon.textContent = config.icon || '💬';
    button.appendChild(icon);

    // Add notification badge
    const badge = document.createElement('span');
    badge.id = 'chat-widget-notification';
    badge.style.position = 'absolute';
    badge.style.top = '0';
    badge.style.right = '0';
    badge.style.width = '18px';
    badge.style.height = '18px';
    badge.style.backgroundColor = '#ef4444';
    badge.style.borderRadius = '50%';
    badge.style.color = 'white';
    badge.style.fontSize = '10px';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.opacity = '0';
    badge.style.transition = 'opacity 0.2s';
    button.appendChild(badge);

    return { button, badge };
  }

  // Create widget header
  function createWidgetHeader(config) {
    const header = document.createElement('div');
    header.style.padding = '16px';
    header.style.borderBottom = '1px solid var(--border-color)';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.backgroundColor = 'var(--bg-primary)';
    header.style.borderTopLeftRadius = 'var(--radius)';
    header.style.borderTopRightRadius = 'var(--radius)';

    // Title and subtitle
    const titleContainer = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = config.title;
    title.style.fontWeight = '600';
    title.style.color = 'var(--text-primary)';
    
    const subtitle = document.createElement('div');
    subtitle.textContent = config.subtitle;
    subtitle.style.fontSize = '13px';
    subtitle.style.color = 'var(--text-secondary)';
    
    titleContainer.appendChild(title);
    titleContainer.appendChild(subtitle);
    header.appendChild(titleContainer);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = 'var(--text-secondary)';
    closeButton.style.padding = '0';
    closeButton.style.width = '32px';
    closeButton.style.height = '32px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.borderRadius = '50%';
    closeButton.style.transition = 'background-color 0.2s';
    closeButton.setAttribute('aria-label', 'Close chat');
    
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.backgroundColor = 'var(--bg-secondary)';
    });
    
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.backgroundColor = 'transparent';
    });
    
    header.appendChild(closeButton);

    return { header, closeButton };
  }

  // Create message area
  function createMessageArea() {
    const container = document.createElement('div');
    container.id = 'chat-messages';
    container.style.flex = '1';
    container.style.overflowY = 'auto';
    container.style.padding = '16px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.backgroundColor = 'var(--bg-primary)';

    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'chat-message bot-message';
    welcomeMessage.style.alignSelf = 'flex-start';
    welcomeMessage.style.maxWidth = '80%';
    welcomeMessage.style.padding = '10px 14px';
    welcomeMessage.style.borderRadius = '18px';
    welcomeMessage.style.backgroundColor = 'var(--bg-secondary)';
    welcomeMessage.style.color = 'var(--text-primary)';
    welcomeMessage.style.fontSize = '14px';
    welcomeMessage.style.lineHeight = '1.5';
    welcomeMessage.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    welcomeMessage.textContent = 'Hello! How can I help you today?';
    
    container.appendChild(welcomeMessage);
    container.scrollTop = container.scrollHeight;

    return { container, welcomeMessage };
  }

  // Create input area
  function createInputArea() {
    const container = document.createElement('div');
    container.style.padding = '12px';
    container.style.borderTop = '1px solid var(--border-color)';
    container.style.backgroundColor = 'var(--bg-primary)';
    container.style.borderBottomLeftRadius = 'var(--radius)';
    container.style.borderBottomRightRadius = 'var(--radius)';

    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.gap = '8px';
    form.style.alignItems = 'center';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a message...';
    input.style.flex = '1';
    input.style.padding = '10px 14px';
    input.style.border = '1px solid var(--border-color)';
    input.style.borderRadius = '20px';
    input.style.outline = 'none';
    input.style.fontSize = '14px';
    input.style.backgroundColor = 'var(--bg-secondary)';
    input.style.color = 'var(--text-primary)';
    input.style.transition = 'border-color 0.2s, box-shadow 0.2s';
    input.setAttribute('aria-label', 'Type your message');

    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--primary-color)';
      input.style.boxShadow = '0 0 0 3px var(--primary-light)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'var(--border-color)';
      input.style.boxShadow = 'none';
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.style.width = '40px';
    button.style.height = '40px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = 'var(--primary-color)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.cursor = 'pointer';
    button.style.transition = 'background-color 0.2s, transform 0.1s';
    button.setAttribute('aria-label', 'Send message');
    
    // Send icon
    const sendIcon = document.createElement('span');
    sendIcon.innerHTML = '\u27A4';
    sendIcon.style.fontSize = '18px';
    sendIcon.style.transform = 'rotate(90deg)';
    button.appendChild(sendIcon);

    // Loading spinner (initially hidden)
    const spinner = document.createElement('div');
    spinner.className = 'chat-spinner';
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTopColor = 'white';
    spinner.style.animation = 'spin 1s ease-in-out infinite';
    spinner.style.display = 'none';
    button.appendChild(spinner);

    // Add CSS animation for spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    form.appendChild(input);
    form.appendChild(button);
    container.appendChild(form);

    return { container, form, input, button, spinner };
  }

  // Create typing indicator
  function createTypingIndicator() {
    const container = document.createElement('div');
    container.className = 'typing-indicator';
    container.style.display = 'none';
    container.style.alignSelf = 'flex-start';
    container.style.margin = '4px 0';
    container.style.padding = '10px 16px';
    container.style.backgroundColor = 'var(--bg-secondary)';
    container.style.borderRadius = '18px';
    container.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

    const dots = document.createElement('div');
    dots.style.display = 'flex';
    dots.style.gap = '4px';
    dots.style.alignItems = 'flex-end';
    dots.style.height = '20px';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.style.width = '6px';
      dot.style.height = '6px';
      dot.style.backgroundColor = 'var(--text-secondary)';
      dot.style.borderRadius = '50%';
      dot.style.animation = `bounce 1.4s infinite ${i * 0.16}s`;
      dots.appendChild(dot);
    }

    // Add CSS animation for typing indicator
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 60%, 100% { 
          transform: translateY(0); 
          opacity: 0.4;
        }
        30% { 
          transform: translateY(-6px); 
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    container.appendChild(dots);
    return container;
  }

  // Initialize the widget
  function init() {
    const config = getConfig();
    if (!config) return;

    // Create widget elements
    const widgetContainer = createWidgetContainer(config);
    const { button: widgetButton, badge: notificationBadge } = createWidgetButton(config);
    const { header, closeButton } = createWidgetHeader(config);
    const { container: messageArea, welcomeMessage } = createMessageArea();
    const { container: inputArea, form, input, button: sendButton, spinner } = createInputArea();
    const typingIndicator = createTypingIndicator();

    // Add typing indicator to message area
    messageArea.appendChild(typingIndicator);

    // Build the widget
    widgetContainer.appendChild(header);
    widgetContainer.appendChild(messageArea);
    widgetContainer.appendChild(inputArea);

    // Add elements to the page
    document.body.appendChild(widgetContainer);
    document.body.appendChild(widgetButton);

    // Show welcome message after a short delay
    setTimeout(() => {
      welcomeMessage.style.opacity = '1';
      welcomeMessage.style.transform = 'translateY(0)';
    }, 300);

    // Toggle widget visibility
    function toggleWidget(show) {
      if (show) {
        widgetContainer.style.display = 'block';
        widgetButton.style.display = 'none';
        input.focus();
        
        // Trigger animation
        setTimeout(() => {
          widgetContainer.style.opacity = '1';
          widgetContainer.style.transform = 'translateY(0)';
        }, 10);
        
        // Reset notification
        notificationBadge.style.opacity = '0';
      } else {
        widgetContainer.style.opacity = '0';
        widgetContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          widgetContainer.style.display = 'none';
          widgetButton.style.display = 'flex';
        }, 300);
      }
    }

    // Event listeners
    widgetButton.addEventListener('click', () => toggleWidget(true));
    closeButton.addEventListener('click', () => toggleWidget(false));

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = input.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessage('user', message);
      input.value = '';
      
      // Show typing indicator
      typingIndicator.style.display = 'block';
      messageArea.scrollTop = messageArea.scrollHeight;
      
      // Simulate bot response (in a real app, this would be an API call)
      setTimeout(() => {
        typingIndicator.style.display = 'none';
        addMessage('bot', "I'm a demo bot. In a real implementation, I would connect to your Lyzr agent here!");
      }, 1500);
      
      // In a real implementation, you would make an API call to your backend:
      /*
      try {
        const response = await fetch(`/api/agents/${config.agentId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        typingIndicator.style.display = 'none';
        addMessage('bot', data.response);
      } catch (error) {
        console.error('Error sending message:', error);
        typingIndicator.style.display = 'none';
        addMessage('bot', 'Sorry, there was an error processing your message.');
      }
      */
    });

    // Add a message to the chat
    function addMessage(sender, text) {
      const message = document.createElement('div');
      message.className = `chat-message ${sender}-message`;
      
      // Style based on sender
      if (sender === 'user') {
        message.style.alignSelf = 'flex-end';
        message.style.backgroundColor = 'var(--primary-color)';
        message.style.color = 'white';
      } else {
        message.style.alignSelf = 'flex-start';
        message.style.backgroundColor = 'var(--bg-secondary)';
        message.style.color = 'var(--text-primary)';
      }
      
      message.style.maxWidth = '80%';
      message.style.padding = '10px 14px';
      message.style.borderRadius = '18px';
      message.style.fontSize = '14px';
      message.style.lineHeight = '1.5';
      message.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      message.style.opacity = '0';
      message.style.transform = 'translateY(10px)';
      message.style.transition = 'opacity 0.3s, transform 0.3s';
      
      // Add message content
      message.textContent = text;
      
      // Insert before the typing indicator
      messageArea.insertBefore(message, typingIndicator);
      
      // Animate in
      setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
        messageArea.scrollTop = messageArea.scrollHeight;
      }, 10);
      
      return message;
    }

    // Show notification when receiving a message while chat is closed
    function showNotification() {
      if (widgetContainer.style.display !== 'block') {
        notificationBadge.style.opacity = '1';
        notificationBadge.textContent = '1';
        
        // Optional: Add a subtle animation
        widgetButton.style.animation = 'pulse 1.5s infinite';
        
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
        
        // Reset animation after it completes
        setTimeout(() => {
          widgetButton.style.animation = '';
        }, 1500);
      }
    }

    // Example: Show a welcome message after a delay if autoOpen is true
    if (config.autoOpen) {
      setTimeout(() => {
        toggleWidget(true);
      }, 1000);
    }
    
    // Example: Simulate a notification after 5 seconds
    setTimeout(() => {
      showNotification();
    }, 5000);
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
