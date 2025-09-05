import { NextRequest } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const key = process.env.COMPLEX_WORDS_API_KEY;
if (!key) {
    throw new Error('API key not set in .env');
}
const ai = new GoogleGenAI({ apiKey: key });

export async function POST(req: NextRequest) {
    console.log('🌐 Translation API called');
    
    try {
        const { text, texts, targetLanguage, pageNumber, isDocumentTranslation } = await req.json();
        
        console.log(`📄 Translating page ${pageNumber}`);
        console.log(`🎯 Target language: ${targetLanguage}`);
        console.log(`📚 Document translation mode: ${isDocumentTranslation}`);
        
        const prompt = isDocumentTranslation ? `
            You are a professional document translator. Translate the following complete page text to ${targetLanguage}.
            
            Important Rules:
            1. Preserve ALL document structure and formatting
            2. Maintain headings, titles, article numbers, section breaks
            3. Keep the hierarchical structure (Article 1, Article 2, etc.)
            4. Translate naturally while preserving legal/formal document structure
            5. Keep proper nouns, legal references, and numbers exactly as they are
            6. Maintain paragraph breaks and spacing
            7. If there are numbered or lettered sections, keep that numbering
            8. Preserve any special formatting like bullet points or lists
            9. Make the translation readable and natural for native ${targetLanguage} speakers
            10. Maintain the document's professional tone and legal language style
            
            Return the translated text with proper formatting preserved. Use line breaks and spacing to maintain document structure.
            
            Original page text to translate: ${text}
        ` : `
            You are a professional translator. Translate the following texts to ${targetLanguage}.
            
            Rules:
            1. Maintain the original formatting and structure
            2. If text contains technical terms, preserve them or provide brief explanations
            3. If text appears to be from images (like signs, labels), translate accordingly
            4. Keep proper nouns (names, places) as they are unless they have standard translations
            5. Preserve numbers, dates, and mathematical expressions
            
            Return a JSON array with translations in the same order as input.
            
            Input texts: ${JSON.stringify(texts)}
        `;

        console.log('🤖 Sending to AI for translation...');
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: 'user', parts: [{ text: prompt }] }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: isDocumentTranslation ? {
                    type: Type.OBJECT,
                    properties: {
                        translatedText: { type: Type.STRING }
                    },
                    required: ['translatedText']
                } : {
                    type: Type.OBJECT,
                    properties: {
                        translations: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['translations']
                },
            },
        });

        const result = response.text;
        if (!result) {
            throw new Error("No response from AI");
        }
        
        // const parsed = JSON.parse(result);
        console.log('✅ Translation successful');
        
        return new Response(result, {
            headers: { 'Content-Type': 'application/json' },
        });
        
    } catch (error) {
        console.error('❌ Translation API error:', error);
        return new Response(
            JSON.stringify({ error: 'Translation failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}