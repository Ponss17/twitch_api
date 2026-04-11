export const DisclaimerComponent = {
    render(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = `
            <dialog id="disclaimer-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 tabindex="-1" style="outline: none;" autofocus><i class="fa-solid fa-shield-halved"></i> Aviso de Privacidad</h3>
                        <button id="close-modal-btn" class="btn-icon"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body" tabindex="-1">
                        <p>Para que los comandos funcionen correctamente, necesitamos acceder a cierta <strong>información pública</strong> de tu canal (como tu nombre de usuario, estado del stream, etc.).</p>
                        <p>Al conectar tu cuenta, aceptas que usemos estos datos únicamente para:</p>
                        <ul>
                            <li><i class="fa-solid fa-check"></i> Verificar tu identidad.</li>
                            <li><i class="fa-solid fa-check"></i> Ejecutar los comandos que configures.</li>
                            <li><i class="fa-solid fa-check"></i> Generar estadísticas de uso (anonimizadas).</li>
                        </ul>
                        <p class="text-sm text-secondary">No almacenamos contraseñas ni tenemos acceso a acciones críticas como borrar clips o banear usuarios sin tu permiso explícito.</p>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-login-btn" class="btn-secondary">Cancelar</button>
                        <button id="confirm-login-btn" class="btn-primary">
                            <i class="fa-brands fa-twitch"></i> Aceptar y Conectar
                        </button>
                    </div>
                </div>
            </dialog>
        `;

        container.innerHTML = html;
    }
};
