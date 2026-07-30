import React from 'react';

/**
 * Error boundary with two presentations:
 *  - default ("page"): full-screen fallback with a reload button (top-level).
 *  - variant="section": compact inline fallback with a "Reintentar" button that
 *    resets the boundary (and calls optional `onRetry`).
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught Error in Component:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onRetry) this.props.onRetry();
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        // Compact inline fallback for a single section.
        if (this.props.variant === 'section') {
            return (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg flex flex-col items-center justify-center text-center my-4 animate-in fade-in">
                    <div className="text-red-400 mb-2">
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-red-900 mb-1">No se pudo cargar esta sección</h3>
                    <p className="text-xs text-red-700 mb-3 max-w-[200px]">Ocurrió un error al procesar estos datos.</p>
                    <button
                        type="button"
                        onClick={this.handleRetry}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-semibold rounded hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        // Default full-page fallback.
        return (
            <div className="p-6 bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Algo salió mal.</h1>
                <p className="mb-4">Se ha producido un error inesperado en la aplicación.</p>
                <pre className="bg-red-100 p-4 rounded text-xs overflow-auto max-w-2xl border border-red-200">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                >
                    Recargar Página
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
