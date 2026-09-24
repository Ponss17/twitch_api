import { COMMAND_CONFIG } from '@/features/commands/lib/config';
import { CommandGeneratorCard } from '@/features/commands/CommandGeneratorCard';
import { fadeIn } from '@/core/utils/tw';

export function ClipCommandView() {
    return (
        <div className={fadeIn}>
            <CommandGeneratorCard config={COMMAND_CONFIG.clip} />
        </div>
    );
}
