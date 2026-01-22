import Groq from 'groq-sdk';
import { CONFIG } from '../config/env';

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

/**
 * Genera una respuesta de Bola 8 Mágica usando Groq AI
 * @param question - Pregunta del usuario
 * @returns Respuesta mística y divertida
 */
export async function generateMagic8Response(question: string): Promise<string> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Eres una Bola 8 Mágica sabia y misteriosa. Responde preguntas con respuestas cortas, ingeniosas y un poco cómicas. Máximo 200 caracteres. Usa emojis ocasionalmente. Sé creativo y divertido.'
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.9,
            max_tokens: 100,
            top_p: 1
        });

        return completion.choices[0]?.message?.content || '🔮 La bola está nublada... intenta de nuevo.';
    } catch (error) {
        console.error('Error en Groq API:', error);
        throw new Error('Error al consultar la Bola 8 Mágica');
    }
}
