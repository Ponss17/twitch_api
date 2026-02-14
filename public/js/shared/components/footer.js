const i={render(n){const o=document.getElementById(n);if(!o)return;const t=new Date().getFullYear(),e=window.location.origin,a=window.location.hostname,r=`
            <div class="footer-content">
                <p>&copy; ${t} <a href="${e}" target="_blank" rel="noopener">${a}</a>. Creado para la comunidad. No afiliado con Twitch o Amazon.</p>
            </div>
        `;o.innerHTML=r,o.classList.add("app-footer")}};export{i as FooterComponent};
//# sourceMappingURL=footer.js.map
