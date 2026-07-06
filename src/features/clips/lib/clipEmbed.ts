/** Dominios parent para el iframe de clips (docs: https://dev.twitch.tv/docs/embed/video-and-clips/) */
export function getClipEmbedParents(hostname = window.location.hostname): string[] {
    const parents = new Set<string>([hostname]);

    if (hostname === 'ttv.losperris.dev') {
        parents.add('losperris.dev');
        parents.add('www.losperris.dev');
    } else if (hostname === 'www.losperris.dev' || hostname === 'losperris.dev') {
        parents.add('losperris.dev');
        parents.add('www.losperris.dev');
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        parents.add('localhost');
        parents.add('127.0.0.1');
    }

    return [...parents];
}

export function buildClipEmbedSrc(clipId: string, hostname = window.location.hostname): string {
    const params = new URLSearchParams({ clip: clipId, autoplay: 'true' });
    for (const parent of getClipEmbedParents(hostname)) {
        params.append('parent', parent);
    }
    return `https://clips.twitch.tv/embed?${params.toString()}`;
}
