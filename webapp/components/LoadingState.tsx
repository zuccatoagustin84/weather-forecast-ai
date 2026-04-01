"use client";

export default function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Current weather skeleton */}
      <div className="rounded-3xl bg-white/10 border border-white/20 p-6 sm:p-8">
        <div className="h-4 w-32 bg-white/20 rounded-full mb-6" />
        <div className="flex items-end gap-4">
          <div className="h-28 w-36 bg-white/20 rounded-2xl" />
          <div className="pb-3 space-y-2">
            <div className="h-10 w-10 bg-white/20 rounded-xl" />
            <div className="h-4 w-24 bg-white/20 rounded-full" />
            <div className="h-3 w-20 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="rounded-3xl bg-white/10 border border-white/20 p-6">
        <div className="h-4 w-40 bg-white/20 rounded-full mb-4" />
        <div className="h-48 bg-white/10 rounded-2xl" />
      </div>

      {/* Forecast skeleton */}
      <div className="rounded-3xl bg-white/10 border border-white/20 p-6">
        <div className="h-4 w-32 bg-white/20 rounded-full mb-4" />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="h-3 w-20 bg-white/20 rounded-full" />
            <div className="h-6 w-6 bg-white/20 rounded-lg" />
            <div className="h-3 flex-1 bg-white/10 rounded-full" />
            <div className="h-3 w-16 bg-white/20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
