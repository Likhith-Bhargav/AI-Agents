// Configuration
const defaultConfig = {
  agentId: '',
  position: 'bottom-right',
  primaryColor: '#2563eb',
  title: 'Chat with us',
  subtitle: 'We\'re here to help!',
  greeting: 'Hello! How can I help you today?',
  showBranding: true,
};

class SupportWidget {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.isOpen = false;
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
  }

  async initialize() {
    this.createWidget();
    this.attachStyles();
    await this.loadMessages();
  }

  createWidget() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'support-widget-container';
    this.container.className = 'support-widget-container';
    
    // Create button
    this.button = document.createElement('button');
    this.button.className = 'support-widget-button';
    this.button.innerHTML = '💬';
    this.button.addEventListener('click', () => this.toggleChat());
    
    // Create chat box
    this.chatBox = document.createElement('div');
    this.chatBox.className = 'support-widget-chat';
    
    // Chat header
    const header = document.createElement('div');
    header.className = 'support-widget-header';
    header.innerHTML = `
      <div>
        <h3>${this.config.title}</h3>
        <p>${this.config.subtitle}</p>
      </div>
      <button class="support-widget-close">×</button>
    `;
    
    // Messages container
    const messages = document.createElement('div');
    messages.className = 'support-widget-messages';
    this.messagesContainer = messages;
    
    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'support-widget-input';
    inputArea.innerHTML = `
      <input type="text" placeholder="Type your message...">
      <button>Send</button>
    `;
    
    // Assemble chat box
    this.chatBox.appendChild(header);
    this.chatBox.appendChild(messages);
    this.chatBox.appendChild(inputArea);
    
    // Add elements to container
    this.container.appendChild(this.button);
    this.container.appendChild(this.chatBox);
    
    // Add to body
    document.body.appendChild(this.container);
    
    // Add event listeners
    this.setupEventListeners();
    
    // Add greeting message
    this.addMessage({
      content: this.config.greeting,
      isUser: false,
      timestamp: new Date().toISOString()
    });
  }

  attachStyles() {
    if (document.getElementById('support-widget-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'support-widget-styles';
    style.textContent = `
      .support-widget-container {
        position: fixed;
        ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .support-widget-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .support-widget-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      .support-widget-chat {
        position: absolute;
        ${this.config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
        ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
        width: 350px;
        max-height: 600px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
      }
      
      .support-widget-chat.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      
      .support-widget-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .support-widget-header h3, 
      .support-widget-header p {
        margin: 0;
      }
      
      .support-widget-header p {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .support-widget-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0 8px;
        line-height: 1;
      }
      
      .support-widget-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .support-widget-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .support-widget-message.user {
        align-self: flex-end;
        background: ${this.config.primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .support-widget-message.agent {
        align-self: flex-start;
        background: #f3f4f6;
        color: #111827;
        border-bottom-left-radius: 4px;
      }
      
      .support-widget-input {
        display: flex;
        padding: 12px;
        border-top: 1px solid #e5e7eb;
      }
      
      .support-widget-input input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .support-widget-input input:focus {
        border-color: ${this.config.primaryColor};
      }
      
      .support-widget-input button {
        margin-left: 8px;
        padding: 0 16px;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .support-widget-input button:hover {
        background: #1d4ed8;
      }
      
      .support-widget-typing {
        display: inline-block;
        padding: 8px 16px;
        background: #f3f4f6;
        border-radius: 18px;
        font-size: 14px;
        color: #6b7280;
      }
      
      .support-widget-typing span {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        margin: 0 2px;
        animation: support-widget-bounce 1.4s infinite ease-in-out both;
      }
      
      .support-widget-typing span:nth-child(1) { animation-delay: -0.32s; }
      .support-widget-typing span:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes support-widget-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `;
    
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Toggle chat
    this.button.addEventListener('click', () => this.toggleChat());
    
    // Close button
    const closeBtn = this.chatBox.querySelector('.support-widget-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleChat(false));
    }
    
    // Send message on Enter
    const input = this.chatBox.querySelector('input');
    const sendBtn = this.chatBox.querySelector('.support-widget-input button');
    
    const sendMessage = () => {
      const message = input.value.trim();
      if (message) {
        this.sendMessage(message);
        input.value = '';
      }
    };
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    sendBtn.addEventListener('click', sendMessage);
  }

  toggleChat(show = !this.isOpen) {
    this.isOpen = show;
    this.chatBox.classList.toggle('visible', show);
    
    if (show) {
      this.chatBox.querySelector('input')?.focus();
    }
  }

  addMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `support-widget-message ${message.isUser ? 'user' : 'agent'}`;
    messageEl.textContent = message.content;
    
    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    return messageEl;
  }

  showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'support-widget-typing';
    typingEl.id = 'support-widget-typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    this.messagesContainer.appendChild(typingEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingEl = document.getElementById('support-widget-typing');
    if (typingEl) {
      typingEl.remove();
    }
  }

  async sendMessage(content) {
    if (!content.trim()) return;
    
    // Add user message
    this.addMessage({
      content,
      isUser: true,
      timestamp: new Date().toISOString()
    });
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Send message to your API
      const response = await fetch('https://your-api-url.com/api/widget/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId: this.sessionId,
          agentId: this.config.agentId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Remove typing indicator and add response
      this.hideTypingIndicator();
      this.addMessage({
        content: data.content,
        isUser: false,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.hideTypingIndicator();
      this.addMessage({
        content: 'Sorry, something went wrong. Please try again later.',
        isUser: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  async loadMessages() {
    try {
      // Load previous messages if needed
      // const response = await fetch(`/api/chat/history?sessionId=${this.sessionId}`);
      // const messages = await response.json();
      // messages.forEach(msg => this.addMessage(msg));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }
}

// Auto-initialize if script is loaded with data attributes
if (document.currentScript) {
  const script = document.currentScript;
  const config = {
    agentId: script.getAttribute('data-agent-id') || '',
    position: script.getAttribute('data-position') || 'bottom-right',
    primaryColor: script.getAttribute('data-color') || '#2563eb',
    title: script.getAttribute('data-title') || 'Chat with us',
    subtitle: script.getAttribute('data-subtitle') || 'We\'re here to help!',
    greeting: script.getAttribute('data-greeting') || 'Hello! How can I help you today?',
    showBranding: script.getAttribute('data-branding') !== 'false',
  };
  
  // Initialize widget
  new SupportWidget(config);
}

// Export for manual initialization
window.SupportWidget = SupportWidget;
