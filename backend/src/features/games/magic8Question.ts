/** Normaliza, clasifica y contextualiza preguntas de la Bola 8 (español). */

import { type Magic8Mood, getMoodResponseGuide, resolveMagic8Mood } from './magic8Moods';

export type Magic8QuestionType =
    | 'relationship'
    | 'yes_no'
    | 'advice'
    | 'timing'
    | 'outcome'
    | 'open'
    | 'general';

export interface Magic8QuestionAnalysis {
    original: string;
    normalized: string;
    type: Magic8QuestionType;
    typeLabel: string;
    subjectHints: string[];
}

const TYPE_LABELS: Record<Magic8QuestionType, string> = {
    relationship: 'sentimientos / relación',
    yes_no: 'sí o no',
    advice: 'consejo o decisión',
    timing: 'cuándo / momento',
    outcome: 'resultado o rendimiento',
    open: 'quién / identidad',
    general: 'general'
};

function matchesImplicitQuestion(text: string): boolean {
    const t = text.toLowerCase().trim();
    if (t.length < 3) return false;

    const patterns = [
        /^(ella|ellas|él|el|ellos)\s+/,
        /^(me|te|le|nos|les)\s+(va|van|quiere|quieren|ama|aman|odia|odian|gusta|gustan|extraña|extrañan|deja|dejan|perdona|perdonan|habla|hablan|piensa|piensan|envía|envia|manda|escribe|escriben|responde|responden)/,
        /^(voy|vas|va|vamos|van|seré|sere|sería|seria|podré|podre|puedo|puedes|puede|debo|debería|deberia|tengo|tiene|hay|estoy|está|esta|estará|estara|ganaré|ganare|pierdo|gano|funciona|pasará|pasara|conviene|merece|vale)\b/,
        /^(quien|quién|cuando|cuándo|donde|dónde|como|cómo|cuanto|cuánto|por\s?qué|porque|porqué)\b/,
        /\b(me\s+quiere|me\s+ama|me\s+odia|me\s+deja|me\s+perdona|me\s+engaña|me\s+cuña|me\s+habla|me\s+escribe)\b/,
        /\b(buena\s+idea|mala\s+idea|buen\s+momento|mal\s+momento)\b/,
        /\b(stream|stremeo|streameo|compro|comprar|vendo|vender|renuncio|renunciar)\b/
    ];

    return patterns.some((p) => p.test(t));
}

/** Convierte fragmentos tipo «ella me quiere» en pregunta explícita. */
export function normalizeMagic8Question(raw: string): string {
    const q = raw.trim().replace(/\s+/g, ' ');
    if (!q) return q;

    const hasQuestionMark = /[¿?]/.test(q);
    if (hasQuestionMark) {
        if (!q.includes('¿') && q.includes('?')) {
            return `¿${q}`;
        }
        return q;
    }

    if (matchesImplicitQuestion(q)) {
        const stripped = q.replace(/[.!¡]+$/, '');
        return `¿${stripped}?`;
    }

    return q;
}

function buildSubjectHints(question: string): string[] {
    const lower = question.toLowerCase();
    const hints: string[] = [];

    if (/\b(ella|ellas|él|el|ellos)\b/.test(lower)) {
        hints.push('Hay otra persona en juego (él/ella).');
    }
    if (/\b(yo|mi|me|mí|mis)\b/.test(lower) || /^¿me\b/i.test(question)) {
        hints.push('La pregunta es sobre el propio preguntador.');
    }
    if (/\b(stream|stremeo|streameo|directo)\b/.test(lower)) {
        hints.push('Tema: streaming.');
    }
    if (/\b(ganar|gano|pierdo|perder|rank|liga|torneo|promo)\b/.test(lower)) {
        hints.push('Tema: competición o resultado.');
    }

    return hints;
}

function classifyQuestionType(normalized: string): Magic8QuestionType {
    const q = normalized.toLowerCase();

    if (
        /\b(quiere|quieren|ama|aman|odian|odia|gusta|gustan|extraña|celos|infiel|engaña|novia|novio|crush|pareja|me quiere|me ama|me odia)\b/.test(
            q
        )
    ) {
        return 'relationship';
    }
    if (/\b(debería|deberia|conviene|merece|buena idea|mala idea|stream|streameo|streamear)\b/.test(q)) {
        return 'advice';
    }
    if (/\b(cuando|cuándo|hoy|mañana|esta noche|pronto|ya|ahora)\b/.test(q)) {
        return 'timing';
    }
    if (/\b(ganar|gano|pierdo|perder|promo|rank|torneo|liga|victoria|derrota)\b/.test(q)) {
        return 'outcome';
    }
    if (/^(¿)?(quien|quién)\b/.test(q)) {
        return 'open';
    }
    if (
        /^(¿)?(voy|seré|sere|sería|seria|podré|podre|puedo|hay|tengo|es|son|va|van|funciona|pasa)\b/.test(q) ||
        matchesImplicitQuestion(normalized)
    ) {
        return 'yes_no';
    }

    return 'general';
}

export function analyzeMagic8Question(raw: string): Magic8QuestionAnalysis {
    const original = raw.trim();
    const normalized = normalizeMagic8Question(original);
    const type = classifyQuestionType(normalized);

    return {
        original,
        normalized,
        type,
        typeLabel: TYPE_LABELS[type],
        subjectHints: buildSubjectHints(normalized)
    };
}

export const MAGIC8_REASONING_RULES = `LÓGICA (no la escribas en la respuesta):
1. Interpreta la pregunta aunque venga incompleta.
2. Responde al tipo detectado (sí/no, relación, consejo, etc.).
3. La personalidad del MODO debe notarse en CÓMO dices la respuesta, no en evitar el tema.

FORMATO: máximo 2 oraciones, menos de 350 caracteres, español.`;

export function buildMagic8UserMessage(
    question: string,
    userName: string,
    moodRaw?: string
): string {
    const mood: Magic8Mood = resolveMagic8Mood(moodRaw);
    const analysis = analyzeMagic8Question(question);
    const moodGuide = getMoodResponseGuide(mood, analysis.type);

    const lines = [
        `Modo activo: ${mood} — adapta tono y actitud a este modo en toda la respuesta.`,
        `Pregunta original de ${userName}: «${analysis.original}»`,
        analysis.normalized !== analysis.original
            ? `Pregunta interpretada: «${analysis.normalized}»`
            : null,
        `Tipo de pregunta: ${analysis.typeLabel}.`,
        analysis.subjectHints.length > 0 ? `Contexto: ${analysis.subjectHints.join(' ')}` : null,
        `Cómo responder en este modo: ${moodGuide}`,
        `Responde solo a ${userName}, directo al tema.`
    ];

    return lines.filter((line): line is string => line != null).join('\n');
}
