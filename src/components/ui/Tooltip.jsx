import { useRef, useEffect } from 'react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

const Tooltip = ({ content, children, placement = 'top' }) => {
    const triggerRef = useRef(null);

    useEffect(() => {
        if (triggerRef.current && content) {
            const instance = tippy(triggerRef.current, {
                content: content,
                placement: placement,
                animation: 'scale',
                arrow: true,
                theme: 'light-border',
                interactive: true,
                zIndex: 9999,
                appendTo: () => document.body,
            });

            return () => {
                instance.destroy();
            };
        }
    }, [content, placement]);

    return (
        <span ref={triggerRef} className="inline-flex items-center cursor-help">
            {children}
        </span>
    );
};

export default Tooltip;
