import { cn } from '../../utils/cn';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
