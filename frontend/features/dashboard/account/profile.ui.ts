import { ProfileStatsData } from '../../../types.js';
import { UI } from '../../../core/ui.js';

export const ProfileUI = {
    renderCommandStatsInternal(
        data: Record<string, number>,
        lastData: { summaries?: Record<string, number> }
    ): void {
        const statsGrid = document.getElementById('profile-stats-summary-grid');
        if (!statsGrid) return;

        statsGrid.innerHTML = '';

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
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-icon"><i class="fa-solid ${cat.icon}"></i></div>
                <div class="stat-info">
                    <h3 id="profile-sum-${cat.id}">0</h3>
                    <span>${cat.label}</span>
                </div>
            `;
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

    updateProfileStatsInternal(data: ProfileStatsData, lastData: { followers?: number }): void {
        const followers = document.getElementById('profile-stat-followers');
        const bio = document.getElementById('profile-bio');
        const broadcasterType = document.getElementById('profile-stat-broadcaster');
        const createdAt = document.getElementById('profile-stat-created');

        if (followers) {
            const targetValue = data.followers || 0;
            if (lastData.followers !== targetValue) {
                UI.animateValue(followers, 0, targetValue, 1500);
                lastData.followers = targetValue;
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

        let badgesHtml = '';
        if (data.broadcaster_type === 'partner') {
            badgesHtml += `<span class="profile-badge-status"><i class="fa-solid fa-check-circle"></i> Partner de Twitch</span>`;
        } else if (data.broadcaster_type === 'affiliate') {
            badgesHtml += `<span class="profile-badge-status"><i class="fa-solid fa-star"></i> Afiliado de Twitch</span>`;
        } else {
            badgesHtml += `<span class="profile-badge-status secondary"><i class="fa-solid fa-user"></i> Streamer</span>`;
        }
        badgesHtml += `<span class="profile-badge-status secondary"><i class="fa-solid fa-key"></i> LosPerris Access</span>`;
        container.innerHTML = badgesHtml;
    }
};
