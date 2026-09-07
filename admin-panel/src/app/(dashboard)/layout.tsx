import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RouteGuard } from "@/lib/auth";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex h-dvh overflow-hidden bg-page">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="admin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-2.5 lg:p-3">
            <div className="animate-pageIn mx-auto w-full max-w-[1360px]">{children}</div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
