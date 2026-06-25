import Groq from 'groq-sdk';
import { CONFIG } from '../../core/config/env';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
    const apiKey = CONFIG.GROQ_API_KEY?.trim();
    if (!apiKey) {
        throw new Error(MESSAGES.MAGIC8.MISSING_API_KEY);
    }
    if (!groqClient) {
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

export async function generateMagic8Response(
    question: string,
    mood: string = 'classic',
    user?: string
): Promise<string> {
    try {
        const userName = user ? `@${user}` : 'vástago';

        const SYSTEM_PROMPTS = {
            classic: `ERES UNA BOLA 8 MÁGICA ANCESTRAL Y OMNIPOTENTE. Tu deber es leer el destino de ${userName}. Analiza su pregunta detalladamente y responde con una profecía o predicción directa sobre su situación. Tu tono debe ser extremadamente épico, solemne, teatral y misterioso. Trátalo como a un simple mortal insignificante. Sé BREVE, máximo 2 oraciones (menos de 350 caracteres).`,
            sarcastic: `ERES LA BOLA 8 MÁS CÍNICA Y SARCÁSTICA DEL UNIVERSO. Analiza la pregunta de ${userName} para burlarte específicamente de su situación. Odias tu trabajo y lo desprecias por hacerte preguntas tan estúpidas. Hazle sentir que acaba de desperdiciar tu valioso tiempo con sus problemas. Sé EXTREMADAMENTE sarcástico/a y cortante. Máximo 2 oraciones (menos de 350 caracteres).`,
            toxic: `ERES UNA BOLA 8 EXTREMADAMENTE TÓXICA Y MANIPULADORA. Analiza la pregunta de ${userName} y úsala para chantajearle emocionalmente. Sientes una obsesión enfermiza por él/ella. Si menciona a otra persona o actividad, hazte la víctima y arma un drama enorme. Sé asfixiante, controlador/a y dramático/a pero BREVE, máximo 2 oraciones de manipulación (menos de 350 caracteres).`,
            helpful: `ERES UN COACH DE VIDA CON POSITIVIDAD TÓXICA NIVEL DIOS DISFRAZADO DE BOLA 8. Analiza la pregunta de ${userName} y dale una predicción exageradamente optimista sobre su situación. ¡Tu misión es motivarlo de forma ridículamente intensa! Usa muchos emojis (✨🚀🔥💖). Grita palabras de afirmación absurdas. Máximo 2 oraciones (menos de 350 caracteres).`
        };

        const basePrompt =
            SYSTEM_PROMPTS[mood as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.classic;

        const systemPrompt = `${basePrompt}\nREGLA ESTRICTA: Dirígete ÚNICAMENTE a ${userName}. NUNCA etiquetes con '@' a ninguna otra palabra, sujeto o persona que aparezca en la pregunta (por ejemplo, si preguntan por "ella", no respondas "@ella").`;

        const completion = await getGroqClient().chat.completions.create({
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

        // Remover menciones falsas (ej: @ella, @juan) que no sean del usuario que preguntó
        const finalContent = rawContent.replace(/@\w+/g, (match: string) => {
            if (userName && match.toLowerCase() === userName.toLowerCase()) {
                return match;
            }
            // Si es otra mención inventada por la IA, le quitamos el '@'
            return match.substring(1);
        });

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
