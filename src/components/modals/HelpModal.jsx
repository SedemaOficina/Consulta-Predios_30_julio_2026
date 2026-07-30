import { useState, useEffect, useRef } from 'react';
import Icons from '../ui/Icons';
import { CONSTANTS } from '../../utils/constants';

const FallbackX = () => <span className="text-xl">×</span>;
const FallbackMapPinned = () => <span>📍</span>;

const HelpModal = ({ isOpen, onClose }) => {
    // Direct Access
    const { CONTACT_INFO } = CONSTANTS || {};


    // Fallback for missing icon
    const XIcon = Icons.X || FallbackX;
    const MapPinnedIcon = Icons.MapPinned || FallbackMapPinned;

    const [isVisible, setIsVisible] = useState(false);
    const dialogRef = useRef(null);
    const previouslyFocusedRef = useRef(null);

    // Keep the latest onClose without re-running the focus-trap effect on every
    // render (onClose is a fresh inline function from the parent each render).
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });

    useEffect(() => {
        if (isOpen) {
            // Small timeout to ensure DOM mount before transition
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        } else {
            setTimeout(() => setIsVisible(false), 0);
        }
    }, [isOpen]);

    // Accessible dialog behaviour: trap focus, close on Escape (NOT Enter, which
    // used to close accidentally), and restore focus to the trigger on close.
    useEffect(() => {
        if (!isOpen) return;

        const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        previouslyFocusedRef.current = document.activeElement;

        const focusTimer = setTimeout(() => {
            const dialog = dialogRef.current;
            if (!dialog) return;
            const first = dialog.querySelector(FOCUSABLE);
            (first || dialog).focus();
        }, 60);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCloseRef.current?.();
                return;
            }
            if (e.key !== 'Tab') return;

            const dialog = dialogRef.current;
            if (!dialog) return;
            const focusables = dialog.querySelectorAll(FOCUSABLE);
            if (!focusables.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(focusTimer);
            window.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedRef.current?.focus?.();
        };
    }, [isOpen]);

    if (!CONTACT_INFO) return null;
    if (!isOpen) return null;



    return (
        <div
            className={`fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ pointerEvents: 'auto' }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-modal-title"
                tabIndex={-1}
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden glass-panel transition-all duration-300 ease-out transform focus:outline-none ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-guinda flex items-center justify-center text-white shadow-sm">
                            <span className="font-bold text-xl">?</span>
                        </div>
                        <div>
                            <h2 id="help-modal-title" className="text-base font-bold text-gray-800 leading-tight">
                                Verifica si un punto se encuentra en
                            </h2>
                            <p className="text-sm text-guinda font-semibold">
                                Suelo de Conservación o Área Natural Protegida
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                        aria-label="Cerrar"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-6">

                        {/* Sección 1: Cómo Consultar */}
                        <section>
                            <h3 className="flex items-center gap-2 text-base font-bold text-guinda mb-3 uppercase tracking-wide">
                                <MapPinnedIcon className="h-4 w-4" />
                                ¿Cómo realizar una consulta?
                            </h3>
                            <ul className="space-y-3 pl-1">
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">1</span>
                                    <span>
                                        <strong>Búsqueda por dirección:</strong> Escribe la calle y número en el buscador lateral (ej. &quot;Av. Insurgentes Sur 100&quot;).
                                    </span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">2</span>
                                    <span>
                                        <strong>Búsqueda por coordenadas:</strong> Ingresa latitud y longitud (ej. &quot;19.4326, -99.1332&quot;).
                                    </span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">3</span>
                                    <span>
                                        <strong>Navegación manual:</strong> Navega por el mapa y haz clic directamente sobre la ubicación de interés.
                                    </span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">4</span>
                                    <span>
                                        <strong>Mi ubicación:</strong> Utiliza el botón de geolocalización para ubicarte automáticamente.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Sección 2: Qué puedes hacer */}
                        <section>
                            <h3 className="flex items-center gap-2 text-base font-bold text-guinda mb-3 uppercase tracking-wide">
                                <Icons.CheckCircle className="h-4 w-4" />
                                Acciones Disponibles
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <Icons.Pdf className="h-5 w-5 text-guinda mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-gray-700 block">Descargar Ficha</span>
                                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">Obtén un reporte oficial en PDF</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <Icons.MapIcon className="h-5 w-5 text-guinda mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-gray-700 block">Google Maps</span>
                                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">Ver la ubicación en Google Maps</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <Icons.Share className="h-5 w-5 text-guinda mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-gray-700 block">Compartir</span>
                                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">Comparte el resultado por enlace</span>
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Contacto */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm mb-1">¿Necesitas más información?</h4>
                                <p className="text-xs text-blue-700">Comunícate a la Dirección General de Ordenamiento Ecológico.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-blue-900">{CONTACT_INFO.phone}</div>
                                <div className="text-[10px] text-blue-700">{CONTACT_INFO.hours}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-guinda text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-guinda-dark transition-all active:scale-95 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
