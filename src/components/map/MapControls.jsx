import { useState } from 'react';
import Icons from '../ui/Icons';
import Tooltip from '../ui/Tooltip';

const MapControls = ({
    onOpenHelp,
    isLegendOpen,
    setLegendOpen,
    globalOpacity,
    setGlobalOpacity,
    onResetView,
    onUserLocation,
    onZoomIn,
    onZoomOut
}) => {
    const [isFabOpen, setIsFabOpen] = useState(false);

    return (
        <>
            {/* CONTROLS STACK (Top Right) */}
            <div className="absolute top-16 md:top-20 right-4 flex flex-col items-center gap-3 pointer-events-auto z-header">

                {/* 1. Help */}
                <Tooltip content="Ayuda y Tutorial" placement="left">
                    <button
                        type="button"
                        aria-label="Ayuda y tutorial"
                        onClick={onOpenHelp}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <span aria-hidden="true" className="font-bold text-xl leading-none">?</span>
                    </button>
                </Tooltip>

                {/* 2. Layers */}
                <Tooltip content="Capas y Simbología" placement="left">
                    <button
                        type="button"
                        aria-label="Capas y simbología"
                        aria-expanded={isLegendOpen}
                        onClick={() => setLegendOpen(!isLegendOpen)}
                        className={`w-11 h-11 flex items-center justify-center rounded-full shadow-md border border-gray-200 transition-all hover:scale-105 active:scale-95 ${isLegendOpen ? 'bg-guinda text-white border-guinda' : 'bg-white text-guinda hover:bg-gray-50'}`}
                    >
                        <Icons.Layers aria-hidden="true" className="h-5 w-5" />
                    </button>
                </Tooltip>

                {/* MOBILE ZOOM CONTROLS (Inside Top Stack) */}
                <div className="md:hidden flex flex-col gap-3">
                    <button
                        type="button"
                        aria-label="Acercar"
                        onClick={onZoomIn}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Icons.Plus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        aria-label="Alejar"
                        onClick={onZoomOut}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Icons.Minus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* 3. OPTIONS FAB */}
                <div className="relative flex flex-col items-end">

                    {/* Expanded Menu Items */}
                    <div className={`flex flex-col items-center gap-3 transition-all duration-300 origin-top pt-3 ${isFabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 -translate-y-4 pointer-events-none absolute top-full right-0 mt-2'}`}>

                        {/* Opacity Slider */}
                        <Tooltip content="Ajustar Opacidad" placement="left">
                            <div className="hidden md:flex flex-col items-center gap-1 bg-white rounded-full shadow-md border border-gray-200 py-2 w-10 h-auto animate-scale-in">
                                <div className="text-guinda mb-1">
                                    {Icons.Droplet ? <Icons.Droplet className="h-4 w-4" /> : <div className="h-3 w-3 bg-guinda rounded-full" />}
                                </div>
                                <input
                                    type="range"
                                    aria-label="Ajustar opacidad de las capas"
                                    min="0.1"
                                    max="0.45"
                                    step="0.05"
                                    value={globalOpacity || 0.20}
                                    onChange={(e) => setGlobalOpacity(parseFloat(e.target.value))}
                                    className="w-1 h-16 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-guinda my-1"
                                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                />
                                <div className="mt-1 px-1 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-guinda w-full text-center">
                                    {Math.round((globalOpacity || 0.20) * 100)}%
                                </div>
                            </div>
                        </Tooltip>

                        {/* Reset View */}
                        <Tooltip content="Restablecer vista" placement="left">
                            <button
                                type="button"
                                aria-label="Restablecer vista"
                                onClick={() => { onResetView(); setIsFabOpen(false); }}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Icons.RotateCcw aria-hidden="true" className="h-5 w-5" />
                            </button>
                        </Tooltip>

                        {/* My Location */}
                        <Tooltip content="Mi Ubicación" placement="left">
                            <button
                                type="button"
                                aria-label="Ir a mi ubicación"
                                onClick={() => { onUserLocation(); setIsFabOpen(false); }}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Icons.Navigation aria-hidden="true" className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* FAB Trigger */}
                    <Tooltip content={isFabOpen ? "Cerrar menú" : "Más opciones"} placement="left">
                        <button
                            type="button"
                            aria-label={isFabOpen ? "Cerrar menú de opciones" : "Más opciones"}
                            aria-expanded={isFabOpen}
                            onClick={() => setIsFabOpen(!isFabOpen)}
                            className={`w-11 h-11 flex items-center justify-center rounded-full shadow-lg border border-gray-200 transition-all duration-300 z-10 hover:scale-105 active:scale-95 ${isFabOpen ? 'bg-gray-800 rotate-90 text-white border-gray-800' : 'bg-guinda text-white border-guinda'}`}
                        >
                            {isFabOpen ? <Icons.X aria-hidden="true" className="h-5 w-5" /> : <Icons.Menu aria-hidden="true" className="h-5 w-5" />}
                        </button>
                    </Tooltip>

                </div>
            </div>

            {/* ZOOM CONTROLS (Bottom Right - Desktop Only) */}
            <div className="hidden md:flex absolute bottom-36 md:bottom-10 right-4 flex-col items-center gap-3 z-header">
                <Tooltip content="Acercar" placement="left">
                    <button
                        type="button"
                        aria-label="Acercar"
                        onClick={onZoomIn}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Icons.Plus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                </Tooltip>

                <Tooltip content="Alejar" placement="left">
                    <button
                        type="button"
                        aria-label="Alejar"
                        onClick={onZoomOut}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-guinda hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Icons.Minus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                </Tooltip>
            </div>
        </>
    );
};

export default MapControls;
