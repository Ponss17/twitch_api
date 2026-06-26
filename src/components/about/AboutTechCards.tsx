import { useCallback, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { aboutLegoIn } from '@/lib/tw';

const STORAGE_KEY = 'about_tech_card_order';

const TECH_LINK = 'text-inherit underline decoration-inherit underline-offset-2';

const TECH_CARD =
    'group relative flex cursor-grab flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-[border-color,background-color,box-shadow,opacity] duration-200 active:cursor-grabbing hover:border-primary/40 hover:bg-primary/[0.06]';

const DEFAULT_ORDER = ['backend', 'frontend', 'database', 'ai', 'build', 'api'] as const;

type TechCardId = (typeof DEFAULT_ORDER)[number];

interface TechCardDef {
    id: TechCardId;
    type: string;
    delay: number;
    content: ReactNode;
}

const TECH_CARDS: TechCardDef[] = [
    {
        id: 'backend',
        type: 'Backend',
        delay: 6,
        content: (
            <>
                <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    TypeScript
                </a>{' '}
                /{' '}
                <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Node.js
                </a>
            </>
        )
    },
    {
        id: 'frontend',
        type: 'Frontend',
        delay: 7,
        content: (
            <>
                <a href="https://astro.build/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Astro
                </a>{' '}
                +{' '}
                <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    React
                </a>{' '}
                +{' '}
                <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Tailwind CSS
                </a>
            </>
        )
    },
    {
        id: 'database',
        type: 'Database',
        delay: 8,
        content: (
            <>
                <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Supabase
                </a>{' '}
                +{' '}
                <a href="https://vercel.com/docs/storage/vercel-kv" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Vercel KV
                </a>
            </>
        )
    },
    {
        id: 'ai',
        type: 'AI Context',
        delay: 9,
        content: (
            <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                Groq SDK
            </a>
        )
    },
    {
        id: 'build',
        type: 'Build',
        delay: 10,
        content: (
            <>
                <a href="https://esbuild.github.io/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Esbuild
                </a>{' '}
                /{' '}
                <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Vite
                </a>
            </>
        )
    },
    {
        id: 'api',
        type: 'API / Bot',
        delay: 11,
        content: (
            <>
                <a href="https://tmijs.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    tmi.js
                </a>{' '}
                +{' '}
                <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Express
                </a>{' '}
                +{' '}
                <a href="https://zod.dev/" target="_blank" rel="noopener noreferrer" className={TECH_LINK}>
                    Zod
                </a>
            </>
        )
    }
];

const CARD_MAP = Object.fromEntries(TECH_CARDS.map((c) => [c.id, c])) as Record<TechCardId, TechCardDef>;

function loadOrder(): TechCardId[] {
    if (typeof window === 'undefined') return [...DEFAULT_ORDER];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [...DEFAULT_ORDER];
        const parsed = JSON.parse(raw) as string[];
        const valid = parsed.filter((id): id is TechCardId => DEFAULT_ORDER.includes(id as TechCardId));
        const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));
        return valid.length > 0 ? [...valid, ...missing] : [...DEFAULT_ORDER];
    } catch {
        return [...DEFAULT_ORDER];
    }
}

function animDelay(delay: number): CSSProperties {
    return { animationDelay: `${delay * 0.12}s` };
}

export function AboutTechCards() {
    const [order, setOrder] = useState<TechCardId[]>(loadOrder);
    const [draggingId, setDraggingId] = useState<TechCardId | null>(null);
    const [overId, setOverId] = useState<TechCardId | null>(null);

    const persistOrder = useCallback((next: TechCardId[]) => {
        setOrder(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    }, []);

    const reorder = useCallback(
        (fromId: TechCardId, toId: TechCardId) => {
            if (fromId === toId) return;
            const next = [...order];
            const fromIndex = next.indexOf(fromId);
            const toIndex = next.indexOf(toId);
            if (fromIndex < 0 || toIndex < 0) return;
            next.splice(fromIndex, 1);
            next.splice(toIndex, 0, fromId);
            persistOrder(next);
        },
        [order, persistOrder]
    );

    const onDragStart = (e: DragEvent<HTMLDivElement>, id: TechCardId) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setDraggingId(id);
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>, id: TechCardId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (overId !== id) setOverId(id);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>, id: TechCardId) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData('text/plain') as TechCardId;
        if (fromId) reorder(fromId, id);
        setDraggingId(null);
        setOverId(null);
    };

    const onDragEnd = () => {
        setDraggingId(null);
        setOverId(null);
    };

    return (
        <div>
            <p className="mb-3 text-[0.75rem] text-[#71717a]">
                Arrastra las tarjetas para cambiar su orden.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                {order.map((id, index) => {
                    const card = CARD_MAP[id];
                    if (!card) return null;
                    const isDragging = draggingId === id;
                    const isOver = overId === id && draggingId !== id;

                    return (
                        <div
                            key={id}
                            draggable
                            onDragStart={(e) => onDragStart(e, id)}
                            onDragOver={(e) => onDragOver(e, id)}
                            onDrop={(e) => onDrop(e, id)}
                            onDragEnd={onDragEnd}
                            className={`${TECH_CARD} ${aboutLegoIn} ${
                                isDragging ? 'opacity-40' : ''
                            } ${isOver ? 'border-primary ring-1 ring-primary/30' : ''}`}
                            style={animDelay(card.delay + index * 0.15)}
                        >
                            <GripVertical
                                className="absolute top-3 right-2 size-4 text-[#52525b] opacity-0 transition group-hover:opacity-100"
                                aria-hidden
                            />
                            <span className="text-[0.6rem] font-bold tracking-[0.1em] text-[#a1a1aa] uppercase">
                                {card.type}
                            </span>
                            <span className="text-[0.9rem] font-semibold text-white">{card.content}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
