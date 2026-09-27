import { useCookieConsent } from "@/components/site/CookieConsent";

export function CookieSettingsButton() {
  const { openPreferences } = useCookieConsent();

  return (
    <button type="button" className="hover:underline" onClick={openPreferences}>
      Cookie settings
    </button>
  );
}
