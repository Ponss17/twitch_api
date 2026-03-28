import app from '../src/app';

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor (TS) REINICIADO en http://localhost:${PORT}`);
    });
}

export default app;
