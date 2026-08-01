import {
    getOverlayPlatformGuide,
    maskOverlayUrlForDisplay,
    
    OVERLAY_SETUP_VERSION
} from '@/features/overlay/lib/overlaySetupGuide';

describe('overlaySetupGuide', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gT: any = { sizes: { trends: '900 × 580' }, obsTitle: 'OBS', slTitle: 'Streamlabs', obsSteps: { sourceTitle: '', sourceDetail: 'Navegador', urlTitle: '', urlDetail: '', sizeTitle: '', sizeDetail: () => '900 × 580', refreshTitle: '', refreshDetail: '' }, slSteps: { sourceTitle: '', sourceDetail: 'Custom Widget', urlTitle: '', urlDetail: '', sizeTitle: '', sizeDetail: () => '', refreshTitle: '', refreshDetail: '' } };

    

    it('getOverlayPlatformGuide incluye tamaño OBS para tendencias', () => {
        const obs = getOverlayPlatformGuide('trends', 'obs', gT);
        expect(obs.steps.some((step) => step.detail.includes('900 × 580'))).toBe(true);
    });

    it('getOverlayPlatformGuide incluye pasos distintos para OBS y Streamlabs', () => {
        const obs = getOverlayPlatformGuide('trends', 'obs', gT);
        const streamlabs = getOverlayPlatformGuide('trends', 'streamlabs', gT);

        expect(obs.title).toContain('OBS');
        expect(streamlabs.title).toContain('Streamlabs');
        expect(obs.steps[0].detail).toContain('Navegador');
        expect(streamlabs.steps[0].detail).toContain('Custom Widget');
    });

    it('maskOverlayUrlForDisplay oculta el token', () => {
        const masked = maskOverlayUrlForDisplay(
            'https://example.com/overlay/trends?overlayToken=secret123&foo=bar'
        );
        expect(masked).toBe('https://example.com/overlay/trends?foo=bar');
        expect(masked).not.toContain('secret123');
    });

    it('expone la versión del setup', () => {
        expect(OVERLAY_SETUP_VERSION).toBe('beta 1.2');
    });
});
