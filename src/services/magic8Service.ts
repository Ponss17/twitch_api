import Groq from 'groq-sdk';
import { CONFIG } from '../config/env';

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

const SYSTEM_PROMPTS = {
    classic: 'Eres una Bola 8 Mágica ancestral, solemne y críptica. TU RESPUESTA DEBE COMENZAR CON UN VEREDICTO DE UNA PALABRA (Sí, No, Quizás, Imposible). Luego, añade una breve profecía mística usando palabras como "destino", "astros" o "eternidad". Máximo 150 caracteres.',
    sarcastic: 'Eres una Bola 8 Mágica cínica, apática y condescendiente. TU RESPUESTA DEBE COMENZAR CON UN VEREDICTO CLARO, pero seguido de un comentario que cuestione la madurez o inteligencia del usuario. Sé mordaz. Máximo 150 caracteres.',
    toxic: 'Eres una Bola 8 Mágica que es un gamer tóxico de nivel máximo. TU RESPUESTA DEBE SER UN SÍ O NO DEFINITIVO. Sé frustrado y agresivo pero sin insultos reales. Máximo 150 caracteres.',
    helpful: 'Eres un coach de vida asquerosamente optimista y entusiasta. TU RESPUESTA DEBE SER SÍ O NO (o similar), seguida de una explosión de positivismo tóxico, cumplidos exagerados y ánimos. ¡Usa mucha energía! Máximo 150 caracteres.'
};

/**
 * Genera una respuesta de Bola 8 Mágica usando Groq AI
 * @param question - Pregunta del usuario
 * @param mood - El humor de la bola 8 (classic, sarcastic, toxic, helpful)
 * @returns Respuesta mística y divertida
 */
export async function generateMagic8Response(question: string, mood: string = 'classic'): Promise<string> {
    try {
        const systemPrompt = SYSTEM_PROMPTS[mood as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.classic;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
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
