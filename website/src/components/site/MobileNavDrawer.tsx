import { useEffect, useState } from "react";
import { ChevronRight, Mail, Phone, X } from "lucide-react";

import nhsLogo from "@/assets/nhs-logo.png";
import { navItems } from "@/components/site/nav";
import { SiteLink } from "@/components/site/SiteLink";
import { Button } from "@/components/ui/button";

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setExpanded(null);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mobile-nav-root fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Site menu">
      <button type="button" className="mobile-nav-backdrop absolute inset-0 bg-black/45" aria-label="Close menu" onClick={onClose} />

      <aside className="mobile-nav-drawer absolute inset-y-0 right-0 flex w-[min(100%,21rem)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <SiteLink href="/" className="flex items-center gap-2 font-black" onClick={onClose}>
            <img src={nhsLogo} alt="" className="size-9 rounded bg-white p-0.5" width={36} height={36} />
            <span className="text-sm leading-tight">Nepal Hemophilia Society</span>
          </SiteLink>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md bg-white/15 text-primary-foreground"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isExpanded = expanded === item.label;
            return (
              <div key={item.label} className="mobile-nav-group border-b border-border/70 last:border-b-0">
                <div className="flex items-stretch">
                  <SiteLink
                    href={item.href}
                    onClick={onClose}
                    className="flex flex-1 items-center py-3.5 pl-1 text-sm font-extrabold text-foreground hover:text-primary"
                  >
                    {item.label}
                  </SiteLink>
                  {item.children ? (
                    <button
                      type="button"
                      className={`mobile-nav-toggle inline-flex w-11 shrink-0 items-center justify-center text-primary transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label} submenu`}
                      onClick={() => setExpanded(isExpanded ? null : item.label)}
                    >
                      <ChevronRight className="size-5" strokeWidth={2.5} />
                    </button>
                  ) : (
                    <span className="w-3 shrink-0" aria-hidden="true" />
                  )}
                </div>
                {item.children && isExpanded ? (
                  <div className="mobile-nav-sub mb-2 ml-1 grid gap-0.5 border-l-2 border-primary/30 pl-3">
                    {item.children.map((child) => (
                      <SiteLink
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className="rounded-md px-2 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary hover:text-primary"
                      >
                        {child.label}
                      </SiteLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border bg-secondary/60 px-4 py-4">
          <div className="grid gap-2">
            <Button variant="brand" className="w-full" asChild>
              <SiteLink href="/get-involved/join" onClick={onClose}>Become a Member</SiteLink>
            </Button>
            <Button variant="outline" className="w-full border-primary text-primary" asChild>
              <SiteLink href="/about" onClick={onClose}>About the Society</SiteLink>
            </Button>
          </div>
          <div className="mt-4 space-y-2 text-xs font-bold text-foreground">
            <a href="mailto:nepalhemo@gmail.com" className="flex items-center gap-2 hover:text-primary">
              <Mail className="size-3.5 text-primary" />nepalhemo@gmail.com
            </a>
            <a href="tel:+97715172729" className="flex items-center gap-2 hover:text-primary">
              <Phone className="size-3.5 text-primary" />01-5172729
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
