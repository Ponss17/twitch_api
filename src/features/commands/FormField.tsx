import { textInput, inputLabel } from '@/core/utils/tw';

export function FormField({
    label,
    value,
    onChange,
    placeholder
}: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            {label ? <span className={inputLabel}>{label}</span> : null}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={textInput}
            />
        </div>
    );
}
