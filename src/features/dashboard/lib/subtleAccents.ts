export type SubtleAccent =
    | 'primary'
    | 'emerald'
    | 'amber'
    | 'sky'
    | 'violet'
    | 'rose'
    | 'cyan'
    | 'orange'
    | 'discord'
    | 'error';

/** Icono sutil: solo borde + color del icono, sin relleno interior. */
export const SUBTLE_ICON: Record<SubtleAccent, string> = {
    primary: 'border-primary/25 bg-transparent text-primary',
    emerald: 'border-emerald-500/25 bg-transparent text-emerald-500',
    amber: 'border-amber-500/25 bg-transparent text-amber-500',
    sky: 'border-sky-500/25 bg-transparent text-sky-400',
    violet: 'border-violet-500/25 bg-transparent text-violet-400',
    rose: 'border-rose-500/25 bg-transparent text-rose-400',
    cyan: 'border-cyan-500/25 bg-transparent text-cyan-400',
    orange: 'border-orange-500/25 bg-transparent text-orange-400',
    discord: 'border-[#5865F2]/30 bg-transparent text-[#5865F2]',
    error: 'border-error/25 bg-transparent text-error'
};

export function subtleIcon(accent: SubtleAccent): string {
    return SUBTLE_ICON[accent];
}
