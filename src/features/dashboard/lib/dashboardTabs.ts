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
    Swords,
    MessageSquare,
    BarChart3,
    Clock,
    MessageCircleQuestion
} from 'lucide-react';
import { MAGIC8_ICON, RUSSIAN_ICON, SLOTS_ICON } from '@/features/minigames/icons';

export interface NavItem {
    id: DashboardTab;
    label: string;
    icon: LucideIcon;
    category?: string;
}

export const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Inicio', icon: Home, category: 'general' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'general' },
    { id: 'followage', label: 'Followage', icon: UserRoundCheck, category: 'commands' },
    { id: 'watchtime', label: 'Watchtime', icon: Clock, category: 'commands' },
    { id: 'clips', label: 'Clips', icon: Clapperboard, category: 'commands' },
    { id: 'shoutout', label: 'Shoutout', icon: Megaphone, category: 'commands' },
    { id: 'trends', label: 'Tendencias', icon: TrendingUp, category: 'tools' },
    { id: 'stalker', label: 'Stalker', icon: Binoculars, category: 'tools' },
    { id: 'roulette', label: 'Ruleta', icon: Dices, category: 'tools' },
    { id: 'questions', label: 'Preguntas', icon: MessageCircleQuestion, category: 'tools' },
    { id: 'magic8', label: 'Bola 8', icon: MAGIC8_ICON, category: 'minigames' },
    { id: 'russian', label: 'Ruleta Rusa', icon: RUSSIAN_ICON, category: 'minigames' },
    { id: 'duel', label: 'Duelo', icon: Swords, category: 'minigames' },
    { id: 'slots', label: 'Slots', icon: SLOTS_ICON, category: 'minigames' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, category: 'support' }
];

export const TAB_META: Record<DashboardTab, { title: string; icon: LucideIcon }> = Object.fromEntries(
    NAV_ITEMS.map(({ id, label, icon }) => [id, { title: label, icon }])
) as Record<DashboardTab, { title: string; icon: LucideIcon }>;

TAB_META.settings = { title: 'Configuración', icon: Settings };
TAB_META.magic8 = { title: 'Bola 8 Mágica', icon: MAGIC8_ICON };
