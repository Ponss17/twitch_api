import {
    getOverlayPlatformGuide,
    overlayToolLabel
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
        expect(obs.steps[0]).toContain('Navegador');
        expect(streamlabs.steps[0]).toContain('Custom Widget');
    });
});
