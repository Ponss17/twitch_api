import app from './app';

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`LosPerris Twitch API listening on http://localhost:${PORT}`);
    });
}

export default app;
