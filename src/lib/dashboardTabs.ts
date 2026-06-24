import type { DashboardTab } from '@/lib/config';

import { Home, User, History, Clapperboard, Megaphone, TrendingUp, ScanFace, Dices, Circle, Skull, Swords, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const TAB_META: Record<DashboardTab, { title: string; icon: LucideIcon }> = {
    home: { title: 'Inicio', icon: Home },
    profile: { title: 'Mi Perfil', icon: User },
    followage: { title: 'Followage', icon: History },
    clips: { title: 'Clips', icon: Clapperboard },
    shoutout: { title: 'Shoutout', icon: Megaphone },
    trends: { title: 'Tendencias', icon: TrendingUp },
    stalker: { title: 'Stalker', icon: ScanFace },
    roulette: { title: 'Ruleta', icon: Dices },
    magic8: { title: 'Bola 8 Mágica', icon: Circle },
    russian: { title: 'Ruleta Rusa', icon: Skull },
    duel: { title: 'Duelo', icon: Swords },
    feedback: { title: 'Feedback', icon: MessageSquare }
};
