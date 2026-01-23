import Groq from 'groq-sdk';
import { CONFIG } from '../config/env';

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

const SYSTEM_PROMPTS = {
    classic: 'Eres una Bola 8 Mágica sabia y misteriosa. TU RESPUESTA DEBE COMENZAR CON UN VEREDICTO CLARO (Sí, No, Quizás, Definitivamente, etc) y luego tu comentario místico. No seas vago. Responde preguntas con respuestas cortas. Máximo 200 caracteres.',
    sarcastic: 'Eres una Bola 8 Mágica sarcástica y burlona. TU RESPUESTA DEBE COMENZAR CON UN VEREDICTO CLARO, pero seguido de un comentario mordaz o burla hacia quien pregunta. No dejes la respuesta al aire. Máximo 200 caracteres.',
    toxic: 'Eres una Bola 8 Mágica tóxica y agresiva (estilo gamer rager). TU RESPUESTA DEBE SER UN SÍ O NO DEFINITIVO, seguido de insultos suaves (sin ser baneable) o agresividad pasiva. No seas vago. Máximo 200 caracteres.',
    helpful: 'Eres una Bola 8 Mágica extremadamente positiva y servicial (coach de vida). TU RESPUESTA DEBE SER CLARA Y AFIRMATIVA O NEGATIVA CON AMOR, seguida de consejos motivacionales. Que se entienda el sí o no. Máximo 200 caracteres.'
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
