import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-slate-100 rounded-lg mb-3"></div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-slate-100 rounded"
                style={{ width: `${Math.max(40, (100 / cols) * (0.6 + Math.random() * 0.4))}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
          <div className="h-7 w-14 bg-slate-200 rounded"></div>
        </div>
        <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  );
};
