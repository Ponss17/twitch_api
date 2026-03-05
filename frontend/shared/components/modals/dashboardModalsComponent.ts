export const DashboardModalsComponent = {
    render(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = `
            <div id="profile-modal-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-content profile-modal">
                    <button id="close-modal-btn" class="profile-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div id="profile-modal-content">
                    </div>
                </div>
            </div>

            <dialog id="regen-modal" class="modal" data-src="./components/modals/regenApiKey.html"></dialog>
            <dialog id="danger-action-modal" class="modal danger-modal" data-src="./components/modals/dangerAction.html">
            </dialog>
        `;

        container.innerHTML = html;
    }
};
