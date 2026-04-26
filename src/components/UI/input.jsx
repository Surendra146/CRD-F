import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({
  className,
  type = 'text',
  label,
  error,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'block w-full rounded-xl border px-4 py-2.5',
          'bg-white/95 shadow-sm',
          'focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100',
          'transition-all duration-200',
          'placeholder:text-slate-400',
          error
            ? 'border-red-300 text-red-900 focus:ring-red-100'
            : 'border-slate-200 text-slate-900 hover:border-slate-300',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
