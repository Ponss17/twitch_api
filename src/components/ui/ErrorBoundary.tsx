import { Component, type ErrorInfo, type ReactNode } from 'react';

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
    }

    private renderHint(): ReactNode {
        if (import.meta.env.DEV) {
            return (
                <p className="mb-4 text-sm text-[#a1a1aa]">
                    Si estás en desarrollo local, prueba reiniciar el servidor, borrar caché del navegador o
                    usar ventana de incógnito sin extensiones.
                </p>
            );
        }

        return (
            <p className="mb-4 text-sm text-[#a1a1aa]">
                Inténtalo de nuevo. Si el problema continúa, recarga la página o contacta soporte en Discord.
            </p>
        );
    }

    render() {
        if (this.state.error) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="rounded-xl border border-red-500/30 bg-[#0f0f11] p-6 text-center">
                    <i className="fa-solid fa-triangle-exclamation mb-3 text-2xl text-red-400" aria-hidden />
                    <h3 className="mb-2 text-lg font-semibold text-[#fafafa]">
                        {this.props.title ?? 'No se pudo cargar esta sección'}
                    </h3>
                    {this.renderHint()}
                    <button
                        type="button"
                        onClick={() => this.setState({ error: null })}
                        className="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7c3aed]"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
