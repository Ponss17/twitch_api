/** Sonidos cortos de celebración (Web Audio — sin subir archivos). */

export const BITS_CONFETTI_SOUND_IDS = [
    'none',
    'confetti',
    'pop',
    'chime',
    'fanfare',
    'sparkle'
] as const;
export type BitsConfettiSoundId = (typeof BITS_CONFETTI_SOUND_IDS)[number];

export function normalizeConfettiSound(raw: unknown): BitsConfettiSoundId {
    const v = String(raw ?? '')
        .trim()
        .toLowerCase();
    return (BITS_CONFETTI_SOUND_IDS as readonly string[]).includes(v)
        ? (v as BitsConfettiSoundId)
        : 'none';
}

type Tone = { freq: number; start: number; dur: number; type?: OscillatorType; gain?: number };

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return AC ? new AC() : null;
}

function playTones(ctx: AudioContext, tones: Tone[], masterGain = 0.28): number {
    const master = ctx.createGain();
    master.gain.value = masterGain;
    master.connect(ctx.destination);

    const startAt = ctx.currentTime + 0.02;
    let end = 0;
    for (const tone of tones) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = tone.type ?? 'sine';
        osc.frequency.value = tone.freq;
        const peak = tone.gain ?? 1;
        const t0 = startAt + tone.start;
        const t1 = t0 + tone.dur;
        end = Math.max(end, tone.start + tone.dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t1);
        osc.connect(g);
        g.connect(master);
        osc.start(t0);
        osc.stop(t1 + 0.02);
    }
    return end;
}

/** Cañón + lluvia de papel (sin tonos musicales). */
function playConfettiBursts(ctx: AudioContext): number {
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    const startAt = ctx.currentTime + 0.015;
    const sr = ctx.sampleRate;

    const noiseBuf = (seconds: number, shape: 'crack' | 'rustle' | 'flutter'): AudioBuffer => {
        const n = Math.max(1, Math.floor(sr * seconds));
        const buffer = ctx.createBuffer(1, n, sr);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < n; i++) {
            const t = i / n;
            let sample = Math.random() * 2 - 1;
            if (shape === 'rustle') {
                // Ruido marrón suave (papel lejos)
                last = (last + 0.02 * sample) / 1.02;
                sample = last;
                sample *= 0.35 + 0.65 * Math.sin(t * Math.PI);
            } else if (shape === 'flutter') {
                // Chasquido corto de hoja
                const env = Math.exp(-t * 14) * (1 - t);
                sample *= env;
            } else {
                // Poof / crack del disparo
                const env = Math.exp(-t * 22);
                sample = sample * env * 0.85 + (Math.random() * 2 - 1) * env * env * 0.4;
            }
            data[i] = sample;
        }
        return buffer;
    };

    const fire = (
        buffer: AudioBuffer,
        opts: {
            at: number;
            filterType: BiquadFilterType;
            freq: number;
            q?: number;
            gain: number;
            attack?: number;
            pan?: number;
        }
    ) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = opts.filterType;
        filter.frequency.value = opts.freq;
        filter.Q.value = opts.q ?? 0.7;
        const g = ctx.createGain();
        const t0 = startAt + opts.at;
        const attack = opts.attack ?? 0.004;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(Math.max(0.001, opts.gain), t0 + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + buffer.duration);
        const pan = ctx.createStereoPanner();
        pan.pan.value = opts.pan ?? 0;
        src.connect(filter);
        filter.connect(g);
        g.connect(pan);
        pan.connect(master);
        src.start(t0);
    };

    // 1) Disparo / poof inicial
    fire(noiseBuf(0.14, 'crack'), {
        at: 0,
        filterType: 'lowpass',
        freq: 900,
        q: 0.5,
        gain: 1.1,
        attack: 0.002,
        pan: 0
    });
    fire(noiseBuf(0.08, 'crack'), {
        at: 0.01,
        filterType: 'bandpass',
        freq: 2400,
        q: 0.9,
        gain: 0.7,
        pan: 0.15
    });

    // 2) Cama de papel cayendo
    fire(noiseBuf(1.05, 'rustle'), {
        at: 0.04,
        filterType: 'bandpass',
        freq: 3200,
        q: 0.55,
        gain: 0.28,
        attack: 0.05,
        pan: -0.2
    });
    fire(noiseBuf(0.9, 'rustle'), {
        at: 0.12,
        filterType: 'highpass',
        freq: 4500,
        q: 0.4,
        gain: 0.18,
        attack: 0.08,
        pan: 0.25
    });

    // 3) Lluvia irregular de hojitas (muchas, cortas, pan aleatorio)
    const flutters = 28;
    let end = 1.05;
    for (let i = 0; i < flutters; i++) {
        const at = 0.05 + i * 0.028 + Math.random() * 0.04;
        const dur = 0.035 + Math.random() * 0.055;
        const freq = 1800 + Math.random() * 5200;
        const gain = 0.22 + Math.random() * 0.45;
        const pan = Math.random() * 1.6 - 0.8;
        fire(noiseBuf(dur, 'flutter'), {
            at,
            filterType: Math.random() > 0.45 ? 'bandpass' : 'highpass',
            freq,
            q: 0.6 + Math.random() * 1.2,
            gain: gain * (1 - at * 0.35),
            pan
        });
        end = Math.max(end, at + dur);
    }

    // 4) Unos pocos “ticks” más graves al final (piezas más grandes)
    for (let i = 0; i < 5; i++) {
        const at = 0.55 + i * 0.1 + Math.random() * 0.05;
        fire(noiseBuf(0.06 + Math.random() * 0.04, 'flutter'), {
            at,
            filterType: 'bandpass',
            freq: 900 + Math.random() * 1400,
            q: 1.1,
            gain: 0.35,
            pan: Math.random() * 1.2 - 0.6
        });
        end = Math.max(end, at + 0.1);
    }

    return end;
}

const TONE_PRESETS: Record<Exclude<BitsConfettiSoundId, 'none' | 'confetti'>, Tone[]> = {
    pop: [
        { freq: 520, start: 0, dur: 0.09, type: 'triangle', gain: 0.9 },
        { freq: 780, start: 0.04, dur: 0.12, type: 'sine', gain: 0.7 }
    ],
    chime: [
        { freq: 659.25, start: 0, dur: 0.35, type: 'sine', gain: 0.85 },
        { freq: 830.61, start: 0.08, dur: 0.4, type: 'sine', gain: 0.7 },
        { freq: 987.77, start: 0.16, dur: 0.5, type: 'sine', gain: 0.55 }
    ],
    fanfare: [
        { freq: 392, start: 0, dur: 0.18, type: 'square', gain: 0.35 },
        { freq: 523.25, start: 0.14, dur: 0.18, type: 'square', gain: 0.35 },
        { freq: 659.25, start: 0.28, dur: 0.22, type: 'square', gain: 0.4 },
        { freq: 784, start: 0.48, dur: 0.45, type: 'square', gain: 0.45 }
    ],
    sparkle: [
        { freq: 1200, start: 0, dur: 0.08, type: 'sine', gain: 0.7 },
        { freq: 1600, start: 0.06, dur: 0.08, type: 'sine', gain: 0.6 },
        { freq: 2000, start: 0.12, dur: 0.1, type: 'sine', gain: 0.5 },
        { freq: 2400, start: 0.2, dur: 0.14, type: 'triangle', gain: 0.4 }
    ]
};

/** Reproduce el sonido elegido (o nada si `none`). Seguro llamar varias veces. */
export function playBitsConfettiSound(id: BitsConfettiSoundId): void {
    const sound = normalizeConfettiSound(id);
    if (sound === 'none') return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const end =
            sound === 'confetti'
                ? playConfettiBursts(ctx)
                : playTones(ctx, TONE_PRESETS[sound]);
        window.setTimeout(() => {
            void ctx.close().catch(() => undefined);
        }, Math.ceil((end + 0.2) * 1000));
    } catch {
        /* OBS / autoplay: silencio sin romper el overlay */
    }
}
