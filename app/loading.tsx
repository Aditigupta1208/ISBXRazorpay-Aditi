export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="animate-pulse space-y-4 motion-reduce:animate-none">
      <div className="h-8 w-48 rounded-lg bg-[#ECECEC]" />
      <div className="h-28 rounded-2xl bg-[#ECECEC]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-[#ECECEC]" />
        <div className="h-64 rounded-2xl bg-[#ECECEC]" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
