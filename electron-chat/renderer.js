const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');

let thinkingElement = null;

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim() !== '') {
        // Display user message
        const userMessageElement = document.createElement('div');
        userMessageElement.textContent = `You: ${message}`;
        chatBox.appendChild(userMessageElement);

        // Clear input
        messageInput.value = '';

        // Show thinking indicator
        thinkingElement = document.createElement('div');
        thinkingElement.textContent = 'Gemini is typing...';
        chatBox.appendChild(thinkingElement);

        // Send message to main process
        window.electronAPI.sendMessage(message);
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButton.click();
    }
});

window.electronAPI.onReply((message) => {
    // Remove "thinking" indicator
    if (thinkingElement) {
        chatBox.removeChild(thinkingElement);
        thinkingElement = null;
    }

    const geminiMessageElement = document.createElement('div');
    geminiMessageElement.textContent = `Gemini: ${message}`;
    chatBox.appendChild(geminiMessageElement);
});
