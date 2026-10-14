import React from 'react';

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl animate-pulse space-y-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100"></div>
          <div className="w-16 h-7 rounded-lg bg-slate-200"></div>
          <div className="w-24 h-3 rounded-md bg-slate-100"></div>
        </div>
      ))}
    </div>
  );
}

export function ProjectCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl animate-pulse space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="w-48 h-4 rounded-md bg-slate-200"></div>
              <div className="w-32 h-3 rounded-md bg-slate-100"></div>
            </div>
            <div className="w-20 h-6 rounded-full bg-slate-100"></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-14 rounded-xl bg-slate-50"></div>
            ))}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 animate-pulse space-y-4">
      <div className="flex justify-between border-b border-slate-100 pb-3">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="w-20 h-3 rounded-md bg-slate-200"></div>
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="w-24 h-3 rounded-md bg-slate-100"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-lg font-bold">
        !
      </div>
      <div className="text-sm font-bold text-rose-800">
        {message || "Failed to load records from the server."}
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
      >
        Retry
      </button>
    </div>
  );
}
