import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}, ref) => {

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500/30 shadow-sm',

    secondary:
      'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-300',

    outline:
      'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-300',

    subtle:
      'bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-200',

    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',

    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-lg font-medium',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;