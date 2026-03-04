/**
 * src/components/FormField.jsx
 * Reusable form field – supports text, email, password, number, select, textarea.
 */
export default function FormField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    options,         // for type="select": [{ value, label }]
    min, max, step,
    rows,            // for type="textarea"
    error,           // field-level error string
    hint,
}) {
    const inputProps = { name, value, onChange, placeholder, required, min, max, step }

    return (
        <div className="form-group">
            {label && (
                <label>
                    {label} {required && <span style={{ color: 'var(--clr-red)' }}>*</span>}
                </label>
            )}

            {type === 'select' ? (
                <select {...inputProps}>
                    <option value="">Select…</option>
                    {options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            ) : type === 'textarea' ? (
                <textarea {...inputProps} rows={rows || 3} />
            ) : (
                <input type={type} {...inputProps} />
            )}

            {hint && <p style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>{hint}</p>}
            {error && <p style={{ fontSize: '0.76rem', color: 'var(--clr-red)', marginTop: '0.25rem' }}>{error}</p>}
        </div>
    )
}
