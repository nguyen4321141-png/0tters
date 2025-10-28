import { Client } from '@gradio/client';

// Store sessions in memory (resets on serverless cold starts)
const sessions = new Map();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { message, sessionId = 'default' } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        try {
            console.log(`[${sessionId}] User: ${message}`);

            // Connect to the Gradio Space
            const client = await Client.connect("yefann/0tters.ai");
            
            // Get or create session history
            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, []);
            }
            const history = sessions.get(sessionId);

            // Call the /chat endpoint
            const result = await client.predict("/chat", {
                message: message,
                system_message: null,
                max_tokens: 150,
                temperature: 0.7,
                top_p: 0.95
            });

            console.log('Raw result:', JSON.stringify(result));

            // Extract the actual response text from the result
            let aiResponse = '';
            
            // Handle streaming response
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                console.log('Handling streaming response...');
                for await (const update of result) {
                    if (update && update.data) {
                        if (Array.isArray(update.data)) {
                            aiResponse = update.data[0] || update.data[update.data.length - 1];
                        } else {
                            aiResponse = update.data;
                        }
                    }
                }
            } 
            // Handle non-streaming response
            else if (result && result.data) {
                console.log('Handling non-streaming response...');
                if (Array.isArray(result.data)) {
                    aiResponse = result.data[0] || result.data[result.data.length - 1];
                } else {
                    aiResponse = result.data;
                }
            }
            // Fallback: try to extract from result directly
            else if (result) {
                aiResponse = result;
            }

            // Extract string if it's an object
            if (typeof aiResponse === 'object' && aiResponse !== null) {
                aiResponse = aiResponse.value || 
                           aiResponse.text || 
                           aiResponse.content || 
                           aiResponse.message ||
                           JSON.stringify(aiResponse);
            }

            // Convert to string
            const finalResponse = String(aiResponse || 'Sorry, I could not generate a response.');

            console.log(`[${sessionId}] AI: ${finalResponse.substring(0, 100)}...`);

            // Update session history
            history.push({ role: 'user', content: message });
            history.push({ role: 'assistant', content: finalResponse });
            
            // Keep only last 20 messages
            if (history.length > 20) {
                sessions.set(sessionId, history.slice(-20));
            }

            return res.status(200).json({ 
                success: true, 
                response: finalResponse,
                sessionId: sessionId
            });

        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ 
                success: false, 
                error: error.message || 'Failed to get AI response'
            });
        }
    } else {
        return res.status(405).json({ 
            success: false, 
            error: 'Method Not Allowed' 
        });
    }
}
