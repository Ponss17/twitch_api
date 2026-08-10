import {
    ACTIVITY_LOG_TYPES,
    BOT_PATH_MARKERS,
    TOOL_USAGE_TYPES,
    VIEWER_ACTIVITY_TYPES,
    isActivityLogType,
    isBotCommandPath,
    isToolUsageType,
    isViewerActivityType
} from '../../../backend/src/core/schemas/commandCatalog';

describe('commandCatalog', () => {
    it('cubre paths de bot conocidos', () => {
        expect(isBotCommandPath('/api/watchtime')).toBe(true);
        expect(isBotCommandPath('/minigames/slots')).toBe(true);
        expect(isBotCommandPath('/api/dashboard/analytics')).toBe(false);
        expect(BOT_PATH_MARKERS).toContain('/watchtime');
    });

    it('clasifica viewer vs tool vs activity', () => {
        expect(isViewerActivityType('watchtime')).toBe(true);
        expect(isViewerActivityType('stalker')).toBe(false);
        expect(isToolUsageType('roulette')).toBe(true);
        expect(isToolUsageType('slots')).toBe(false);
        expect(isActivityLogType('slots')).toBe(true);
        expect(isActivityLogType('unknown')).toBe(false);
    });

    it('mantiene listas sin solapes incorrectos', () => {
        for (const tool of TOOL_USAGE_TYPES) {
            expect(VIEWER_ACTIVITY_TYPES).not.toContain(tool);
            expect(ACTIVITY_LOG_TYPES).toContain(tool);
        }
        for (const viewer of VIEWER_ACTIVITY_TYPES) {
            expect(ACTIVITY_LOG_TYPES).toContain(viewer);
        }
        expect(ACTIVITY_LOG_TYPES).toContain('other');
        expect(ACTIVITY_LOG_TYPES).toContain('message');
    });
});
