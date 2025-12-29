let authenticatedUserToken = null;

module.exports = {
    getToken: () => authenticatedUserToken,
    setToken: (token) => { authenticatedUserToken = token; }
};
