import type { DashboardTab } from '@/lib/config';

export const TAB_META: Record<DashboardTab, { title: string; icon: string }> = {
    home: { title: 'Inicio', icon: 'fa-house' },
    profile: { title: 'Mi Perfil', icon: 'fa-user' },
    followage: { title: 'Followage', icon: 'fa-clock-rotate-left' },
    clips: { title: 'Clips', icon: 'fa-film' },
    shoutout: { title: 'Shoutout', icon: 'fa-bullhorn' },
    trends: { title: 'Tendencias', icon: 'fa-chart-line' },
    stalker: { title: 'Stalker', icon: 'fa-users-viewfinder' },
    roulette: { title: 'Ruleta', icon: 'fa-dice' },
    magic8: { title: 'Bola 8 Mágica', icon: 'fa-8' },
    russian: { title: 'Ruleta Rusa', icon: 'fa-skull-crossbones' },
    duel: { title: 'Duelo', icon: 'fa-khanda' },
    feedback: { title: 'Feedback', icon: 'fa-comment-dots' }
};
