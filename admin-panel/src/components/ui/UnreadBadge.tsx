export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="pointer-events-none absolute right-0 top-0 z-[200] flex h-5 min-w-5 -translate-y-[35%] translate-x-[35%] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
      style={{
        backgroundColor: "#e11d48",
        color: "#ffffff",
        border: "2px solid #ffffff",
        boxShadow: "0 0 0 1px rgba(225, 29, 72, 0.35)",
      }}
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
