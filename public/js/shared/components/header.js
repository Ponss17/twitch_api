// frontend/shared/components/header.ts
var HeaderComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const html = `
            <div class="container">
                <div class="logo-container">
                    <img src="img/LosPerris-minimal.webp" alt="Logo" class="logo-img" loading="lazy">
                    <h1 class="brand-logo">LosPerris <span class="accent-text">Twitch Api</span></h1>
                </div>
                <nav class="top-nav">
                    <a href="docs" class="nav-link"><i class="fa-solid fa-book"></i> Documentaci\xF3n</a>
                    <a href="https://discord.gg/8uN3qY5E" target="_blank" class="nav-link"><i class="fa-brands fa-discord"></i> Comunidad</a>
                </nav>
            </div>
        `;
    container.innerHTML = html;
    container.className = "main-header fade-in";
  }
};
export {
  HeaderComponent
};
