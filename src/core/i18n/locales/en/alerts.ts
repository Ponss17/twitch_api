/** Fragmento i18n: alerts (en). */
export const alerts = {
alerts: {
        bitsRoulette: {
            title: 'Bits roulette',
            desc: 'When someone cheers the amount you set, the wheel spins on OBS with your prizes.',
            triggerTitle: 'Trigger',
            enabled: 'Enable alert',
            threshold: 'Bits',
            matchMode: 'Mode',
            matchExact: 'Exactly that amount',
            matchMin: 'That amount or more',
            cooldown: 'Cooldown (s)',
            triggerHint:
                'Bits and prizes are saved here. Color, text, confetti, sound, and card are set when you generate Overlay.',
            optionsTitle: 'Wheel prizes',
            addOption: 'Add',
            removeOption: 'Remove',
            optionsMin: 'Add at least 2 prizes.',
            optionsMaxHint: 'Maximum {max} prizes ({plan} plan).',
            save: 'Save to URL',
            saving: 'Saving…',
            saved: 'Alert saved',
            savedLocal: 'Config ready: open Overlay for appearance and update the URL in OBS',
            enabledOn: 'Bits listening enabled',
            enabledOff: 'Bits listening disabled',
            saveError: 'Could not save the alert',
            permissionsNeeded:
                'Listening for real bits needs a Twitch permission. If enabling fails, update it here and try again.',
            permissionsError:
                'Bits permission is missing. Update Twitch permissions and enable the alert again.',
            loadError: 'Could not load the alert',
            testSpin: 'Test on OBS',
            testing: 'Sending…',
            testOk: 'Test cheer sent (overlay uses its URL)',
            testError: 'Could not test the spin',
            announceChat: 'Send the winning prize in chat',
            announceChatHint: 'When the spin ends, the channel posts the prize and who won it.',
            announceChatOn: 'Chat announcement enabled',
            announceChatOff: 'Chat announcement disabled',
            appearanceTitle: 'Overlay',
            showDonor: 'Who cheered on the card',
            showDonorHint: 'Under the prize when it ends.',
            confetti: 'Confetti on win',
            confettiSound: 'Win sound',
            confettiSoundHint:
                'Plays when the prize is revealed. In OBS: Browser Source → uncheck “Control audio via OBS” or raise volume.',
            confettiSoundPreview: 'Preview',
            confettiSounds: {
                none: 'No sound',
                confetti: 'Confetti',
                pop: 'Pop',
                chime: 'Chime',
                fanfare: 'Fanfare',
                sparkle: 'Sparkle'
            },
            cardStyle: 'Card',
            cardGlass: 'Transparent',
            cardSolid: 'Solid',
            winnerHold: 'Visible time (s)',
            winnerHoldHint: 'How long the winner card stays. From 3 to 15 seconds.',
            donorLabel: 'Cheer from {name}',
            spinBanner: 'Text while spinning',
            spinBannerHint: '{name} and {bits}',
            spinBannerText: 'Text',
            spinBannerVars: 'Available variables:',
            spinBannerInsertVar: 'Insert {var}',
            spinBannerDefault: '{name} spun the wheel with {bits} bits'
        }
    }
};
