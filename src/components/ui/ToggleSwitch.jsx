/* React removed */

const ToggleSwitch = ({ checked, onChange, disabled, activeColor, title, ariaLabel }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || title}
        title={title}
        disabled={disabled}
        onClick={(e) => {
            e.stopPropagation();
            if (!disabled && onChange) onChange(!checked);
        }}
        className={`w-7 h-4 flex items-center rounded-full p-[2px] duration-300 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-guinda focus-visible:ring-offset-1 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${checked && !disabled ? '' : 'bg-gray-300'
            }`}
        style={{
            backgroundColor: (checked && !disabled) ? (activeColor || '#9d2148') : undefined
        }}
    >
        <span
            aria-hidden="true"
            className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${checked ? 'translate-x-3' : ''}`}
        />
    </button>
);

export default ToggleSwitch;
