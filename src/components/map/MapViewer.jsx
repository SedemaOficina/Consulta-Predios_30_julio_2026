import Icons from '../ui/Icons';
import { useMapViewer } from './useMapViewer';

// Presentational shell — all imperative Leaflet logic lives in useMapViewer.
const MapViewer = (props) => {
    const { mapRef, tilesLoading } = useMapViewer(props);

    return (
        <div className="relative h-full w-full">
            <div id="main-map" ref={mapRef} className="h-full w-full bg-gray-200" />

            {tilesLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-map-overlay bg-black/10 pointer-events-none">
                    <div className="flex flex-col items-center gap-2 bg-white/90 px-4 py-3 rounded-lg shadow">
                        {Icons.Loader2 ? <Icons.Loader2 className="h-5 w-5 animate-spin text-guinda" /> : <span>Cargando...</span>}
                        <span className="text-[11px] text-gray-700 font-medium">Cargando información geográfica...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapViewer;
