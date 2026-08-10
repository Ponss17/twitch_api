const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'] as const;
type Symbol = (typeof SYMBOLS)[number];
type Lang = 'es' | 'en' | 'pt';

export type SlotsResult = {
    messages: string[];
    message: string;
};

function resolveLang(lang: string): Lang {
    const l = (lang || 'es').toLowerCase().trim();
    if (l.startsWith('en')) return 'en';
    if (l.startsWith('pt')) return 'pt';
    return 'es';
}

function pickSymbol(): Symbol {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!;
}

function spinReels(): [Symbol, Symbol, Symbol] {
    const roll = Math.random();

    if (roll < 0.04) {
        const s = pickSymbol();
        return [s, s, s];
    }

    if (roll < 0.26) {
        const s = pickSymbol();
        let other = pickSymbol();
        while (other === s) other = pickSymbol();
        const layouts: [Symbol, Symbol, Symbol][] = [
            [s, s, other],
            [s, other, s],
            [other, s, s]
        ];
        return layouts[Math.floor(Math.random() * layouts.length)]!;
    }

    const first = pickSymbol();
    let second = pickSymbol();
    while (second === first) second = pickSymbol();
    let third = pickSymbol();
    while (third === first || third === second) third = pickSymbol();
    return [first, second, third];
}

function formatUser(user: string | undefined, lang: Lang): string {
    if (!user || user === 'Anónimo') {
        if (lang === 'en') return 'someone';
        if (lang === 'pt') return 'alguém';
        return 'alguien';
    }
    return user.startsWith('@') ? user : `@${user}`;
}

function outcomeLine(
    lang: Lang,
    who: string,
    display: string,
    jackpot: boolean,
    pair: boolean
): string {
    if (jackpot) {
        if (lang === 'en') return `🎰 ${display} — JACKPOT! ${who} hits the jackpot! 💎`;
        if (lang === 'pt') return `🎰 ${display} — JACKPOT! ${who} acertou o jackpot! 💎`;
        return `🎰 ${display} — ¡JACKPOT! ${who} se lleva el bote 💎`;
    }
    if (pair) {
        if (lang === 'en') return `🎰 ${display} — So close, ${who}! Two matching — almost jackpot.`;
        if (lang === 'pt') return `🎰 ${display} — Quase, ${who}! Dois iguais — quase jackpot.`;
        return `🎰 ${display} — ¡Casi, ${who}! Dos iguales — falta uno para el jackpot.`;
    }
    if (lang === 'en') return `🎰 ${display} — ${who} got nothing this spin. Try again!`;
    if (lang === 'pt') return `🎰 ${display} — ${who} não levou nada nesta rodada. Tenta de novo!`;
    return `🎰 ${display} — ${who} no se lleva nada esta vez. ¡Otra!`;
}

export function playSlots(user?: string, lang: string = 'es'): SlotsResult {
    const l = resolveLang(lang);
    const who = formatUser(user, l);
    const [a, b, c] = spinReels();
    const display = `${a} | ${b} | ${c}`;
    const jackpot = a === b && b === c;
    const pair = !jackpot && (a === b || b === c || a === c);
    const final = outcomeLine(l, who, display, jackpot, pair);

    const spin1 =
        l === 'en'
            ? `🎰 ${who} spins... ${a} | ❓ | ❓`
            : l === 'pt'
              ? `🎰 ${who} gira... ${a} | ❓ | ❓`
              : `🎰 ${who} gira... ${a} | ❓ | ❓`;
    const spin2 = `🎰 ${a} | ${b} | ❓`;

    return {
        messages: [spin1, spin2, final],
        message: final
    };
}
