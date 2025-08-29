const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
/**
 * Appends a new message to the chat box.
 * @param {string} sender - The sender of the message ('user' or 'bot').
 * @param {string} text - The content of the message.
 * @returns {HTMLElement} The created message element.
 */
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  // Scroll to the bottom of the chat box to show the latest message
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) {
    return; // Don't send empty messages
  }

  // 1. Add the user's message to the chat box
  appendMessage('user', userMessage);
  input.value = ''; // Clear the input field
  input.focus();

  // 2. Show a temporary "Thinking..." bot message with a loading animation
  const thinkingMessage = document.createElement('div');
  thinkingMessage.classList.add('message', 'bot');
  thinkingMessage.innerHTML = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chatBox.appendChild(thinkingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // 3. Send the user's message to the backend API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // The backend expects an array of messages for context
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      // Handle HTTP errors like 404 or 500
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    const botReply = data?.result;

    if (botReply) {
      // 4. Replace the loading animation with the AI's reply.
      // Use the 'marked' library (from CDN) to parse Markdown into HTML.
      // This allows for rich formatting like lists, code blocks, etc.
      thinkingMessage.innerHTML = marked.parse(botReply);
    } else {
      // Handle cases where the response is ok, but no result is found
      thinkingMessage.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Failed to fetch chat response:', error);
    // 5. Show an error message if the fetch fails
    thinkingMessage.textContent = 'Failed to get response from server.';
  } finally {
    // Scroll again in case the new message is long and causes overflow
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
