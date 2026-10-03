import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  className,
  label,
  error,
  options = [],
  placeholder = 'Select...',
  ...props
}, ref) => {
  return (
    <div className="min-w-0 space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'block min-w-0 w-full appearance-none rounded-xl border px-4 py-2.5 pr-10',
            'bg-white/95 shadow-sm',
            'focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100',
            'transition-all duration-200',
            error
              ? 'border-red-300 text-red-900 focus:ring-red-100'
              : 'border-slate-200 text-slate-900 hover:border-slate-300',
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
