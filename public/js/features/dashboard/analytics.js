import{AnalyticsMessages as r}from"./analytics/messages.js";import{DASHBOARD_CONFIG as c}from"./dashboard-config.js";const{API_ENDPOINTS:l}=c,u={session:null,cache:null,lastFetch:0,CACHE_DURATION:6e4,initialized:!1,init(s){this.session=s,!this.initialized&&(import("../../shared/utils/loader.js").then(({Loader:t})=>{t.loadCSS("css/sections/analytics.css")}),this.initialized=!0)},activate(){this.load()},deactivate(){},async load(s=!1){const t=document.getElementById("stats-grid");if(!t)return;const a=Date.now();if(!s&&this.cache&&a-this.lastFetch<this.CACHE_DURATION){this.render(this.cache);return}this.cache||this.showSkeleton();try{if(!this.session)return;const{token:e}=this.session,i=await fetch(l.ANALYTICS,{headers:{Authorization:`Bearer ${e}`}});if(i.ok){const n=await i.json();n&&typeof n=="object"?(this.cache=n,this.lastFetch=Date.now(),this.render(n)):(console.error("[Analytics] Invalid data format:",n),this.cache||(t.innerHTML=r.errorState))}else{const n=await i.text();console.error("[Analytics] Error response:",n),this.cache||(t.innerHTML=r.errorState)}}catch(e){console.error("[Analytics] Fetch error:",e),this.cache||(t.innerHTML=r.errorState)}},showSkeleton(){const s=document.getElementById("stats-grid");if(!s)return;const t=document.createDocumentFragment();for(let a=0;a<3;a++){const e=document.createElement("div");e.className="stat-card skeleton-card",e.innerHTML=`
                <div class="stat-icon skeleton skeleton-circle" style="width: 50px; height: 50px;"></div>
                <div class="stat-info" style="flex: 1;">
                    <div class="skeleton skeleton-text" style="width: 40px; height: 28px; margin-bottom: 5px;"></div>
                    <div class="skeleton skeleton-text" style="width: 100px; height: 16px;"></div>
                </div>
            `,t.appendChild(e)}s.innerHTML="",s.appendChild(t)},render(s){const t=document.getElementById("stats-grid");if(!t)return;const a=[{key:"clips",icon:"fa-film",label:"Clips Creados"},{key:"followage",icon:"fa-clock",label:"Consultas Followage"},{key:"so",icon:"fa-bullhorn",label:"Shoutouts"}],e=document.createDocumentFragment();a.forEach(i=>{const n=s[i.key]||0,o=document.createElement("div");o.className="stat-card",o.innerHTML=`
                <div class="stat-icon"><i class="fa-solid ${i.icon}"></i></div>
                <div class="stat-info">
                    <h3>${n}</h3>
                    <span>${i.label}</span>
                </div>
            `,e.appendChild(o)}),t.innerHTML="",t.appendChild(e)}};export{u as AnalyticsModule};
