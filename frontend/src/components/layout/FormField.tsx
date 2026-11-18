import React from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  style = {},
}) => {
  return (
    <div className="form-group" style={style}>
      <label
        htmlFor={htmlFor}
        className="form-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.825rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: '0.35rem',
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: 'var(--danger-main)', fontWeight: 700 }}>*</span>}
      </label>

      {children}

      {hint && !error && (
        <span
          style={{
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
          }}
        >
          {hint}
        </span>
      )}

      {error && (
        <span
          style={{
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--danger-main)',
            fontWeight: 500,
            marginTop: '0.25rem',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
