export const Skeleton = ({ className = '', variant = 'text' }: { className?: string; variant?: 'text' | 'card' | 'circle' | 'chart' }) => {
  const base = 'skeleton';

  if (variant === 'card') {
    return (
      <div className={`${base} p-4 space-y-3 ${className}`}>
        <div className={`${base} h-4 w-3/4 rounded`} />
        <div className={`${base} h-3 w-1/2 rounded`} />
        <div className={`${base} h-3 w-5/6 rounded`} />
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} />;
  }

  if (variant === 'chart') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className={`${base} h-3 w-1/3 rounded`} />
        <div className="flex items-end gap-1 h-32">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${base} flex-1 rounded`} style={{ height: `${30 + Math.random() * 70}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return <div className={`${base} h-4 rounded ${className}`} />;
};
