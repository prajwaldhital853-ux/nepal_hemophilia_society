import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { SiteLink } from "@/components/site/SiteLink";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  acceptAllCookies,
  applyConsent,
  readConsent,
  rejectOptionalCookies,
  saveConsent,
  subscribeConsent,
  trackPageView,
  type CookieConsentState,
  type CookieDraft,
} from "@/lib/cookie-consent";

type CookieConsentContextValue = {
  consent: CookieConsentState | null;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}

const defaultDraft: CookieDraft = { analytics: false, preferences: false };

function CookieCategoryRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <p className="font-extrabold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

function CookieConsentBanner({
  customising,
  draft,
  onDraftChange,
  onAcceptAll,
  onRejectAll,
  onOpenCustomise,
  onSavePreferences,
  onAcceptNecessaryOnly,
}: {
  customising: boolean;
  draft: CookieDraft;
  onDraftChange: (draft: CookieDraft) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onOpenCustomise: () => void;
  onSavePreferences: () => void;
  onAcceptNecessaryOnly: () => void;
}) {
  return (
    <div
      className="cookie-consent-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <h2 id="cookie-consent-title" className="text-xl font-black text-foreground">
        We value your privacy
      </h2>

      {!customising ? (
        <>
          <div id="cookie-consent-description" className="cookie-consent-copy mt-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              We use cookies to enhance your browsing experience and analyse our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.{" "}
              <SiteLink href="/legal/cookie-policy" className="font-extrabold text-primary underline underline-offset-2">
                Cookie Policy
              </SiteLink>
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="outline" className="cookie-consent-btn-outline flex-1" onClick={onOpenCustomise}>
              Customise
            </Button>
            <Button type="button" variant="outline" className="cookie-consent-btn-outline flex-1" onClick={onRejectAll}>
              Reject All
            </Button>
            <Button type="button" variant="brand" className="flex-1" onClick={onAcceptAll}>
              Accept All
            </Button>
          </div>
        </>
      ) : (
        <>
          <p id="cookie-consent-description" className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Choose which cookies you allow. Necessary cookies are always on because the site needs them to remember your choice and stay secure.
          </p>
          <div className="cookie-consent-copy mt-2">
            <CookieCategoryRow
              title="Necessary"
              description="Stores your cookie choice and keeps basic site functions working. These cannot be turned off."
              checked
              disabled
            />
            <CookieCategoryRow
              title="Analytics"
              description="Helps us understand which pages are useful so we can improve information for families in Nepal. No advertising profiles are built."
              checked={draft.analytics}
              onCheckedChange={(analytics) => onDraftChange({ ...draft, analytics })}
            />
            <CookieCategoryRow
              title="Preferences"
              description="Remembers optional settings such as reduced motion for animations on this device."
              checked={draft.preferences}
              onCheckedChange={(preferences) => onDraftChange({ ...draft, preferences })}
            />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="outline" className="cookie-consent-btn-outline flex-1" onClick={onAcceptNecessaryOnly}>
              Necessary only
            </Button>
            <Button type="button" variant="brand" className="flex-1" onClick={onSavePreferences}>
              Save preferences
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [draft, setDraft] = useState<CookieDraft>(defaultDraft);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      applyConsent(stored);
      setConsent(stored);
      setDraft({ analytics: stored.analytics, preferences: stored.preferences });
    } else {
      setVisible(true);
    }
    setReady(true);
    return subscribeConsent((next) => {
      setConsent(next);
      setDraft({ analytics: next.analytics, preferences: next.preferences });
      setVisible(false);
      setCustomising(false);
    });
  }, []);

  useEffect(() => {
    if (!ready || !consent?.analytics) return;
    trackPageView(pathname);
  }, [ready, consent?.analytics, pathname]);

  const finish = useCallback((next: CookieConsentState) => {
    setConsent(next);
    setVisible(false);
    setCustomising(false);
  }, []);

  const openPreferences = useCallback(() => {
    const stored = readConsent();
    setDraft({
      analytics: stored?.analytics ?? false,
      preferences: stored?.preferences ?? false,
    });
    setCustomising(true);
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ consent, openPreferences }), [consent, openPreferences]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {ready && visible ? (
        <div className="cookie-consent-backdrop" aria-hidden={false}>
          <CookieConsentBanner
            customising={customising}
            draft={draft}
            onDraftChange={setDraft}
            onAcceptAll={() => finish(acceptAllCookies())}
            onRejectAll={() => finish(rejectOptionalCookies())}
            onOpenCustomise={() => setCustomising(true)}
            onSavePreferences={() => finish(saveConsent(draft))}
            onAcceptNecessaryOnly={() => finish(rejectOptionalCookies())}
          />
        </div>
      ) : null}
    </CookieConsentContext.Provider>
  );
}
