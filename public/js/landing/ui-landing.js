import{UIMessages as t}from"../shared/i18n/uiMessages.js";const v={setupHeroAnimation(p){if(!p)return;p.innerHTML=`
            <div class="twitch-chat-container">
                <div class="chat-messages" id="sim-messages">
                    <div class="chat-line" style="opacity:0.5"><span class="chat-text">${t.ChatSim.welcome}</span></div>
                </div>
                <div class="chat-input-area">
                    <div class="fake-input" id="sim-input-box">
                        <div class="input-icon-area">
                             <img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon input-badge" alt="Broadcaster">
                        </div>
                        <div class="input-content-wrapper" style="position:relative; flex:1;">
                            <span class="input-text" id="sim-input-text"></span>
                            <span class="input-placeholder" id="sim-placeholder">${t.ChatSim.placeholder}</span>
                        </div>
                    </div>
                    <div class="input-actions">
                        <button class="twitch-btn">${t.ChatSim.btnText}</button>
                    </div>
                </div>
            </div>
        `;const e=document.getElementById("sim-messages"),c=document.getElementById("sim-input-text"),l=document.getElementById("sim-placeholder"),o=document.getElementById("sim-input-box"),r=[{cmd:"!followage",response:`<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${t.ChatSim.followage("ponss17","LosPerris","1 a\xF1o, 4 meses y 20 d\xEDas")}</span>`},{cmd:"!clip",response:`<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${t.ChatSim.clip("ponss17","https://clips.twitch.tv/WiseDeliciousCurryHassanChop-Df293...")}</span>`},{cmd:"!so  @mynana17",response:`<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${t.ChatSim.shoutout("mynana17","Just Chatting")}</span>`}];let i=0;const m=s=>new Promise(a=>{o.classList.add("typing"),l.style.display="none",c.innerText="";let d=0;const g=setInterval(()=>{c.innerText+=s.charAt(d),d++,d>s.length-1&&(clearInterval(g),setTimeout(a,500))},100)}),h=s=>{const a=document.createElement("div");a.className="chat-line",a.innerHTML=s,e.appendChild(a),e.children.length>5&&e.removeChild(e.children[0])},n=s=>new Promise(a=>setTimeout(a,s));(async()=>{for(;;){const s=r[i];await n(1500),await m(s.cmd),c.innerText="",l.style.display="block",o.classList.remove("typing"),h(`
                    <span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon" alt="Broadcaster"></span>
                    <span class="chat-username" style="color:#FF69B4">ponss17</span>
                    <span class="chat-colon">:</span>
                    <span class="chat-text">${s.cmd}</span>
                `),await n(1500),h(s.response),i=(i+1)%r.length,i===0&&(await n(2e3),await m("/clear"),await n(500),c.innerText="",l.style.display="block",o.classList.remove("typing"),e.innerHTML=`<div class="chat-line" style="opacity:0.5"><span class="chat-text">${t.ChatSim.welcome}</span></div>`,await n(1e3))}})()}};export{v as LandingUI};
//# sourceMappingURL=ui-landing.js.map
