const l={card(){return`
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `},list(e=3){return Array(e).fill(this.card()).join("")},table(e=5){return Array(e).fill(`
            <tr class="skeleton-row">
                <td><div class="skeleton-line"></div></td>
                <td><div class="skeleton-line"></div></td>
                <td><div class="skeleton-line short"></div></td>
            </tr>
        `).join("")}};export{l as Skeleton};
