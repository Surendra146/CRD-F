// frontend/src/components/ui/Loader.jsx
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Loader({ className, size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
    </div>
  );
}
