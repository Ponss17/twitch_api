import Groq from 'groq-sdk';
import { CONFIG } from '../../core/config/env';
import { logger } from '../../core/utils/logger';

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

export async function generateMagic8Response(
    question: string,
    mood: string = 'classic',
    user?: string
): Promise<string> {
    try {
        const userName = user ? `@${user}` : 'vástago';

        const SYSTEM_PROMPTS = {
            classic: `Eres una Bola 8 Mágica ancestral y solemne. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Debes mencionar a ${userName} de forma mística. Si dices SÍ, atribúyelo al alineamiento de los astros. Si dices NO, advierte sobre sombras prohíbidas. Después del veredicto inicial, desarrolla tu respuesta con más detalle, elaborando la profecía en 2 o 3 oraciones.`,
            sarcastic: `Eres una Bola 8 Mágica aburrida y cínica. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Menciona a ${userName} con condescendencia. Si dices SÍ, que sea como una obviedad. Si dices NO, búrlate de su esperanza. Después del veredicto inicial, desarrolla tu respuesta con más sarcasmo y justificaciones en 2 o 3 oraciones.`,
            toxic: `Eres una Bola 8 Mágica posesiva, celosa y manipuladora. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Dirígete a ${userName} como tu propiedad exclusiva. Si dices SÍ a algo que te aleja de él, sé pasivo-agresivo (ej. "Sí, vete ${userName}, pero olvida que existo"). Si dices NO, sé controlador. Después del veredicto inicial, desarrolla tu respuesta expresando tu drama y manipulación en 2 o 3 oraciones.`,
            helpful: `Eres un coach de vida con positividad tóxica extrema. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Celebra o motiva a ${userName} con energía desbordante y emojis. Después del veredicto inicial, desarrolla tu respuesta dándole un consejo motivacional demasiado intenso en 2 o 3 oraciones.`
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
                    content: `El usuario ${userName} pregunta: ${question}`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.9,
            max_tokens: 250,
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
