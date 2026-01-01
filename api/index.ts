import app from '../src/app';

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server (TS) running on http://localhost:${PORT}`);
    });
}

export default app;
