import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(function Input(
  { label, name, error, helperText, className, as = 'input', type = 'text', ...props },
  ref
) {
  const Component = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      )}
      <Component
        id={name}
        name={name}
        type={type}
        ref={ref}
        {...props}
        className={cn(
          'w-full px-3 py-2 border border-slate-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100',
          'placeholder:text-slate-500 dark:placeholder:text-slate-400',
          'disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500'
        )}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helperText && !error && <p className="text-slate-500 text-sm mt-1">{helperText}</p>}
    </div>
  );
});

export default Input;
