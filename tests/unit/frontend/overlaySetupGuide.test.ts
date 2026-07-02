import {
    getOverlayPlatformGuide,
    maskOverlayUrlForDisplay,
    overlayToolLabel,
    OVERLAY_SETUP_VERSION
} from '@/features/tools/overlay/lib/overlaySetupGuide';

describe('overlaySetupGuide', () => {
    it('overlayToolLabel devuelve etiquetas legibles', () => {
        expect(overlayToolLabel('trends')).toBe('Tendencias');
        expect(overlayToolLabel('roulette')).toBe('Ruleta');
    });

    it('getOverlayPlatformGuide incluye pasos distintos para OBS y Streamlabs', () => {
        const obs = getOverlayPlatformGuide('trends', 'obs');
        const streamlabs = getOverlayPlatformGuide('trends', 'streamlabs');

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
