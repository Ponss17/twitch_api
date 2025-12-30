const authService = require('../services/authService');

const login = (req, res) => {
    const redirectOrigin = req.query.redirect_origin || '';
    const url = authService.getAuthorizeUrl(redirectOrigin);
    res.redirect(url);
};

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
    } catch (error) {
        console.error('Error en autenticación:', error.response?.data || error.message);

        let errorRedirect = '/?error=auth_failed';
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decoded.redirectOrigin) errorRedirect = `${decoded.redirectOrigin}?error=auth_failed`;
            } catch (e) { }
        }
        res.redirect(errorRedirect);
    }
};

module.exports = {
    login,
    callback
};
