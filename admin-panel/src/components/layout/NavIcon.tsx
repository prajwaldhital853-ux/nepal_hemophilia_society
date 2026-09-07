import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Package,
  Syringe,
  BarChart3,
  ShieldCheck,
  Settings,
  Globe,
  Newspaper,
  CalendarDays,
  Images,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  layout: LayoutDashboard,
  patients: Users,
  admin: UserCog,
  hospital: Building2,
  stock: Package,
  treatment: Syringe,
  users: Users,
  reports: BarChart3,
  audit: ShieldCheck,
  settings: Settings,
  globe: Globe,
  news: Newspaper,
  events: CalendarDays,
  gallery: Images,
  resources: FolderOpen,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? LayoutDashboard;
  return <Icon className={className} strokeWidth={1.75} />;
}
