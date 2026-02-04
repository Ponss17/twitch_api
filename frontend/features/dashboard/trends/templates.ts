import { UI } from '../../../core/ui.js';

export const TrendsTemplates = {
    renderRow(item: [string, number], index: number, maxCount: number) {
        const [word, count] = item;
        const safeWord = UI.escapeHTML(word);
        const percentage = (count / maxCount) * 100;
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const medal =
            index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

        return `
            <tr class="fade-in ${rankClass}">
                <td><span class="rank-medal">${medal}</span></td>
                <td class="word-text" style="font-weight:600;">${safeWord}</td>
                <td class="count-text" style="text-align:right; font-size:1.1rem;">${count}</td>
                <td>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width:${percentage}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }
};
