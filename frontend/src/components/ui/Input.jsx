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
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-dark-100 mb-2">{label}</label>
      )}
      <Component
        id={name}
        name={name}
        type={type}
        ref={ref}
        {...props}
        className={cn(
          'w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-900 dark:text-dark-50 rounded-lg transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:focus:ring-cyan-400',
          'placeholder:text-gray-400 dark:placeholder:text-dark-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500/50 dark:border-red-500/50 bg-red-50 dark:bg-red-500/5'
        )}
      />
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
      {helperText && !error && <p className="text-gray-500 dark:text-dark-400 text-sm mt-2">{helperText}</p>}
    </div>
  );
});

export default Input;
