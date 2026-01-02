"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app_1.default.listen(PORT, () => {
        console.log(`Server (TS) running on http://localhost:${PORT}`);
    });
}
exports.default = app_1.default;
