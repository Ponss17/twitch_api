export const OVERLAY_TOOLS = ['roulette', 'trends'] as const;
export type OverlayToolName = (typeof OVERLAY_TOOLS)[number];

export const overlayStateKey = (userId: string, tool: string): string =>
    `overlay:state:${userId}:${tool}`;

export const overlayPagePath = (tool: OverlayToolName): string =>
    tool === 'roulette' ? '/overlay/roulette' : '/overlay/trends';
