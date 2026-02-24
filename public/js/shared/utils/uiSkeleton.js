// frontend/shared/utils/uiSkeleton.ts
var Skeleton = {
  card() {
    return `
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
  },
  list(count = 3) {
    return Array(count).fill(this.card()).join("");
  },
  table(rows = 5) {
    const row = `
            <tr class="skeleton-row">
                <td><div class="skeleton-line"></div></td>
                <td><div class="skeleton-line"></div></td>
                <td><div class="skeleton-line short"></div></td>
            </tr>
        `;
    return Array(rows).fill(row).join("");
  }
};
export {
  Skeleton
};
