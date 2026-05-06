import { ProfileStatsData } from '../../../types.js';
import { UI } from '../../../core/ui-core.js';

export const ProfileUI = {
    _lastFollowers: undefined as number | undefined,
    renderCommandStatsInternal(
        data: Record<string, number>,
        lastData: { summaries?: Record<string, number> }
    ): void {
        const statsGrid = document.getElementById('profile-stats-summary-grid');
        if (!statsGrid) return;

        // Limpiar usando textContent (más seguro que innerHTML = '')
        statsGrid.textContent = '';

        const categories = [
            {
                id: 'cat-commands',
                label: 'Comandos',
                icon: 'fa-terminal',
                keys: ['clips', 'followage', 'so', 'message']
            },
            {
                id: 'cat-tools',
                label: 'Herramientas',
                icon: 'fa-screwdriver-wrench',
                keys: ['stalker', 'trends', 'roulette']
            },
            {
                id: 'cat-minigames',
                label: 'Minijuegos',
                icon: 'fa-gamepad',
                keys: ['russian', 'magic8', 'duel']
            }
        ];

        categories.forEach((cat) => {
            const totalSum = cat.keys.reduce((sum, key) => sum + (data[key] || 0), 0);

            // Crear elementos usando DOM API en lugar de innerHTML
            const card = document.createElement('div');
            card.className = 'stat-card';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'stat-icon';
            const icon = document.createElement('i');
            icon.className = `fa-solid ${cat.icon}`;
            iconDiv.appendChild(icon);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'stat-info';

            const heading = document.createElement('h3');
            heading.id = `profile-sum-${cat.id}`;
            heading.textContent = '0';

            const label = document.createElement('span');
            label.textContent = cat.label;

            infoDiv.appendChild(heading);
            infoDiv.appendChild(label);
            card.appendChild(iconDiv);
            card.appendChild(infoDiv);
            statsGrid.appendChild(card);

            const valueEl = document.getElementById(`profile-sum-${cat.id}`);
            if (valueEl) {
                const prevSum = lastData.summaries?.[cat.id] ?? 0;
                if (prevSum !== totalSum) {
                    UI.animateValue(valueEl, null, totalSum);
                    if (!lastData.summaries) lastData.summaries = {};
                    lastData.summaries[cat.id] = totalSum;
                } else {
                    valueEl.textContent = totalSum.toLocaleString();
                }
            }
        });
    },

    updateProfileStatsInternal(data: ProfileStatsData): void {
        const followers = document.getElementById('profile-stat-followers');
        const bio = document.getElementById('profile-bio');
        const broadcasterType = document.getElementById('profile-stat-broadcaster');
        const createdAt = document.getElementById('profile-stat-created');

        if (followers) {
            const targetValue = data.followers || 0;
            if (this._lastFollowers !== targetValue) {
                UI.animateValue(followers, 0, targetValue, 1500);
                this._lastFollowers = targetValue;
            } else {
                followers.textContent = targetValue.toLocaleString();
            }
        }

        if (bio) {
            bio.textContent =
                data.description || 'Sin biografía disponible. ¡Este streamer es un misterio!';
        }

        if (broadcasterType) {
            const types: Record<string, string> = {
                partner: 'Partner',
                affiliate: 'Afiliado',
                '': 'Streamer'
            };
            const type = data.broadcaster_type || '';
            broadcasterType.textContent = types[type] || 'Streamer';
        }

        if (createdAt && data.created_at) {
            try {
                const date = new Date(data.created_at);
                const options: Intl.DateTimeFormatOptions = {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                };
                createdAt.textContent = date.toLocaleDateString('es-ES', options);
            } catch (_e) {
                createdAt.textContent = '---';
            }
        }

        const rateLimitEl = document.getElementById('profile-stat-ratelimit');
        if (rateLimitEl && data.rateLimit) {
            rateLimitEl.textContent = `${data.rateLimit} req/min`;
        }
    },

    updateBadgesInternal(data: Record<string, string>): void {
        const container = document.getElementById('profile-badges-container');
        if (!container) return;

        // Limpiar contenedor de forma segura
        container.textContent = '';

        // Crear badges usando DOM API en lugar de innerHTML para mayor seguridad
        const createBadge = (iconClass: string, text: string, isSecondary = false): HTMLElement => {
            const badge = document.createElement('span');
            badge.className = `profile-badge-status${isSecondary ? ' secondary' : ''}`;

            const icon = document.createElement('i');
            icon.className = `fa-solid ${iconClass}`;

            badge.appendChild(icon);
            badge.appendChild(document.createTextNode(` ${text}`));
            return badge;
        };

        if (data.broadcaster_type === 'partner') {
            container.appendChild(createBadge('fa-check-circle', 'Partner de Twitch'));
        } else if (data.broadcaster_type === 'affiliate') {
            container.appendChild(createBadge('fa-star', 'Afiliado de Twitch'));
        } else {
            container.appendChild(createBadge('fa-user', 'Streamer', true));
        }
        container.appendChild(createBadge('fa-key', 'LosPerris Access', true));
    }
};
