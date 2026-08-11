import { fireEvent, render, screen } from '@testing-library/react';
import { SelectField } from '@/shared/ui/SelectField';
import { createMinigameParams } from '@/features/minigames/lib/minigameUtils';
import {
    matchesChatKeyword,
    normalizeChatKeyword
} from '@/features/tools/lib/normalizeChatKeyword';

describe('frontend behavior fixes', () => {
    it('SelectField usa dropdown propio legible y dispara onChange', () => {
        const onChange = jest.fn();
        render(
            <SelectField
                aria-label="Orden"
                name="sort"
                required
                value="new"
                onChange={onChange}
                options={[
                    { value: 'new', label: 'Nuevos' },
                    { value: 'old', label: 'Antiguos' }
                ]}
            />
        );

        const trigger = screen.getByRole('button', { name: 'Orden' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
        expect(document.querySelector('input[name="sort"]')).toHaveAttribute('required');

        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole('option', { name: 'Antiguos' }));
        expect(onChange).toHaveBeenCalledWith({ target: { value: 'old' } });
    });

    it('exige fin o whitespace después del keyword', () => {
        const keyword = normalizeChatKeyword('pregunta');
        expect(matchesChatKeyword('!pregunta', keyword)).toBe(true);
        expect(matchesChatKeyword('!pregunta cuál?', keyword)).toBe(true);
        expect(matchesChatKeyword('!pregunta\tcuál?', keyword)).toBe(true);
        expect(matchesChatKeyword('!preguntando', keyword)).toBe(false);
        expect(matchesChatKeyword('!pregunta?', keyword)).toBe(false);
    });

    it('propaga lang en los parámetros compartidos de previews', () => {
        const params = createMinigameParams('pt', { user: 'tester', format: 'json' });
        expect(params.get('lang')).toBe('pt');
        expect(params.get('user')).toBe('tester');
    });
});
