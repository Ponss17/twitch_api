const Logger = {
  log(...args) {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      console.log(...args);
    }
  },
  warn(...args) {
    console.warn(...args);
  },
  error(...args) {
    console.error(...args);
  }
};
export {
  Logger
};
