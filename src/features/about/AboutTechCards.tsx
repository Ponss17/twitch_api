import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { aboutLegoIn } from '@/core/utils/tw';

const STORAGE_KEY = 'about_tech_card_order';

const TECH_LINK = 'text-inherit underline decoration-inherit underline-offset-2';

const TECH_CARD =
    'relative flex cursor-grab flex-col gap-1 rounded-xl border border-white/5 bg-[#121214] p-4 active:cursor-grabbing hover:border-primary/40 hover:bg-primary/[0.06]';

const TECH_CARD_DRAGGING =
    'z-20 scale-[1.02] border-primary/50 shadow-lg ring-1 ring-primary/30';

const DEFAULT_ORDER = ['backend', 'frontend', 'database', 'ai', 'build', 'api'] as const;

type TechCardId = (typeof DEFAULT_ORDER)[number];

interface TechCardDef {
    id: TechCardId;
    type: string;
    delay: number;
    content: ReactNode;
}

/** Evita iniciar drag al hacer clic en enlaces dentro de la tarjeta */
function stopDrag(e: PointerEvent) {
    e.stopPropagation();
}

const TECH_CARDS: TechCardDef[] = [
    {
        id: 'backend',
        type: 'Backend',
        delay: 6,
        content: (
            <>
                <a
                    href="https://www.typescriptlang.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={TECH_LINK}
                    onPointerDown={stopDrag}
                >
                    TypeScript
                </a>{' '}
                /{' '}
                <a
                    href="https://nodejs.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={TECH_LINK}
                    onPointerDown={stopDrag}
                >
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
                <a href="https://astro.build/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
                    Astro
                </a>{' '}
                +{' '}
                <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
                    React
                </a>{' '}
                +{' '}
                <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
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
                <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
                    Supabase
                </a>{' '}
                +{' '}
                <a
                    href="https://vercel.com/docs/storage/vercel-kv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={TECH_LINK}
                    onPointerDown={stopDrag}
                >
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
            <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
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
                <a href="https://esbuild.github.io/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
                    Esbuild
                </a>{' '}
                /{' '}
                <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
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
                <a href="https://tmijs.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
                    tmi.js
                </a>{' '}
                +{' '}
                <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
                    Express
                </a>{' '}
                +{' '}
                <a href="https://zod.dev/" target="_blank" rel="noopener noreferrer" className={TECH_LINK} onPointerDown={stopDrag}>
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

function TechCardContent({ card }: { card: TechCardDef }) {
    return (
        <>
            <span className="text-[0.6rem] font-bold tracking-[0.1em] text-[#c4c4cc] uppercase">{card.type}</span>
            <span className="text-[0.9rem] font-semibold text-white">{card.content}</span>
        </>
    );
}

function SortableTechCard({ id, showIntro }: { id: TechCardId; showIntro: boolean }) {
    const card = CARD_MAP[id];
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    if (!card) return null;

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        ...(showIntro ? animDelay(card.delay) : {})
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${TECH_CARD} ${showIntro ? aboutLegoIn : ''} ${isDragging ? TECH_CARD_DRAGGING : ''}`}
            {...attributes}
            {...listeners}
        >
            <GripVertical
                className="pointer-events-none absolute top-3 right-2 size-4 text-[#52525b] opacity-40"
                aria-hidden
            />
            <TechCardContent card={card} />
        </div>
    );
}

export function AboutTechCards() {
    /** Mismo orden en SSR y primer render del cliente (evita hydration mismatch) */
    const [order, setOrder] = useState<TechCardId[]>(() => [...DEFAULT_ORDER]);
    const [introDone, setIntroDone] = useState(false);
    const orderRef = useRef(order);
    orderRef.current = order;

    useLayoutEffect(() => {
        setOrder(loadOrder());
    }, []);

    useEffect(() => {
        const lastDelayMs = 11 * 120;
        const animationMs = 700;
        const t = window.setTimeout(() => setIntroDone(true), lastDelayMs + animationMs);
        return () => window.clearTimeout(t);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const persistOrder = useCallback((next: TechCardId[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    }, []);

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const activeKey = active.id as TechCardId;
        const overKey = over.id as TechCardId;
        const oldIndex = orderRef.current.indexOf(activeKey);
        const newIndex = orderRef.current.indexOf(overKey);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

        const next = arrayMove(orderRef.current, oldIndex, newIndex);
        orderRef.current = next;
        setOrder(next);
        persistOrder(next);
    };

    const showIntro = !introDone;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
        >
            <SortableContext items={order} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                    {order.map((id) => (
                        <SortableTechCard key={id} id={id} showIntro={showIntro} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
