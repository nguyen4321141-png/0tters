import { Client } from '@gradio/client';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { message, sessionId } = req.body;

        try {
            // Connect to the Gradio client
            const client = await Client.connect("yefann/0tters.ai"); // Make sure this is correct
            const result = await client.predict("/chat", { message });

            res.status(200).json({ success: true, response: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ success: false, error: "Method Not Allowed" });
    }
}

