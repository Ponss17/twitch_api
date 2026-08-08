import { useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { useCommandTestField, useCommandTestResult } from '@/features/commands/hooks/useCommandStore';
import { buildCommandTestUrl, useCommandApiTest } from '@/features/commands/hooks/useCommandApiTest';
import { useRequiredSession } from '@/core/session/useSession';
import { ApiTestCard, CommandGeneratorCard, FormField } from '../CommandGeneratorCard';
import { fadeIn } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Sheet } from '@/shared/ui/Sheet';
import { Info } from 'lucide-react';
import { toApiTestResult, followageErrorPattern } from '../lib/viewUtils';

export function WatchtimeView() {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const viewT = t.commands.views;
    const ownerChannel = session.login ?? '';
    const [channel, setChannel] = useCommandTestField('watchtime', 'channel', ownerChannel);
    const [user, setUser] = useCommandTestField('watchtime', 'user', '');
    const [storedResult, setStoredResult] = useCommandTestResult('watchtime-test');
    const { loading, runTest } = useCommandApiTest(setStoredResult);
    const [sheetOpen, setSheetOpen] = useState(false);

    const handleTest = async (): Promise<void> => {
        const channelVal = channel.trim().toLowerCase();
        const userVal = user.trim();

        if (!channelVal || !userVal) {
            setStoredResult({ status: 'error', message: viewT.errors.missingFields });
            return;
        }

        await runTest({
            buildUrl: (apiKey) =>
                buildCommandTestUrl(
                    `${API_ENDPOINTS.BASE}/watchtime/`,
                    { user: userVal, channel: channelVal },
                    apiKey
                ),
            validateResponse: (text, responseOk) =>
                responseOk && text.trim().length > 0 && !followageErrorPattern.test(text)
        });
    };

    const disclaimerBadge = (
        <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.7rem] font-medium text-primary transition-colors hover:bg-primary/20"
        >
            <Info className="h-3 w-3 shrink-0" />
            {viewT.watchtime.disclaimerTitle}
        </button>
    );

    return (
        <div className={fadeIn}>
            <CommandGeneratorCard
                config={COMMAND_CONFIG.watchtime}
                headerBadge={disclaimerBadge}
            />

            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={viewT.watchtime.disclaimerTitle}
                description={viewT.watchtime.disclaimerSubtitle}
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="mb-2 flex items-center gap-2 text-[0.85rem] font-semibold text-text-main">
                            <Info className="h-4 w-4 text-primary" />
                            {viewT.watchtime.disclaimerWhat}
                        </h3>
                        <p className="text-[0.8rem] leading-relaxed text-text-muted">
                            {viewT.watchtime.disclaimerText}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border-subtle text-xs font-medium text-text-main">
                                1
                            </span>
                            <p className="mt-0.5 text-[0.8rem] leading-relaxed text-text-muted">
                                {viewT.watchtime.disclaimerStep1.replace('⚠️ ', '')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border-subtle text-xs font-medium text-text-main">
                                2
                            </span>
                            <p className="mt-0.5 text-[0.8rem] leading-relaxed text-text-muted">
                                {viewT.watchtime.disclaimerStep2.replace('💡 ', '')}
                            </p>
                        </div>
                    </div>
                </div>
            </Sheet>

            <ApiTestCard
                title={viewT.watchtime.testTitle}
                description={viewT.watchtime.testDesc}
                infoTooltip={viewT.watchtime.testTooltip}
                onTest={handleTest}
                result={toApiTestResult(loading, storedResult)}
            >
                <FormField
                    label={viewT.watchtime.channelLabel}
                    value={channel}
                    onChange={setChannel}
                    placeholder={ownerChannel || viewT.watchtime.channelPlaceholder}
                />
                <FormField
                    label={viewT.watchtime.userLabel}
                    value={user}
                    onChange={setUser}
                    placeholder={viewT.watchtime.userPlaceholder}
                />
            </ApiTestCard>
        </div>
    );
}
