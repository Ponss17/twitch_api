var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/features/dashboard/commands/messages.ts
var CommandsMessages = {
  clipResponse: /* @__PURE__ */ __name((user, url) => `\u{1F3AC} Clip creado por ${user}: ${url}`, "clipResponse"),
  followageResponse: "Procesando followage...",
  missingCreds: "Faltan credenciales",
  completeFields: "\u26A0\uFE0F Por favor, ingresa el Canal y el Usuario para probar.",
  testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando...',
  connectionError: '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexi\xF3n</span>',
  success: /* @__PURE__ */ __name((text) => `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`, "success"),
  error: /* @__PURE__ */ __name((text) => `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`, "error"),
  form: {
    customMessage: "Mensaje Personalizado (Opcional)",
    variables: "Variables:",
    selectBot: "Selecciona tu bot:",
    copyBtn: "Copiar"
  }
};

// frontend/features/dashboard/commands/templates.ts
var CommandTemplates = {
  generateCard(conf) {
    let extrasHTML = "";
    if (conf.extraSelectors) {
      conf.extraSelectors.forEach((sel) => {
        extrasHTML += `
                <div class="tool-selector mt-10">
                    <label><i class="${sel.icon}"></i> ${sel.label}:</label>
                    <select id="extra-${conf.id}-${sel.id}" class="select-input">
                        ${sel.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("")}
                    </select>
                </div>`;
      });
    }
    const templateSection = conf.templatePlaceholder ? `
            <div class="form-group mb-20">
                <label class="input-label">
                    <i class="fa-solid fa-pen-to-square"></i> ${CommandsMessages.form.customMessage}
                </label>
                <input type="text" id="${conf.id}-template" class="text-input full-width"
                    placeholder="${conf.templatePlaceholder}">
                <small class="input-help">
                    ${conf.templateVars ? conf.templateVars.replace("Variables:", `<strong class="text-accent">${CommandsMessages.form.variables}</strong>`).replace(/\{(\w+)\}/g, '<code class="var-badge">{$1}</code>') : ""}
                </small>
            </div>` : "";
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title-group">
                    <div class="card-icon">
                        <i class="${conf.icon}"></i>
                    </div>
                    <div>
                        <h3>${conf.title}</h3>
                        <p class="card-desc">${conf.desc}</p>
                    </div>
                </div>
                <div class="header-actions">
                    <i class="fa-solid fa-circle-question info-icon" data-tooltip="${conf.info}"></i>
                </div>
            </div>
            <div class="card-body">
                <div class="tool-selector">
                    <label><i class="fa-solid fa-robot"></i> ${CommandsMessages.form.selectBot}</label>
                    <select id="bot-select-${conf.id}" class="select-input">
                        <option value="nightbot">Nightbot</option>
                        <option value="streamelements">StreamElements</option>
                        <option value="fossabot">Fossabot</option>
                        <option value="wizebot">Wizebot</option>
                    </select>
                </div>

                ${extrasHTML}
                ${templateSection}

                <div class="tool-selector">
                    <label><i class="fa-solid fa-file-code"></i> Formato de copiado:</label>
                    <select id="copy-format-${conf.id}" class="select-input">
                        <option value="full">Comando completo (!addcom)</option>
                        <option value="url">Solo URL</option>
                    </select>
                </div>

                <div class="code-box">
                    <textarea id="command-output-${conf.id}" readonly></textarea>
                    <button class="btn-copy copy-btn" data-target="command-output-${conf.id}">
                        <i class="fa-regular fa-copy"></i> ${CommandsMessages.form.copyBtn}
                    </button>
                </div>
            </div>
        </div>`;
  }
};
export {
  CommandTemplates
};
