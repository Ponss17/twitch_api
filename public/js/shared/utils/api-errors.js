var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const formatApiError = /* @__PURE__ */ __name(async (response) => {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.details && Array.isArray(json.details) && json.details.length > 0) {
        return json.details[0].message;
      }
      if (json.error) return json.error;
      if (json.message) return json.message;
      return text;
    } catch {
      return text.length > 100 ? text.substring(0, 97) + "..." : text;
    }
  } catch (_e) {
    return "Error desconocido al procesar la respuesta del servidor";
  }
}, "formatApiError");
export {
  formatApiError
};
