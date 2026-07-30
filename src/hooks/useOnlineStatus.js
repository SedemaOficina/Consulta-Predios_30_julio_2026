import { useState, useEffect } from 'react';

// Tracks the browser's online/offline connectivity so the UI can react to it
// (e.g. warn that address search and the map base need a connection).
export default function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator === 'undefined' ? true : navigator.onLine
    );

    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return isOnline;
}
