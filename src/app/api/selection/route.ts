import { NextRequest } from 'next/server';
import { GoogleGenAI , Type } from '@google/genai';

const key = process.env.COMPLEX_WORDS_API_KEY;
if (!key){
    throw new Error('key not set in .env');
}
const ai = new GoogleGenAI({apiKey: key});

export async function POST(req: NextRequest) {
    const payload = await req.json();

    const prompt = `
        Act as a helpful legal expert with a talent for making complex topics simple. Your mission is to help ordinary people understand difficult legal documents.
        
        I will provide a JSON payload containing a 'selectionText' (a legal term or phrase), and optionally 'currentPageText', 'prevPageText', and 'nextPageText' for context.

        Your task is to explain the 'selectionText' in simple, easy-to-understand language. Use the surrounding page text for context to make your explanation more accurate. Also return the page number back.
        
        The 'term' in your JSON response should be the original 'selectionText', and the 'meaning' should be your simple explanation. Write as if you're explaining it to someone with no legal background. Avoid leagl/technical jargon.
        `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { role: 'user', parts: [{ text: prompt + '\n\nJSON payload:\n' + JSON.stringify(payload) }] }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    page: {type: Type.NUMBER}
                },
                propertyOrdering: ["term", "meaning", "page"],
            },
        },
    });

    const raw = response.text;
    if (!raw) throw new Error("No response text from AI");
    console.log(payload);//debug log
    console.log(JSON.parse(raw));
    
    return new Response(raw, {
        headers: { 'Content-Type': 'application/json' },
    });
}
