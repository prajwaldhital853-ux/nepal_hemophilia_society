import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

export const SiteLink = forwardRef<HTMLAnchorElement, Props>(function SiteLink({ href, onClick, children, ...rest }, ref) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    if (href.startsWith("#")) {
      event.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      return;
    }

    const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
    if (external) return;

    event.preventDefault();
    const [path, hash] = href.split("#");
    void router.navigate({
      to: (path || "/") as never,
      hash: hash || undefined,
    });
  }

  return (
    <a ref={ref} href={href} {...rest} onClick={handleClick}>
      {children}
    </a>
  );
});
