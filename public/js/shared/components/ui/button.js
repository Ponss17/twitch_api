var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const _AppButton = class _AppButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "icon", "loading", "disabled", "type"];
  }
  constructor() {
    super();
    this.innerHTML = "";
    this.button = document.createElement("button");
    this.button.className = "btn";
  }
  connectedCallback() {
    this.render();
    while (this.childNodes.length > 0) {
      this.button.appendChild(this.childNodes[0]);
    }
    this.appendChild(this.button);
    this.button.addEventListener("click", (e) => {
      if (this.hasAttribute("disabled") || this.hasAttribute("loading")) {
        e.stopPropagation();
        e.preventDefault();
      }
    });
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.render();
  }
  render() {
    const variant = this.getAttribute("variant") || "primary";
    const size = this.getAttribute("size") || "md";
    const icon = this.getAttribute("icon");
    const loading = this.hasAttribute("loading");
    const disabled = this.hasAttribute("disabled");
    const type = this.getAttribute("type") || "button";
    let btnClass = `btn-${variant}`;
    if (variant === "ghost") btnClass = "btn-icon";
    let sizeClass = "";
    if (size === "sm") sizeClass = "btn-sm";
    if (size === "lg") sizeClass = "btn-large";
    this.button.className = `${btnClass} ${sizeClass} app-button`;
    this.button.type = type;
    this.button.disabled = disabled || loading;
    const existingIcon = this.button.querySelector("i");
    if (existingIcon) existingIcon.remove();
    if (loading) {
      const loader = document.createElement("i");
      loader.className = "fa-solid fa-circle-notch fa-spin";
      this.button.prepend(loader);
    } else if (icon) {
      const i = document.createElement("i");
      i.className = `fa-solid fa-${icon}`;
      this.button.prepend(i);
    }
  }
};
__name(_AppButton, "AppButton");
let AppButton = _AppButton;
customElements.define("app-button", AppButton);
