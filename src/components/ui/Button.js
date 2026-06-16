'use client';

import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm',
  lg: 'text-base px-5 py-2.5',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className = '', children, type = 'button', disabled, ...rest },
  ref
) {
  const base = VARIANTS[variant] || VARIANTS.primary;
  const sized = SIZES[size] || '';
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${sized} ${className}`.trim()}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
});

export default Button;
