import * as React from 'react';

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional progress percentage (0–100) to show a progress bar below the value. */
  progress?: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {Icon && <Icon className="h-8 w-8 text-blue-600 ml-4 shrink-0" />}
      </div>
    </div>
  );
}
