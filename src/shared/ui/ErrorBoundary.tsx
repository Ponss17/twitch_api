import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';


interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    title?: string;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/** Evita que un fallo de carga de módulo (p. ej. deps de Vite) tumbe todo el dashboard. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
        
        // Detección de error de chunk perdido tras un nuevo deploy
        const isChunkError = 
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Importing a module script failed') ||
            error.message.includes('error loading dynamically imported module');

        if (isChunkError) {
            const lastReload = sessionStorage.getItem('chunk_error_last_reload');
            const now = Date.now();
            if (!lastReload || now - parseInt(lastReload, 10) > 10_000) {
                sessionStorage.setItem('chunk_error_last_reload', now.toString());
                window.location.reload();
            }
        }
    }

    private renderHint(): ReactNode {
        if (import.meta.env.DEV) {
            return (
                <p className="mb-4 text-sm text-text-muted">
                    Si estás en desarrollo local, prueba reiniciar el servidor, borrar caché del navegador o
                    usar ventana de incógnito sin extensiones.
                </p>
            );
        }

        return (
            <p className="mb-4 text-sm text-text-muted">
                Inténtalo de nuevo. Si el problema continúa, recarga la página o contacta soporte en Discord.
            </p>
        );
    }

    render() {
        if (this.state.error) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="rounded-xl border border-error/30 bg-bg-secondary p-6 text-center">
                    <AlertTriangle className="mb-3 text-2xl text-error" />
                    <h3 className="mb-2 text-lg font-semibold text-text-main">
                        {this.props.title ?? 'No se pudo cargar esta sección'}
                    </h3>
                    {this.renderHint()}
                    <button
                        type="button"
                        onClick={() => this.setState({ error: null })}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
