import type { DashboardTab } from '@/core/config/config';
import type { LucideIcon } from 'lucide-react';
import {
    Home,
    Settings,
    UserRoundCheck,
    Clapperboard,
    Megaphone,
    TrendingUp,
    Binoculars,
    Dices,
    CircleDot,
    Crosshair,
    Swords,
    MessageSquare,
    BarChart3
} from 'lucide-react';

/** Iconos canónicos de minijuegos (sidebar, docs, comandos, landing). */
export const MAGIC8_ICON = CircleDot;
export const RUSSIAN_ICON = Crosshair;

export interface NavItem {
    id: DashboardTab;
    label: string;
    icon: LucideIcon;
    category?: string;
}

export const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Inicio', icon: Home, category: 'General' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'General' },
    { id: 'followage', label: 'Followage', icon: UserRoundCheck, category: 'Comandos' },
    { id: 'clips', label: 'Clips', icon: Clapperboard, category: 'Comandos' },
    { id: 'shoutout', label: 'Shoutout', icon: Megaphone, category: 'Comandos' },
    { id: 'trends', label: 'Tendencias', icon: TrendingUp, category: 'Herramientas' },
    { id: 'stalker', label: 'Stalker', icon: Binoculars, category: 'Herramientas' },
    { id: 'roulette', label: 'Ruleta', icon: Dices, category: 'Herramientas' },
    { id: 'magic8', label: 'Bola 8', icon: MAGIC8_ICON, category: 'Minijuegos' },
    { id: 'russian', label: 'Ruleta Rusa', icon: RUSSIAN_ICON, category: 'Minijuegos' },
    { id: 'duel', label: 'Duelo', icon: Swords, category: 'Minijuegos' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, category: 'Soporte' }
];

export const TAB_META: Record<DashboardTab, { title: string; icon: LucideIcon }> = Object.fromEntries(
    NAV_ITEMS.map(({ id, label, icon }) => [id, { title: label, icon }])
) as Record<DashboardTab, { title: string; icon: LucideIcon }>;

TAB_META.settings = { title: 'Configuración', icon: Settings };
TAB_META.magic8 = { title: 'Bola 8 Mágica', icon: MAGIC8_ICON };
