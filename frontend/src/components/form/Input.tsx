import { forwardRef } from 'react';
import { FieldError } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError | undefined;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = '',
      containerClassName = '',
      labelClassName = '',
      errorClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={`mb-4 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${labelClassName}`}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`block w-full px-3 py-2 border ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
          } rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm dark:bg-gray-700 dark:text-white ${className}`}
          {...props}
        />
        {error && (
          <p
            className={`mt-1 text-sm text-red-600 dark:text-red-400 ${errorClassName}`}
          >
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
