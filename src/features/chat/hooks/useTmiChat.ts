import { useEffect, useRef } from 'react';
import type { Session } from '@/core/config/config';
import { getTmiAuth, tmiService, type TmiTags } from '@/features/chat/lib/tmiService';

type MessageHandler = (channel: string, tags: TmiTags, message: string) => void;

interface UseTmiChatOptions {
    channel: string | undefined;
    session: Session;
    enabled: boolean;
    onMessage: MessageHandler;
    onConnected?: () => void;
    onError?: () => void;
}

/** Conecta TMI al montar cuando `enabled`, registra un listener y libera al desmontar. */
export function useTmiChat(listenerId: string, options: UseTmiChatOptions): void {
    const { channel, session, enabled, onMessage, onConnected, onError } = options;
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;
    const onConnectedRef = useRef(onConnected);
    onConnectedRef.current = onConnected;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const sessionRef = useRef(session);
    sessionRef.current = session;

    const sessionKey = session.userId ?? '';

    useEffect(() => {
        if (!enabled || !channel) return;

        let cancelled = false;

        const handler: MessageHandler = (ch, tags, msg) => {
            onMessageRef.current(ch, tags, msg);
        };

        void tmiService
            .connect(channel, getTmiAuth(sessionRef.current))
            .then(() => {
                if (cancelled) {
                    tmiService.removeListener(listenerId);
                    tmiService.disconnect();
                    return;
                }
                tmiService.addListener(listenerId, handler);
                onConnectedRef.current?.();
            })
            .catch(() => {
                if (!cancelled) onErrorRef.current?.();
            });

        return () => {
            cancelled = true;
            tmiService.removeListener(listenerId);
            tmiService.disconnect();
        };
    }, [enabled, channel, listenerId, sessionKey]);
}
