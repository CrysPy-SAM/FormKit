export default function AppSegmentLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="h-8 w-56 animate-shimmer bg-shimmer rounded-lg" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-shimmer bg-shimmer rounded-xl" />
        ))}
      </div>
      <div className="h-64 animate-shimmer bg-shimmer rounded-xl" />
    </div>
  );
}
