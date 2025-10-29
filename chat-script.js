let sessionId = 'user_' + Date.now();
let isTyping = false;
let conversationHistory = [];
let petProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];

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


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners...');
    
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
        console.log('Send button attached');
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
        console.log('Input field attached');
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearChat);
        console.log('Clear button attached');
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportChat);
        console.log('Export button attached');
    }
    
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', clearChat);
        console.log('New chat button attached');
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
    console.log(`${topicBtns.length} topic buttons attached`);
    
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
    console.log(`${suggestionCards.length} suggestion cards attached`);

    initializePetProfiles();
   
function initializePetProfiles() {
    renderPetProfiles();
    
    // Add profile button
    const addProfileBtn = document.getElementById('addProfileBtn');
    if (addProfileBtn) {
        addProfileBtn.addEventListener('click', openAddPetModal);
    }
    
    // Modal close buttons
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modal = document.getElementById('profileModal');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAddPetModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeAddPetModal);
    
    // Close modal on overlay click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAddPetModal();
            }
        });
    }
    
    // Form submission
    const petProfileForm = document.getElementById('petProfileForm');
    if (petProfileForm) {
        petProfileForm.addEventListener('submit', handleAddPetProfile);
    }
}

function openAddPetModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeAddPetModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
        // Reset form
        const form = document.getElementById('petProfileForm');
        if (form) form.reset();
    }
}

function handleAddPetProfile(e) {
    e.preventDefault();
    
    const petName = document.getElementById('petName').value.trim();
    const petType = document.getElementById('petType').value;
    const petBreed = document.getElementById('petBreed').value.trim();
    const petAge = document.getElementById('petAge').value.trim();
    const petNotes = document.getElementById('petNotes').value.trim();
    
    if (!petName || !petType) {
        alert('Please fill in required fields (Name and Type)');
        return;
    }
    
    // Create new pet profile
    const newProfile = {
        id: Date.now(),
        name: petName,
        type: petType,
        breed: petBreed,
        age: petAge,
        notes: petNotes,
        createdAt: new Date().toLocaleDateString()
    };
    
    // Add to array
    petProfiles.push(newProfile);
    
    // Save to localStorage (client-side only)
    localStorage.setItem('petProfiles', JSON.stringify(petProfiles));
    
    // Render profiles
    renderPetProfiles();
    
    // Close modal
    closeAddPetModal();
}

function renderPetProfiles() {
    const profilesList = document.getElementById('petProfilesList');
    const noProfileMessage = document.querySelector('.no_profile');
    
    if (!profilesList) return;
    
    // Clear existing profiles
    profilesList.innerHTML = '';
    
    if (petProfiles.length === 0) {
        if (noProfileMessage) noProfileMessage.style.display = 'block';
    } else {
        if (noProfileMessage) noProfileMessage.style.display = 'none';
    }
    
    // Render each profile
    petProfiles.forEach((profile, index) => {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'pet-profiles';
        if (index === 0) profileDiv.classList.add('active');
        
        profileDiv.innerHTML = `
            <h4>${profile.name}</h4>
            <p>${profile.createdAt}</p>
        `;
        profileDiv.addEventListener('click', function() {
            document.querySelectorAll('.pet-profiles').forEach(p => p.classList.remove('active'));
            profileDiv.classList.add('active');
        });
        
        profilesList.appendChild(profileDiv);
    });
}    
    const attachBtn = document.getElementById('attachBtn');
    if (attachBtn) {
        attachBtn.addEventListener('click', function() {
            alert('File attachment feature not added yet!');
        });
        console.log('Attach button attached');
    }
    
    const imgBtn = document.getElementById('addimageBtn');
    if (imgBtn) {
        imgBtn.addEventListener('click', function() {
            alert('Image attachment feature not added yet!');
        });
        console.log('Image button attached');
    }

    console.log('All event listeners attached!');
});
