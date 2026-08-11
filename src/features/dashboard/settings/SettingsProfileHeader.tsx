import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { staticPath } from '@/core/config/paths';

interface SettingsProfileHeaderProps {
    /** ISO date (Twitch created_at or first login). */
    memberSinceIso?: string;
}

function memberSinceYear(iso?: string): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return String(d.getFullYear());
}

/** Cabecera compacta estilo Nightbot: avatar + nombre + “Miembro desde”. */
export function SettingsProfileHeader({ memberSinceIso }: SettingsProfileHeaderProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const name = session.displayName ?? session.login ?? 'Streamer';
    const year = memberSinceYear(memberSinceIso);
    const avatar =
        session.profile_image_url?.replace('300x300', '70x70') ?? staticPath('/img/logo.svg');

    return (
        <header className="mb-6 flex items-center gap-4">
            <img
                src={avatar}
                alt=""
                width={64}
                height={64}
                className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border-subtle"
            />
            <div className="min-w-0">
                <h1 className="truncate text-[1.5rem] font-bold leading-none tracking-tight text-text-main">
                    {name}
                </h1>
                {year ? (
                    <p className="mt-1.5 text-[0.8125rem] text-text-muted">
                        {t.settings.hero.memberSince} {year}
                    </p>
                ) : null}
            </div>
        </header>
    );
}
