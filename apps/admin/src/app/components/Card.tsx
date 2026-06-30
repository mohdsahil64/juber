import { ReactNode } from 'react';

interface CardProps {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  children?: ReactNode;
}

export default function Card({ icon, title, value, children }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-green-50 rounded-lg shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-gray-600 text-sm truncate">{title}</p>
            <div className="text-2xl sm:text-3xl mt-1 font-medium truncate">{value}</div>
          </div>
        </div>
        {children ? <div className="w-full sm:w-auto shrink-0">{children}</div> : null}
      </div>
    </div>
  );
}
