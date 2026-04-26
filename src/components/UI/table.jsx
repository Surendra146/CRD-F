// frontend/src/components/ui/Table.jsx
import { cn } from '../../utils/cn';

export function Table({ className, children, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn('w-full text-sm text-left', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead
      className={cn('text-xs text-gray-700 uppercase bg-gray-50', className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr
      className={cn('bg-white hover:bg-gray-50 transition-colors', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th
      className={cn('px-6 py-3 font-medium', className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn('px-6 py-4', className)} {...props}>
      {children}
    </td>
  );
}
