import{UI as l}from"../../../core/ui.js";const p={renderRow(r,t,e){const[a,s]=r,n=l.escapeHTML(a),o=s/e*100,c=t<3?`rank-${t+1}`:"",d=t===0?"\u{1F947}":t===1?"\u{1F948}":t===2?"\u{1F949}":`#${t+1}`;return`
            <tr class="fade-in ${c}">
                <td><span class="rank-medal">${d}</span></td>
                <td class="word-text" style="font-weight:600;">${n}</td>
                <td class="count-text" style="text-align:right; font-size:1.1rem;">${s}</td>
                <td>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width:${o}%"></div>
                    </div>
                </td>
            </tr>
        `}};export{p as TrendsTemplates};
//# sourceMappingURL=templates.js.map
