import{CommandsMessages as a}from"./messages.js";const r={generateCard(e){let l="";e.extraSelectors&&e.extraSelectors.forEach(t=>{l+=`
                <div class="tool-selector mt-10">
                    <label><i class="${t.icon}"></i> ${t.label}:</label>
                    <select id="extra-${e.id}-${t.id}" class="select-input">
                        ${t.options.map(o=>`<option value="${o.value}">${o.label}</option>`).join("")}
                    </select>
                </div>`});const s=e.templatePlaceholder?`
            <div class="form-group mb-20">
                <label class="input-label">
                    <i class="fa-solid fa-pen-to-square"></i> ${a.form.customMessage}
                </label>
                <input type="text" id="${e.id}-template" class="text-input full-width"
                    placeholder="${e.templatePlaceholder}">
                <small class="input-help">
                    ${e.templateVars?e.templateVars.replace("Variables:",`<strong class="text-accent">${a.form.variables}</strong>`).replace(/\{(\w+)\}/g,'<code class="var-badge">{$1}</code>'):""}
                </small>
            </div>`:"";return`
        <div class="card">
            <div class="card-header">
                <div class="card-title-group">
                    <div class="card-icon">
                        <i class="${e.icon}"></i>
                    </div>
                    <div>
                        <h3>${e.title}</h3>
                        <p class="card-desc">${e.desc}</p>
                    </div>
                </div>
                <div class="header-actions">
                    <i class="fa-solid fa-circle-question info-icon" data-tooltip="${e.info}"></i>
                </div>
            </div>
            <div class="card-body">
                <div class="tool-selector">
                    <label><i class="fa-solid fa-robot"></i> ${a.form.selectBot}</label>
                    <select id="bot-select-${e.id}" class="select-input">
                        <option value="nightbot">Nightbot</option>
                        <option value="streamelements">StreamElements</option>
                        <option value="fossabot">Fossabot</option>
                        <option value="wizebot">Wizebot</option>
                    </select>
                </div>

                ${l}
                ${s}

                <div class="tool-selector">
                    <label><i class="fa-solid fa-file-code"></i> Formato de copiado:</label>
                    <select id="copy-format-${e.id}" class="select-input">
                        <option value="full">Comando completo (!addcom)</option>
                        <option value="url">Solo URL</option>
                    </select>
                </div>

                <div class="code-box">
                    <textarea id="command-output-${e.id}" readonly></textarea>
                    <button class="btn-copy copy-btn" data-target="command-output-${e.id}">
                        <i class="fa-regular fa-copy"></i> ${a.form.copyBtn}
                    </button>
                </div>
            </div>
        </div>`}};export{r as CommandTemplates};
