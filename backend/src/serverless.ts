import app from './app';

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`LosPerris Twitch API listening on http://localhost:${PORT}`);
        }
    });
}

export default app;
