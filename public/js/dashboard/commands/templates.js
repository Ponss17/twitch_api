import { CommandsMessages } from './messages.js';
export const CommandTemplates = {
    generateCard(conf) {
        let extrasHTML = '';
        if (conf.extraSelectors) {
            conf.extraSelectors.forEach((sel) => {
                extrasHTML += `
                <div class="tool-selector mt-10">
                    <label><i class="${sel.icon}"></i> ${sel.label}:</label>
                    <select id="extra-${conf.id}-${sel.id}" class="select-input">
                        ${sel.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>`;
            });
        }
        const templateSection = conf.templatePlaceholder
            ? `
            <div class="form-group mb-20">
                <label class="input-label">
                    <i class="fa-solid fa-pen-to-square"></i> ${CommandsMessages.form.customMessage}
                </label>
                <input type="text" id="${conf.id}-template" class="text-input full-width" 
                    placeholder="${conf.templatePlaceholder}">
                <small class="input-help">
                    ${conf.templateVars ? conf.templateVars.replace('Variables:', `<strong class="text-accent">${CommandsMessages.form.variables}</strong>`).replace(/\{(\w+)\}/g, '<code class="var-badge">{$1}</code>') : ''}
                </small>
            </div>`
            : '';
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
