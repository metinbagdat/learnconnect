import { useLanguage } from '@/contexts/consolidated-language-context';
import { BilingualText } from '@/components/ui/bilingual-text';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

/**
 * Simple CSS-based bar chart (no external library needed)
 */
export function SimpleBarChart({ data, title, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-2">
      {title && <h4 className="font-medium text-sm">{title}</h4>}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.color || 'bg-blue-600'
                }`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LinePoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: LinePoint[];
  title?: string;
  height?: number;
}

/**
 * Simple CSS-based line chart visualization
 */
export function SimpleLineChart({ data, title, height = 200 }: SimpleLineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-2">
      {title && <h4 className="font-medium text-sm mb-4">{title}</h4>}
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex items-end justify-around border-l border-b dark:border-slate-700">
          {data.map((point, index) => {
            const percentage = (point.value / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex flex-col items-center w-full">
                  <span className="text-xs font-medium mb-1">{point.value}</span>
                  <div
                    className="w-2 bg-blue-600 rounded-t transition-all duration-500"
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: PieSlice[];
  title?: string;
  size?: number;
}

/**
 * Simple pie chart using conic gradient
 */
export function SimplePieChart({ data, title, size = 200 }: SimplePieChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  
  let currentAngle = 0;
  const gradientStops = data.map(slice => {
    const percentage = (slice.value / total) * 100;
    const startAngle = currentAngle;
    currentAngle += percentage;
    return `${slice.color} ${startAngle}% ${currentAngle}%`;
  }).join(', ');

  return (
    <div className="space-y-4">
      {title && <h4 className="font-medium text-sm">{title}</h4>}
      <div className="flex items-center gap-6">
        <div
          className="rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `conic-gradient(${gradientStops})`
          }}
        />
        <div className="space-y-2">
          {data.map((slice, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{slice.label}</span>
              <span className="font-medium ml-auto">
                {((slice.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
