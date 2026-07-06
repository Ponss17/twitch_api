import app from './app';

const isMain =
    (typeof require !== 'undefined' && require.main === module) ||
    process.argv.some(arg => arg.endsWith('serverless.ts') || arg.endsWith('serverless.js'));

if (isMain) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`LosPerris Twitch API listening on http://localhost:${PORT}`);
        }
    });
}

export default app;
