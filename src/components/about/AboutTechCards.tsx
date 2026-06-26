import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragOverEvent,
    type DragStartEvent
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
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
    'group relative flex touch-none flex-col gap-1 rounded-xl border border-white/5 bg-[#121214] p-4 hover:border-primary/40 hover:bg-primary/[0.06]';

const TECH_CARD_DRAGGING =
    'z-20 scale-[1.02] border-primary/50 shadow-[0_12px_32px_rgba(0,0,0,0.35),0_0_20px_rgba(145,70,255,0.12)] ring-1 ring-primary/30';

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

function SortableTechCard({ id, index, isSorting }: { id: TechCardId; index: number; isSorting: boolean }) {
    const card = CARD_MAP[id];
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id, animateLayoutChanges: () => true });

    if (!card) return null;

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        ...(isSorting ? {} : animDelay(card.delay + index * 0.15))
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${TECH_CARD} ${isSorting ? '' : aboutLegoIn} ${isDragging ? TECH_CARD_DRAGGING : ''}`}
        >
            <button
                ref={setActivatorNodeRef}
                type="button"
                className="absolute top-2.5 right-2 flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-[#52525b] opacity-0 transition hover:bg-white/5 hover:text-[#a1a1aa] active:cursor-grabbing group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
    const orderRef = useRef(order);
    orderRef.current = order;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const persistOrder = useCallback((next: TechCardId[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
    }, []);

    const onDragStart = ({ active }: DragStartEvent) => {
        setActiveId(active.id as TechCardId);
    };

    const onDragOver = ({ active, over }: DragOverEvent) => {
        if (!over || active.id === over.id) return;

        const activeKey = active.id as TechCardId;
        const overKey = over.id as TechCardId;
        const current = orderRef.current;
        const oldIndex = current.indexOf(activeKey);
        const newIndex = current.indexOf(overKey);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

        const next = arrayMove(current, oldIndex, newIndex);
        orderRef.current = next;
        setOrder(next);
    };

    const onDragEnd = () => {
        setActiveId(null);
        persistOrder(orderRef.current);
    };

    const onDragCancel = () => {
        setActiveId(null);
    };

    const isSorting = activeId !== null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
        >
            <SortableContext items={order} strategy={rectSortingStrategy}>
                <div className="relative grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                    {order.map((id, index) => (
                        <SortableTechCard key={id} id={id} index={index} isSorting={isSorting} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
