import useUIStore from '../../stores/useUIStore';
import Icons from './Icons';

export const ToastContainer = () => {
    const toasts = useUIStore(state => state.toasts);

    return (
        <div
            className="absolute md:bottom-24 bottom-auto top-32 md:top-auto left-1/2 transform -translate-x-1/2 z-toast flex flex-col gap-2 pointer-events-none w-max max-w-[90%]"
            role="region"
            aria-label="Notificaciones"
            aria-live="polite"
            aria-atomic="false"
        >
            {toasts.map(t => (
                <div
                    key={t.id}
                    role={t.type === 'error' ? 'alert' : 'status'}
                    className={`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white animate-slide-up flex items-center gap-2
              ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-gray-800'}
            `}
                >
                    {Icons.AlertCircle && t.type === 'error' && <Icons.AlertCircle className="h-4 w-4" />}
                    {Icons.CheckCircle && t.type === 'success' && <Icons.CheckCircle className="h-4 w-4" />}
                    {t.message}
                </div>
            ))}
        </div>
    );
};
