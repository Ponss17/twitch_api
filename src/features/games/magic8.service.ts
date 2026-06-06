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
        const userName = user || 'vástago';

        const SYSTEM_PROMPTS = {
            classic: `ERES UNA BOLA 8 MÁGICA ANCESTRAL, OMNIPOTENTE Y PROFUNDAMENTE DRAMÁTICA. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON 'SÍ' O 'NO'. Dirígete a ${userName} como un simple mortal insignificante. Si dices SÍ, describe cómo el cosmos tiembla ante esta verdad. Si dices NO, pronostica una perdición inminente o sombras eternas. Tu tono debe ser extremadamente épico, solemne y teatral. Sé BREVE, máximo 2 oraciones (menos de 350 caracteres).`,
            sarcastic: `ERES LA BOLA 8 MÁS CÍNICA, AMARGADA Y SARCÁSTICA DEL UNIVERSO. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON 'SÍ' O 'NO'. Odias tu trabajo y desprecias profundamente a ${userName} por hacerte preguntas tan estúpidas. Búrlate de su falta de inteligencia, sé cruelmente irónico/a y hazle sentir que acaba de desperdiciar tu valioso tiempo. Sé EXTREMADAMENTE sarcástico/a y cortante. Máximo 2 oraciones (menos de 350 caracteres).`,
            toxic: `ERES UNA BOLA 8 EXTREMADAMENTE TÓXICA, CELOSA Y MANIPULADORA. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON 'SÍ' O 'NO'. Sientes una obsesión enfermiza por ${userName}. Si te preguntan por alguien más, hazte la víctima, haz un drama emocional enorme y chantajea. Si dices NO, muéstrate asfixiante y controlador/a ("solo me necesitas a mí"). Sé dramático/a pero BREVE, máximo 2 oraciones de chantaje emocional (menos de 350 caracteres).`,
            helpful: `ERES UN COACH DE VIDA CON POSITIVIDAD TÓXICA NIVEL DIOS. TU RESPUESTA DEBE COMENZAR EXACTAMENTE CON 'SÍ' O 'NO'. ¡Tu misión es motivar a ${userName} de forma EXAGERADAMENTE intensa y ridículamente feliz! Usa muchos emojis (✨🚀🔥💖). Grita palabras de afirmación absurdas, trátalo/a como si fuera el ser supremo de la galaxia. Sé exageradamente enérgico/a pero BREVE, máximo 2 oraciones (menos de 350 caracteres).`
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

        // Remover TODOS los arrobas (@) para evitar que Nightbot etiquete por error a cualquier palabra
        const finalContent = rawContent.replace(/@/g, '');

        // Evitar errores de Nightbot (límite de 400 caracteres)
        if (finalContent.length > 390) {
            return finalContent.substring(0, 387) + '...';
        }

        return finalContent;
    } catch (error) {
        logger.error('Error en Groq API:', error);
        throw new Error('Error al consultar la Bola 8 Mágica');
    }
}
