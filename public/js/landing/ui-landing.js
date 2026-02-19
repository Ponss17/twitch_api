var b=Object.defineProperty;var c=(i,a)=>b(i,"name",{value:a,configurable:!0});import{UIMessages as e}from"../shared/i18n/uiMessages.js";const w={setupHeroAnimation(i){if(!i)return;i.innerHTML=`
            <div class="twitch-chat-container">
                <div class="chat-messages" id="sim-messages">
                    <div class="chat-line" style="opacity:0.5"><span class="chat-text">${e.ChatSim.welcome}</span></div>
                </div>
                <div class="chat-input-area">
                    <div class="fake-input" id="sim-input-box">
                        <div class="input-icon-area">
                             <img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon input-badge" alt="Broadcaster">
                        </div>
                        <div class="input-content-wrapper" style="position:relative; flex:1;">
                            <span class="input-text" id="sim-input-text"></span>
                            <span class="input-placeholder" id="sim-placeholder">${e.ChatSim.placeholder}</span>
                        </div>
                    </div>
                    <div class="input-actions">
                        <button class="twitch-btn">${e.ChatSim.btnText}</button>
                    </div>
                </div>
            </div>
        `;const a=document.getElementById("sim-messages"),l=document.getElementById("sim-input-text"),d=document.getElementById("sim-placeholder"),p=document.getElementById("sim-input-box"),m=[{cmd:"!followage",response:`<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${e.ChatSim.followage("ponss17","LosPerris","1 a\xF1o, 4 meses y 20 d\xEDas")}</span>`},{cmd:"!clip",response:`<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${e.ChatSim.clip("ponss17","https://clips.twitch.tv/WiseDeliciousCurryHassanChop-Df293...")}</span>`},{cmd:"!so  @mynana17",response:`<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${e.ChatSim.shoutout("mynana17","Just Chatting")}</span>`}];let o=0;const h=c(s=>new Promise(t=>{p.classList.add("typing"),d.style.display="none",l.innerText="";let r=0;const u=setInterval(()=>{l.innerText+=s.charAt(r),r++,r>s.length-1&&(clearInterval(u),setTimeout(t,500))},100)}),"typeWriter"),g=c(s=>{const t=document.createElement("div");t.className="chat-line",t.innerHTML=s,a.appendChild(t),a.children.length>5&&a.removeChild(a.children[0])},"addMessage"),n=c(s=>new Promise(t=>setTimeout(t,s)),"sleep");c(async()=>{for(;;){const s=m[o];await n(1500),await h(s.cmd),l.innerText="",d.style.display="block",p.classList.remove("typing"),g(`
                    <span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon" alt="Broadcaster"></span>
                    <span class="chat-username" style="color:#FF69B4">ponss17</span>
                    <span class="chat-colon">:</span>
                    <span class="chat-text">${s.cmd}</span>
                `),await n(1500),g(s.response),o=(o+1)%m.length,o===0&&(await n(2e3),await h("/clear"),await n(500),l.innerText="",d.style.display="block",p.classList.remove("typing"),a.innerHTML=`<div class="chat-line" style="opacity:0.5"><span class="chat-text">${e.ChatSim.welcome}</span></div>`,await n(1e3))}},"runSimulation")()}};export{w as LandingUI};
