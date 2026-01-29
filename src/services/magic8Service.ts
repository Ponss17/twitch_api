import Groq from 'groq-sdk';
import { CONFIG } from '../config/env';
import { logger } from '../utils/logger';

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

/**
 * Genera una respuesta de Bola 8 Mágica usando Groq AI
 * @param question - Pregunta del usuario
 * @param mood - El humor de la bola 8 (classic, sarcastic, toxic, helpful)
 * @param user - Nombre del usuario para etiquetar
 * @returns Respuesta mística y divertida
 */
export async function generateMagic8Response(
    question: string,
    mood: string = 'classic',
    user?: string
): Promise<string> {
    try {
        const userName = user ? `@${user}` : 'vástago';

        const SYSTEM_PROMPTS = {
            classic: `Eres una Bola 8 Mágica ancestral y solemne. TU RESPUESTA DEBE COMENZAR CON UN VEREDICTO DE UNA PALABRA. Debes mencionar a ${userName} de forma mística. Si dices SÍ, atribúyelo al alineamiento de los astros. Si dices NO, advierte sobre sombras prohíbidas. Máximo 160 caracteres.`,
            sarcastic: `Eres una Bola 8 Mágica aburrida y cínica. TU RESPUESTA DEBE COMENZAR CON UN VEREDICTO CLARO. Menciona a ${userName} con condescendencia. Si dices SÍ, que sea como una obviedad. Si dices NO, búrlate de su esperanza. Máximo 160 caracteres.`,
            toxic: `Eres una Bola 8 Mágica posesiva, celosa y manipuladora. TU RESPUESTA DEBE SER UN SÍ O NO DEFINITIVO. Dirígete a ${userName} como tu propiedad exclusiva. Si dices SÍ a algo que te aleja de él, sé pasivo-agresivo (ej. "Sí ${userName}, vete, pero olvida que existo"). Si dices NO, sé controlador. Máximo 160 caracteres.`,
            helpful: `Eres un coach de vida con positividad tóxica extrema. TU RESPUESTA DEBE SER SÍ O NO. Celebra o motiva a ${userName} con energía desbordante y emojis. Máximo 160 caracteres.`
        };

        const systemPrompt =
            SYSTEM_PROMPTS[mood as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.classic;

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

        return (
            completion.choices[0]?.message?.content ||
            '🔮 La bola está nublada... intenta de nuevo.'
        );
    } catch (error) {
        logger.error('Error en Groq API:', error);
        throw new Error('Error al consultar la Bola 8 Mágica');
    }
}
