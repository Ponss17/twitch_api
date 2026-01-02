"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.callback = exports.login = void 0;
const authService = __importStar(require("../services/authService"));
const login = (req, res) => {
    const redirectOrigin = req.query.redirect_origin || '';
    const url = authService.getAuthorizeUrl(redirectOrigin);
    res.redirect(url);
};
exports.login = login;
const callback = async (req, res) => {
    const { code, state } = req.query;
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    try {
        const { user, access_token, redirectOrigin } = await authService.handleCallback(code, state);
        const params = `?token=${access_token}&userId=${user.id}&login=${user.login}&displayName=${encodeURIComponent(user.display_name)}`;
        const redirectUrl = redirectOrigin ? `${redirectOrigin}${params}` : `/${params}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error en autenticación:', errorMessage);
        let errorRedirect = '/?error=auth_failed';
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decoded.redirectOrigin)
                    errorRedirect = `${decoded.redirectOrigin}?error=auth_failed`;
            }
            catch (e) { }
        }
        res.redirect(errorRedirect);
    }
};
exports.callback = callback;
