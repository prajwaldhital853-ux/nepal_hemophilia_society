export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="pointer-events-none absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-card dark:bg-red-500 dark:text-white dark:ring-[#111827]"
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
