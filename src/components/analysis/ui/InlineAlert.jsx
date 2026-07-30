/* React removed */
import Icons from '../../ui/Icons';

const InlineAlert = ({ tone, children }) => {
    // Configuración de tonos
    const variants = {
        anp: {
            bg: 'bg-purple-50',
            border: 'border-purple-400',
            text: 'text-purple-900',
            icon: Icons.Leaf
        },
        nodata: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-400',
            text: 'text-yellow-800',
            icon: Icons.AlertTriangle
        },
        urban: {
            bg: 'bg-blue-50',
            border: 'border-blue-400',
            text: 'text-blue-900',
            icon: Icons.Info
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-400',
            text: 'text-red-900',
            icon: Icons.XCircle
        }
    };

    const variant = variants[tone] || variants.nodata;
    const VariantIcon = variant.icon;

    return (
        <div className={`p-3 text-xs border-l-4 rounded-r mb-3 flex items-start gap-2 animate-in fade-in ${variant.bg} ${variant.border} ${variant.text}`}>
            {VariantIcon && <VariantIcon className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />}
            <div className="leading-snug">{children}</div>
        </div>
    );
};

export default InlineAlert;
