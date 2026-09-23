import type { Locale, MessageTree } from "@/core/i18n/types";

export function flattenMessages(tree: MessageTree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flattenMessages(value, path));
  }
  return out;
}

export function buildPhraseLookup(enFlat: Record<string, string>, neFlat: Record<string, string>) {
  const exact: Record<string, string> = {};
  const lower: Record<string, string> = {};
  for (const key of Object.keys(enFlat)) {
    const enVal = enFlat[key];
    const neVal = neFlat[key];
    if (!enVal || !neVal) continue;
    exact[enVal] = neVal;
    lower[enVal.toLowerCase()] = neVal;
  }
  return { exact, lower };
}

export const dynamicPhraseMap: Record<string, string> = {
  Active: "सक्रिय",
  Completed: "सम्पन्न",
  Scheduled: "तालिकाबद्ध",
  Pending: "पर्खाइमा",
  Cancelled: "रद्द",
  Home: "गृह",
  Services: "सेवाहरू",
  Profile: "प्रोफाइल",
  Notifications: "सूचनाहरू",
  Factor: "फ्याक्टर",
  Prophylaxis: "रोकथाम",
  "On-demand": "आवश्यकताअनुसार",
  Emergency: "आपतकालीन",
};

export function localizeText(
  text: string,
  locale: Locale,
  lookup: { exact: Record<string, string>; lower: Record<string, string> },
): string {
  if (!text || locale === "en") return text;
  const trimmed = text.trim();
  if (dynamicPhraseMap[trimmed]) return dynamicPhraseMap[trimmed];
  if (lookup.exact[trimmed]) return lookup.exact[trimmed];
  if (lookup.lower[trimmed.toLowerCase()]) return lookup.lower[trimmed.toLowerCase()];
  return text;
}

export function getByPath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let cur: string | MessageTree | undefined = tree;
  for (const part of parts) {
    if (!cur || typeof cur === "string") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}
