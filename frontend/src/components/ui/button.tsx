import { ButtonHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'destructive' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-blue-500 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700',
      ghost: 'bg-transparent hover:bg-gray-100 focus-visible:ring-blue-500 dark:text-white dark:hover:bg-gray-700',
      link: 'bg-transparent text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 dark:text-blue-400',
    };
    
    const sizeStyles = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 py-2 px-4',
      lg: 'h-11 px-8 text-lg',
    };
    
    const iconSizeStyles = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };
    
    return (
      <button
        ref={ref}
        className={twMerge(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className={`animate-spin -ml-1 mr-2 ${iconSizeStyles[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && (
          <span className={`mr-2 ${iconSizeStyles[size]}`}>
            {leftIcon}
          </span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={`ml-2 ${iconSizeStyles[size]}`}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
