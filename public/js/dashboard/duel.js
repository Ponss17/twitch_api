export const DuelModule = {
    session: null,
    initialized: false,

    init(session) {
        if (this.initialized) return;
        this.initialized = true;
        this.session = session;

        this.setupCommandGenerator();
    },

    setupCommandGenerator() {
        this.renderCommandBox();
    },

    renderCommandBox() {
        const output = document.getElementById('command-output-duel');

        if (!output || !this.session) return;

        const { apiKey, token } = this.session;
        const credential = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/twitch/minigames/duel?${credential}`;

        const cmd = `$(urlfetch ${apiUrl}&challenger=$(user)&opponent=$(touser))`;
        output.value = `!addcom !duelo ${cmd}`;
    }
};
