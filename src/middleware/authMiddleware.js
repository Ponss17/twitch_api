const checkToken = (req, res, next) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).send('Error: Token no proporcionado. Debes incluir ?token=TU_TOKEN en la URL.');
    }

    req.twitchToken = token;
    next();
};

module.exports = checkToken;
