const FooterComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const html = `
            <div class="footer-content">
                <p>&copy; ${year} <a href="${origin}" target="_blank" rel="noopener">${hostname}</a>. Creado para la comunidad. No afiliado con Twitch o Amazon.</p>
            </div>
        `;
    container.innerHTML = html;
    container.classList.add("app-footer");
  }
};
export {
  FooterComponent
};
