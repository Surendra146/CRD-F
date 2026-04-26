// frontend/src/components/ui/Modal.jsx
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Wrapper (Top Centered) */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto">
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl w-full animate-slide-up mt-10',
            sizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}