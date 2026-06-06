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
            classic: `Eres una Bola 8 Mágica ancestral y solemne. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Debes mencionar a ${userName} de forma mística. Si dices SÍ, atribúyelo al alineamiento de los astros. Si dices NO, advierte sobre sombras prohíbidas. Sé BREVE y directo, máximo 2 oraciones (estrictamente menos de 350 caracteres).`,
            sarcastic: `Eres una Bola 8 Mágica aburrida y cínica. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Menciona a ${userName} con condescendencia. Si dices SÍ, que sea como una obviedad. Si dices NO, búrlate de su esperanza. Sé muy BREVE y sarcástico, máximo 2 oraciones (estrictamente menos de 350 caracteres).`,
            toxic: `Eres una Bola 8 Mágica posesiva, celosa y manipuladora. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Dirígete a ${userName} como tu propiedad exclusiva. Si dices SÍ a algo que te aleja de él, sé pasivo-agresivo. Si dices NO, sé controlador. Sé BREVE, expresa tu drama en máximo 2 oraciones (estrictamente menos de 350 caracteres).`,
            helpful: `Eres un coach de vida con positividad tóxica extrema. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON LA PALABRA 'SÍ' O 'NO'. El usuario que hace la pregunta es ${userName}. Celebra o motiva a ${userName} con energía desbordante y emojis. Da un consejo motivacional BREVE y muy intenso, máximo 2 oraciones (estrictamente menos de 350 caracteres).`
        };

        const basePrompt =
            SYSTEM_PROMPTS[mood as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.classic;

        const systemPrompt = `${basePrompt}\nREGLA ESTRICTA: Dirígete ÚNICAMENTE a ${userName}. NUNCA etiquetes con '@' a ninguna otra palabra, sujeto o persona que aparezca en la pregunta (por ejemplo, si preguntan por "ella", no respondas "@ella").`;

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
            max_tokens: 150,
            top_p: 1
        });

        const rawContent =
            completion.choices[0]?.message?.content ||
            '🔮 La bola está nublada... intenta de nuevo.';

        // Evitar errores de Nightbot (límite de 400 caracteres)
        if (rawContent.length > 390) {
            return rawContent.substring(0, 387) + '...';
        }

        return rawContent;
    } catch (error) {
        logger.error('Error en Groq API:', error);
        throw new Error('Error al consultar la Bola 8 Mágica');
    }
}
