const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(text, isUser) {
    const welcomeScreen = chatMessages.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${isUser ? 'user' : 'bot'}`;
    avatar.textContent = isUser ? '👤' : '🦦';

    const messageDiv = document.createElement('div');
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user' : 'bot'}`;
    message.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.appendChild(message);
    messageDiv.appendChild(time);

    wrapper.appendChild(avatar);
    wrapper.appendChild(messageDiv);

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    wrapper.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot';
    avatar.textContent = '🦦';

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(typing);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function handleSend() {
    const text = chatInput.value.trim();
    if (text) {
        addMessage(text, true);
        chatInput.value = '';

        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            addMessage("Thank you for your question! This is a demo interface. In the full version, I'll provide detailed pet care advice based on your query.", false);
        }, 1500);
    }
}

sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});

document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', function() {
        const topic = this.querySelector('h3').textContent;
        chatInput.value = `Tell me about ${topic}`;
        handleSend();
    });
});

document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        chatInput.value = `I need help with ${this.textContent}`;
        handleSend();
    });
});