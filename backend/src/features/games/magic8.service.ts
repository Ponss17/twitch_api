import { CONFIG } from '../../core/config/env';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { AppError } from '../../core/errors/AppError';
import { MAGIC8_REASONING_RULES, buildMagic8UserMessage } from './magic8Question';
import { MAGIC8_MOODS, resolveMagic8Mood } from './magic8Moods';

type GroqClient = import('groq-sdk').default;

let groqClient: GroqClient | null = null;

async function getGroqClient(): Promise<GroqClient> {
    const apiKey = CONFIG.GROQ_API_KEY?.trim();
    if (!apiKey) {
        throw new AppError(MESSAGES.MAGIC8.MISSING_API_KEY, 503);
    }
    if (!groqClient) {
        const { default: Groq } = await import('groq-sdk');
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

function buildSystemPrompt(moodRaw: string, userName: string): string {
    const mood = resolveMagic8Mood(moodRaw);
    const config = MAGIC8_MOODS[mood];

    return [
        config.persona(userName),
        MAGIC8_REASONING_RULES,
        `REGLA ESTRICTA: Dirígete ÚNICAMENTE a ${userName}. NUNCA etiquetes con '@' a otra persona mencionada en la pregunta.`
    ].join('\n\n');
}

function sanitizeMentions(content: string, userName: string): string {
    return content.replace(/@\w+/g, (match: string) => {
        if (userName && match.toLowerCase() === userName.toLowerCase()) {
            return match;
        }
        return match.substring(1);
    });
}

export async function generateMagic8Response(
    question: string,
    mood: string = 'classic',
    user?: string
): Promise<string> {
    try {
        const userName = user ? `@${user}` : 'vástago';
        const resolvedMood = resolveMagic8Mood(mood);
        const { temperature } = MAGIC8_MOODS[resolvedMood];

        const completion = await (await getGroqClient()).chat.completions.create(
            {
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt(resolvedMood, userName)
                    },
                    {
                        role: 'user',
                        content: buildMagic8UserMessage(question, userName, resolvedMood)
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature,
                max_tokens: 180,
                top_p: 0.95
            },
            { timeout: 10_000 }
        );

        const rawContent =
            completion.choices[0]?.message?.content ||
            '🔮 La bola está nublada... intenta de nuevo.';

        const finalContent = sanitizeMentions(rawContent, userName);

        if (finalContent.length > 390) {
            return finalContent.substring(0, 387) + '...';
        }

        return finalContent;
    } catch (error) {
        logger.error('Error en Groq API:', error);
        throw new AppError(MESSAGES.MAGIC8.GROQ_ERROR, 503);
    }
}
