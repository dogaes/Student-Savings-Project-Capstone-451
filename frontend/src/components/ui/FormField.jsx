// A labeled Bootstrap input with an error message under it.
// Pass `as="select"` with <option> children for a dropdown.
export default function FormField({ id, label, error, help, as = 'input', className = 'col-12', children, ...props }) {
  const Tag = as
  const cls = as === 'select' ? 'form-select' : 'form-control'
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">{label}</label>
      <Tag id={id} name={id} className={`${cls} ${error ? 'is-invalid' : ''}`} {...props}>{children}</Tag>
      {help && !error && <div className="form-text">{help}</div>}
      <div className="invalid-feedback" aria-live="polite">{error}</div>
    </div>
  )
}
