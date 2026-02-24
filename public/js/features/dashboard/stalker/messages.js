var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const StalkerMessages = {
  loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando Chat...',
  empty: `
        <div class="empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <p>Nadie en el chat (o error de conexi\xF3n)</p>
        </div>
    `,
  waiting: `
        <div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div>
        <h3>Esperando se\xF1al...</h3>
        <p>Dale al bot\xF3n <strong>Play</strong> para comenzar a escanear el chat.</p>
    `,
  syncNote: "* Lista sincronizada con API + Chat en vivo",
  reauthError: `
        <div class="error-msg" style="text-align: center; padding: 20px;">
            <i class="fa-solid fa-lock" style="font-size: 2rem; margin-bottom: 10px; color: var(--accent);"></i>
            <h3>Faltan Permisos</h3>
            <p>Para ver el chat, necesitas autorizar el acceso.</p>
            <button id="reauth-btn" class="btn-primary" style="margin-top: 10px;">
                <i class="fa-brands fa-twitch"></i> Conectar de nuevo
            </button>
        </div>
    `,
  userInfo: /* @__PURE__ */ __name((info) => `
        \u{1F464} ${info.display_name}
        \u{1F4C5} Creado: ${new Date(info.created_at).toLocaleDateString()}
        \u{1F441}\uFE0F Vistas: ${info.view_count}
        \u{1F4DD} Bio: ${info.description || "Sin bio"}
    `, "userInfo"),
  updated: '<i class="fa-solid fa-check"></i> Lista Stalker recargada',
  updatedRaw: "Lista Stalker recargada",
  bioEmpty: "Sin biograf\xEDa disponible.",
  apiError: "Error API",
  infoError: "No se pudo cargar info del usuario",
  reloginMsg: "Necesitas re-login (Permisos)",
  loadError: "No se pudo cargar info del usuario",
  scanStarted: '<i class="fa-solid fa-satellite-dish fa-beat" style="--fa-beat-scale: 1.2;"></i> Escaneo iniciado',
  scanStartedRaw: "Escaneo iniciado",
  scanPaused: '<i class="fa-solid fa-snowflake" style="color:#00f2ea"></i> Vista Congelada (Pausado)',
  scanPausedRaw: "Vista Congelada (Pausado)",
  tableHeaders: {
    avatar: "Avatar",
    user: "Usuario",
    login: "Login",
    action: "Acci\xF3n"
  },
  scanControls: {
    pause: "Pausar Escaneo",
    start: "Iniciar Escaneo",
    searchPlaceholder: "Buscar usuario...",
    refresh: "Recargar lista"
  },
  detectionNote: "* La detecci\xF3n de usuarios se basa en la actividad reciente del chat.",
  rowsLoading: "Cargando usuarios..."
};
export {
  StalkerMessages
};
