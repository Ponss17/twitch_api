import { buildClipEmbedSrc, getClipEmbedParents } from '@/features/clips/lib/clipEmbed';

describe('clipEmbed', () => {
    describe('getClipEmbedParents', () => {
        it('incluye el hostname actual', () => {
            expect(getClipEmbedParents('ttv.losperris.dev')).toContain('ttv.losperris.dev');
        });

        it('añade dominios raíz en ttv.losperris.dev', () => {
            const parents = getClipEmbedParents('ttv.losperris.dev');
            expect(parents).toEqual(
                expect.arrayContaining(['ttv.losperris.dev', 'losperris.dev', 'www.losperris.dev'])
            );
        });

        it('añade localhost y 127.0.0.1 en desarrollo local', () => {
            const parents = getClipEmbedParents('localhost');
            expect(parents).toEqual(expect.arrayContaining(['localhost', '127.0.0.1']));
        });
    });

    describe('buildClipEmbedSrc', () => {
        it('genera URL de embed con varios parent', () => {
            const url = buildClipEmbedSrc('TestClipSlug', 'ttv.losperris.dev');
            expect(url).toMatch(/^https:\/\/clips\.twitch\.tv\/embed\?/);
            expect(url).toContain('clip=TestClipSlug');
            expect(url).toContain('autoplay=true');
            expect(url).toContain('parent=ttv.losperris.dev');
            expect(url).toContain('parent=losperris.dev');
            expect(url).toContain('parent=www.losperris.dev');
        });
    });
});
