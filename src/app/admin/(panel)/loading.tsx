export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-black/10" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-black/10" />
        <div className="h-24 rounded-lg bg-black/10" />
      </div>
      <div className="h-40 rounded-lg bg-black/10" />
    </div>
  );
}
