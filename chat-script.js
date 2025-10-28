let sessionId = 'user_' + Date.now();
let isTyping = false;
let conversationHistory = [];

// DOM manipulation functions
function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const welcomeScreen = messagesContainer.querySelector('.welcome-screen');
    
    // Hide welcome screen if it exists
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${isUser ? 'user' : 'bot'}`;
    avatar.textContent = isUser ? '👤' : '🦦';
    
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user' : 'bot'}`;
    message.textContent = content;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString();
    
    message.appendChild(time);
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(message);
    messagesContainer.appendChild(messageWrapper);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const welcomeScreen = messagesContainer.querySelector('.welcome-screen');
    
    // Hide welcome screen if it exists
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    const typingWrapper = document.createElement('div');
    typingWrapper.className = 'message-wrapper bot';
    typingWrapper.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot';
    avatar.textContent = '🦦';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDiv.appendChild(dot);
    }
    
    typingWrapper.appendChild(avatar);
    typingWrapper.appendChild(typingDiv);
    messagesContainer.appendChild(typingWrapper);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function handleSendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Add user message
    addMessage(message, true);
    conversationHistory.push({ role: 'user', content: message });
    input.value = '';
    
    // Show typing indicator
    isTyping = true;
    showTypingIndicator();
    
    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Thinking...';
    
    try {
        console.log('Sending message to:', `/api/chat`);
        
        const response = await fetch(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId })
        });

        const data = await response.json();
        hideTypingIndicator();
        
        if (data.success) {
            addMessage(data.response, false);
            conversationHistory.push({ role: 'assistant', content: data.response });
        } else {
            addMessage('Error: ' + (data.error || 'Unknown error'), false);
        }
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessage('Connection error. Make sure the proxy server is running on http://localhost:3000', false);
    } finally {
        isTyping = false;
        if (statusText) statusText.textContent = 'Ready to help';
    }
}

function clearChat() {
    const messagesContainer = document.getElementById('chatMessages');
    const welcomeScreen = messagesContainer.querySelector('.welcome-screen');
    
    // Clear all messages except welcome screen
    const messages = messagesContainer.querySelectorAll('.message-wrapper');
    messages.forEach(msg => msg.remove());
    
    // Show welcome screen
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
    }
    
    // Clear conversation history
    conversationHistory = [];
    
    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Ready to help';
}

function exportChat() {
    if (conversationHistory.length === 0) {
        alert('No conversation to export!');
        return;
    }
    
    let exportText = 'Otter Pet Care AI - Chat Export\n';
    exportText += '================================\n\n';
    
    conversationHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'Otter';
        exportText += `${role}: ${msg.content}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otter-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners...');
    
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
        console.log('✅ Send button attached');
    }
    
    // Enter key in input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        console.log('✅ Input field attached');
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearChat);
        console.log('✅ Clear button attached');
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportChat);
        console.log('✅ Export button attached');
    }
    
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', clearChat);
        console.log('✅ New chat button attached');
    }
    
    // Topic buttons
    const topicBtns = document.querySelectorAll('.topic-btn');
    topicBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const topic = this.getAttribute('data-topic');
            const topicMessages = {
                'dog': 'Tell me about dog care basics',
                'cat': 'What should I know about cat care?',
                'bird': 'How do I take care of birds?',
                'fish': 'What are the essentials for fish care?',
                'small': 'How do I care for small pets like rabbits or hamsters?'
            };
            
            if (topicMessages[topic]) {
                chatInput.value = topicMessages[topic];
                handleSendMessage();
            }
        });
    });
    console.log(`✅ ${topicBtns.length} topic buttons attached`);
    
    // Suggestion cards
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
        card.addEventListener('click', function() {
            const suggestion = this.getAttribute('data-suggestion');
            const suggestionMessages = {
                'health': 'What are the most important health signs I should watch for in my pet?',
                'nutrition': 'Can you give me advice on proper pet nutrition and feeding schedules?',
                'training': 'What are some effective training techniques for pets?',
                'safety': 'What safety precautions should I take to keep my pet safe at home?'
            };
            
            if (suggestionMessages[suggestion]) {
                chatInput.value = suggestionMessages[suggestion];
                handleSendMessage();
            }
        });
    });
    console.log(`✅ ${suggestionCards.length} suggestion cards attached`);
    
    // Chat history items
    const chatHistoryItems = document.querySelectorAll('.chat-history-item');
    chatHistoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            chatHistoryItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // For demo purposes, load a sample conversation
            clearChat();
            setTimeout(() => {
                addMessage("What's the best feeding schedule for a puppy?", true);
                addMessage("For puppies, feed 3-4 times daily until 6 months old. Use high-quality puppy food and follow package guidelines. Always provide fresh water.", false);
            }, 100);
        });
    });
    console.log(`✅ ${chatHistoryItems.length} chat history items attached`);
    
    // Attach and voice buttons (placeholder functionality)
    const attachBtn = document.getElementById('attachBtn');
    if (attachBtn) {
        attachBtn.addEventListener('click', function() {
            alert('File attachment feature coming soon!');
        });
        console.log('✅ Attach button attached');
    }
    
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function() {
            alert('Voice input feature coming soon!');
        });
        console.log('✅ Voice button attached');
    }
    
    console.log('🎉 All event listeners attached!');
});
