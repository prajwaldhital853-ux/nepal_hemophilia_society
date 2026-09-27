import { useState, type ReactNode } from "react";
import { ChevronDown, Facebook, Instagram, Linkedin, Mail, Menu, Phone, X, Youtube } from "lucide-react";

import { Button } from "@/components/ui/button";
import nhsLogo from "@/assets/nhs-logo.png";
import { CookieConsentProvider } from "@/components/site/CookieConsent";
import { CookieSettingsButton } from "@/components/site/CookieSettingsButton";
import { MobileNavDrawer } from "@/components/site/MobileNavDrawer";
import { navItems } from "@/components/site/nav";
import { SiteLink } from "@/components/site/SiteLink";

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <SiteLink href="/" className={`site-brand ${inverse ? "site-brand-inverse" : ""}`} aria-label="Nepal Hemophilia Society home">
      <img src={nhsLogo} alt="" className="site-logo" width={120} height={150} />
      <span>Nepal Hemophilia Society</span>
    </SiteLink>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <CookieConsentProvider>
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header">
        <div className="h-12 bg-primary text-primary-foreground">
          <div className="site-container flex h-full items-center justify-end gap-3 text-sm font-bold">
            <span>Find us on:</span>
            <a href="https://www.facebook.com" aria-label="Facebook"><Facebook className="size-5" /></a>
            <a href="https://www.youtube.com" aria-label="YouTube"><Youtube className="size-5" /></a>
            <a href="https://www.linkedin.com" aria-label="LinkedIn"><Linkedin className="size-5" /></a>
            <a href="https://www.instagram.com" aria-label="Instagram"><Instagram className="size-5" /></a>
          </div>
        </div>
        <div className="site-container flex items-center justify-between gap-4 py-2 lg:py-2.5">
          <Brand />
          <div className="hidden flex-col items-end gap-2 lg:flex">
            <div className="flex items-center gap-8 text-sm font-extrabold text-primary">
              <a href="mailto:nepalhemo@gmail.com" className="flex items-center gap-2"><Mail className="size-5 text-foreground" />nepalhemo@gmail.com</a>
              <a href="tel:+97715172729" className="flex items-center gap-2"><Phone className="size-5 text-foreground" />01-5172729</a>
              <span className="text-xs text-foreground">Sun–Fri, 9am–5pm</span>
            </div>
            <div className="flex gap-2">
              <Button variant="brand" asChild><SiteLink href="/get-involved/join">Become a Member</SiteLink></Button>
              <Button variant="brand" asChild><SiteLink href="/about">Our work</SiteLink></Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="site-nav border-t border-border" aria-label="Main navigation">
        <div className="site-container flex items-center justify-between py-2 lg:hidden">
          <span className="text-sm font-extrabold text-primary">Menu</span>
          <Button variant="brand" size="icon" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        <div className="site-container hidden lg:flex lg:flex-row lg:items-center lg:justify-between lg:py-4">
          {navItems.map((item) => (
            <div key={item.label} className="nav-item relative">
              <SiteLink href={item.href} className="flex items-center gap-1 py-2 text-sm font-extrabold hover:text-primary">
                {item.label}
                {item.children ? <ChevronDown className="size-3 text-primary" /> : null}
              </SiteLink>
              {item.children ? (
                <div className="nav-drop">
                  {item.children.map((child) => (
                    <SiteLink key={child.href} href={child.href} className="nav-drop-link">
                      {child.label}
                    </SiteLink>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      {children}

      <footer className="site-footer bg-primary text-primary-foreground">
        <div className="site-container py-14">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-center">
            <Brand inverse />
            <div>
              <p className="text-3xl font-black">Together For Life</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="footer" asChild><SiteLink href="/get-involved/join">Become a Member</SiteLink></Button>
              </div>
            </div>
          </div>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-black">Our work</h3>
              <ul className="footer-list">
                <li><SiteLink href="/about">About us</SiteLink></li>
                <li><SiteLink href="/bleeding-disorders/haemophilia">Bleeding disorders</SiteLink></li>
                <li><SiteLink href="/bleeding-disorders/treatment-centres">Treatment centres</SiteLink></li>
                <li><SiteLink href="/support/our-community">Our community</SiteLink></li>
                <li><SiteLink href="/get-involved/fundraising">Fundraising</SiteLink></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black">Quick links</h3>
              <ul className="footer-list">
                <li><SiteLink href="/support/newly-diagnosed">Newly diagnosed</SiteLink></li>
                <li><SiteLink href="/support/day-day-living">Day-to-day living</SiteLink></li>
                <li><SiteLink href="/resources/publications">Publications</SiteLink></li>
                <li><SiteLink href="/news">Latest news</SiteLink></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black">Contact</h3>
              <p className="mt-4 text-sm leading-relaxed">Nepal Hemophilia Society<br />Anamnagar, Rudmatti Marg<br />Kathmandu, Nepal</p>
              <a className="mt-4 flex items-center gap-2 text-sm" href="mailto:nepalhemo@gmail.com"><Mail className="size-4" />nepalhemo@gmail.com</a>
              <a className="mt-2 flex items-center gap-2 text-sm" href="tel:+97715172729"><Phone className="size-4" />01-5172729</a>
            </div>
            <div>
              <h3 className="font-black">Latest news</h3>
              <ul className="footer-news">
                <li><SiteLink href="/news"><small>11 MAR 24</small> Provinces asked to invest in diagnosis and treatment</SiteLink></li>
                <li><SiteLink href="/events/categories"><small>17 APR</small> World Hemophilia Day</SiteLink></li>
                <li><SiteLink href="/public-inquiry/inquiry-news"><small>Safety</small> Safer treatment products in Nepal</SiteLink></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-primary-foreground/30 pt-5 text-center text-xs">
            <p>
              © 2026 Nepal Hemophilia Society. A nonprofit organization serving Nepal’s bleeding disorder community.
            </p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <SiteLink href="/legal/privacy-policy" className="hover:underline">Privacy Policy</SiteLink>
              <span aria-hidden="true">·</span>
              <SiteLink href="/legal/terms-and-conditions" className="hover:underline">Terms and Conditions</SiteLink>
              <span aria-hidden="true">·</span>
              <SiteLink href="/legal/cookie-policy" className="hover:underline">Cookie Policy</SiteLink>
              <span aria-hidden="true">·</span>
              <CookieSettingsButton />
            </p>
          </div>
        </div>
      </footer>
    </div>
    </CookieConsentProvider>
  );
}
