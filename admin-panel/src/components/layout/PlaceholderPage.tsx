export function PlaceholderPage({ title, crumb }: { title: string; crumb: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[18px] font-semibold text-ink">{title}</h1>
        <p className="mt-0.5 text-[11px] text-muted">Home &gt; {crumb}</p>
      </div>
      <div className="panel p-4 text-[11px] text-muted">
        {title} design will be added next. Navigation and layout already match the admin panel.
      </div>
    </div>
  );
}
