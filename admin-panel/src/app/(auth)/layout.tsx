export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-page">
      {children}
    </div>
  );
}
