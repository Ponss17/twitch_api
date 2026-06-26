import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent
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
import { aboutLegoIn } from '@/lib/tw';

const STORAGE_KEY = 'about_tech_card_order';

const TECH_LINK = 'text-inherit underline decoration-inherit underline-offset-2';

const TECH_CARD =
    'group relative flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-[border-color,background-color,box-shadow,transform,opacity] duration-200 hover:border-primary/40 hover:bg-primary/[0.06]';

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

function TechCardContent({ card }: { card: TechCardDef }) {
    return (
        <>
            <span className="text-[0.6rem] font-bold tracking-[0.1em] text-[#a1a1aa] uppercase">{card.type}</span>
            <span className="text-[0.9rem] font-semibold text-white">{card.content}</span>
        </>
    );
}

function SortableTechCard({ id, index }: { id: TechCardId; index: number }) {
    const card = CARD_MAP[id];
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id });

    if (!card) return null;

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...animDelay(card.delay + index * 0.15)
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${TECH_CARD} ${aboutLegoIn} ${isDragging ? 'z-10 opacity-30' : ''}`}
        >
            <button
                ref={setActivatorNodeRef}
                type="button"
                className="absolute top-2.5 right-2 flex size-7 cursor-grab items-center justify-center rounded-md text-[#52525b] opacity-0 transition hover:bg-white/5 hover:text-[#a1a1aa] active:cursor-grabbing group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label={`Reordenar tarjeta ${card.type}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" aria-hidden />
            </button>
            <TechCardContent card={card} />
        </div>
    );
}

export function AboutTechCards() {
    const [order, setOrder] = useState<TechCardId[]>(loadOrder);
    const [activeId, setActiveId] = useState<TechCardId | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const persistOrder = useCallback((next: TechCardId[]) => {
        setOrder(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    }, []);

    const onDragStart = ({ active }: DragStartEvent) => {
        setActiveId(active.id as TechCardId);
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIndex = order.indexOf(active.id as TechCardId);
        const newIndex = order.indexOf(over.id as TechCardId);
        if (oldIndex < 0 || newIndex < 0) return;

        persistOrder(arrayMove(order, oldIndex, newIndex));
    };

    const onDragCancel = () => setActiveId(null);

    const activeCard = activeId ? CARD_MAP[activeId] : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
        >
            <SortableContext items={order} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                    {order.map((id, index) => (
                        <SortableTechCard key={id} id={id} index={index} />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
                {activeCard ? (
                    <div
                        className={`${TECH_CARD} cursor-grabbing border-primary/50 bg-[#121214] shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(145,70,255,0.15)] ring-1 ring-primary/30`}
                    >
                        <TechCardContent card={activeCard} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
