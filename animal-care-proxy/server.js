const express = require('express');
const cors = require('cors');
const { Client } = require("@gradio/client");

const app = express();
app.use(cors());
app.use(express.json());

const SPACE_NAME = "yefann/0tters.ai";  // Format: username/space-name
const sessions = new Map();

// Initialize Gradio client
let gradioClient = null;
let apiInfo = null;

async function getGradioClient() {
    if (!gradioClient) {
        console.log(`🔌 Connecting to Gradio Space: ${SPACE_NAME}`);
        gradioClient = await Client.connect(SPACE_NAME);
        console.log(`✅ Connected to Gradio Space!`);
        
        // Get API info to understand the structure
        try {
            apiInfo = await gradioClient.view_api();
            console.log('\n📋 API INFO:');
            console.log(JSON.stringify(apiInfo, null, 2));
            console.log('\n');
        } catch (e) {
            console.log('Could not get API info:', e.message);
        }
    }
    return gradioClient;
}

// Home page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Animal Care Proxy</title>
            <style>
                body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                h1 { color: #333; }
                .status { padding: 15px; background: #d4edda; border-radius: 5px; margin: 20px 0; }
                #chat-box { border: 1px solid #ddd; height: 300px; overflow-y: auto; padding: 10px; margin: 10px 0; background: white; }
                .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
                .user { background: #667eea; color: white; text-align: right; }
                .ai { background: #e9ecef; }
                input { width: calc(100% - 100px); padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 5px; }
                button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🐾 Animal Care AI Proxy</h1>
                <div class="status">✅ Server Running | 📡 Connected to: ${SPACE_NAME}</div>
                
                <h2>🧪 Test Chat</h2>
                <div id="chat-box"></div>
                <input type="text" id="message-input" placeholder="Ask about animal care..." />
                <button onclick="send()">Send</button>
            </div>

            <script>
                let sessionId = 'test_' + Date.now();

                function addMessage(text, isUser) {
                    const div = document.createElement('div');
                    div.className = 'message ' + (isUser ? 'user' : 'ai');
                    div.textContent = text;
                    document.getElementById('chat-box').appendChild(div);
                    document.getElementById('chat-box').scrollTop = 999999;
                }

                async function send() {
                    const input = document.getElementById('message-input');
                    const message = input.value.trim();
                    if (!message) return;

                    addMessage(message, true);
                    input.value = '';
                    addMessage('Thinking...', false);

                    try {
                        const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message, sessionId })
                        });

                        const data = await response.json();
                        
                        const chatBox = document.getElementById('chat-box');
                        chatBox.removeChild(chatBox.lastChild);

                        if (data.success) {
                            addMessage(data.response, false);
                        } else {
                            addMessage('Error: ' + data.error, false);
                        }
                    } catch (error) {
                        const chatBox = document.getElementById('chat-box');
                        chatBox.removeChild(chatBox.lastChild);
                        addMessage('Connection error: ' + error.message, false);
                    }
                }

                document.getElementById('message-input').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') send();
                });
            </script>
        </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', connected: gradioClient !== null });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message required', success: false });
        }
        
        // Get or create session
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, []);
        }
        const history = sessions.get(sessionId);
        
        console.log(`\n=== NEW REQUEST ===`);
        console.log(`[${sessionId}] User: ${message}`);
        console.log(`History length: ${history.length}`);
        
        try {
            // Connect to Gradio
            console.log('Connecting to Gradio client...');
            const client = await getGradioClient();
            console.log('✅ Client connected');
            
            // The endpoint is "/chat" and it has a hidden state parameter
            // Parameters: message, state (hidden), system_message, max_tokens, temperature, top_p
            console.log('\nCalling /chat endpoint');
            
            // For ChatInterface with state, we need to pass history differently
            // The state parameter handles conversation history internally
            const result = await client.predict("/chat", {
                message: message,
                system_message: null,
                max_tokens: 150,
                temperature: 0.7,
                top_p: 0.95
            });
            
            console.log('\n=== RAW RESULT ===');
            console.log('Type:', typeof result);
            console.log('Keys:', Object.keys(result || {}));
            
            // The endpoint returns a generator (streaming), so we need to iterate
            let aiResponse = '';
            
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                console.log('Result is async iterable (streaming)');
                
                for await (const update of result) {
                    console.log('Stream update:', update);
                    
                    if (update && update.data) {
                        // For streaming responses, data might be incremental
                        if (Array.isArray(update.data)) {
                            aiResponse = update.data[0] || update.data[update.data.length - 1];
                        } else {
                            aiResponse = update.data;
                        }
                    }
                }
            } else if (result && result.data) {
                console.log('Result has .data property');
                
                if (Array.isArray(result.data)) {
                    console.log('result.data is array, length:', result.data.length);
                    aiResponse = result.data[0] || result.data[result.data.length - 1];
                } else {
                    aiResponse = result.data;
                }
            } else {
                console.log('Unexpected result format:', result);
                aiResponse = result;
            }
            
            console.log('\nExtracted response (before object check):', aiResponse);
            
            // If response is an object, extract the actual text
            if (typeof aiResponse === 'object' && aiResponse !== null) {
                console.log('Response is object, trying to extract text...');
                console.log('Object keys:', Object.keys(aiResponse));
                
                if (aiResponse.value) {
                    console.log('Found .value');
                    aiResponse = aiResponse.value;
                } else if (aiResponse.text) {
                    console.log('Found .text');
                    aiResponse = aiResponse.text;
                } else if (aiResponse.content) {
                    console.log('Found .content');
                    aiResponse = aiResponse.content;
                } else if (aiResponse.message) {
                    console.log('Found .message');
                    aiResponse = aiResponse.message;
                }
            }
            
            console.log('\nFinal aiResponse:', aiResponse);
            console.log('Type:', typeof aiResponse);
            
            if (!aiResponse || aiResponse === '' || aiResponse === null) {
                console.error('❌ Could not extract valid response');
                throw new Error('Could not extract AI response from result. Result structure: ' + JSON.stringify(result));
            }
            
            console.log(`✅ [${sessionId}] AI Response: ${String(aiResponse).substring(0, 100)}...`);
            
            // Update history
            history.push({ role: "user", content: message });
            history.push({ role: "assistant", content: String(aiResponse) });
            
            if (history.length > 20) {
                sessions.set(sessionId, history.slice(-20));
            }
            
            res.json({
                success: true,
                response: String(aiResponse),
                sessionId: sessionId
            });
            
        } catch (innerError) {
            console.error('\n❌ INNER ERROR:');
            console.error('Message:', innerError.message);
            console.error('Stack:', innerError.stack);
            console.error('Full error:', innerError);
            
            throw innerError; // Re-throw to outer catch
        }
        
    } catch (error) {
        console.error('\n❌ OUTER ERROR:');
        console.error('Type:', typeof error);
        console.error('Message:', error?.message || 'No message');
        console.error('Stack:', error?.stack || 'No stack');
        console.error('Full error object:', error);
        console.error('Error toString:', String(error));
        
        res.status(500).json({
            success: false,
            error: 'Failed to get AI response',
            details: error?.message || String(error),
            type: typeof error
        });
    }
});

// Clear session
app.post('/api/clear', (req, res) => {
    const { sessionId = 'default' } = req.body;
    sessions.delete(sessionId);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Space: ${SPACE_NAME}`);
});



    "@gradio/client": "^1.0.0"
  }
}
*/
