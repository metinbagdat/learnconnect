import * as React from 'react';

const TabsContext = React.createContext<{ value: string; onValueChange: (v: string) => void } | null>(null);

export const Tabs = ({
  value,
  onValueChange,
  children,
  className = '',
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 ${className}`} {...props} />
  )
);
TabsList.displayName = 'TabsList';

export const TabsTrigger = ({
  value,
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) => {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;
  return (
    <button
      type="button"
      role="tab"
      onClick={() => ctx?.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ value, className = '', children, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return (
    <div ref={ref} role="tabpanel" className={`mt-2 ${className}`} {...props}>
      {children}
    </div>
  );
});
TabsContent.displayName = 'TabsContent';
