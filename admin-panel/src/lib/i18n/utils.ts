import type { Locale, MessageTree } from "@/lib/i18n/types";

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

/** Extra API / backend labels (underscore forms, movement types, etc.) */
export const dynamicPhraseMap: Record<string, string> = {
  stock_in: "स्टक इन",
  stock_out: "स्टक आउट",
  "stock in": "स्टक इन",
  "stock out": "स्टक आउट",
  injection: "बिरामीलाई दिइएको",
  adjustment: "समायोजन",
  reversal: "फिर्ता",
  other: "अन्य",
  Prophylaxis: "रोकथाम",
  "On-demand": "आवश्यकताअनुसार",
  Emergency: "आपतकालीन",
  ITI: "आईटीआई",
  Surgery: "शल्यक्रिया",
  Trauma: "चोट",
  Other: "अन्य",
  Active: "सक्रिय",
  Pending: "पर्खाइमा",
  Inactive: "निष्क्रिय",
  Rejected: "अस्वीकृत",
  Completed: "सम्पन्न",
  Scheduled: "तालिकाबद्ध",
  Cancelled: "रद्द",
  "Super Admin": "मुख्य प्रशासक",
  Admin: "प्रशासक",
  "Province Admin": "प्रदेश प्रशासक",
  "Center Admin": "केन्द्र प्रशासक",
  "Treatment Admin": "उपचार प्रशासक",
  "Website Manager": "वेबसाइट व्यवस्थापक",
  "Hospital Administrator": "अस्पताल प्रशासक",
  "Super Administrator": "मुख्य प्रशासक",
  Administrator: "प्रशासक",
  "Province Administrator": "प्रदेश प्रशासक",
  "Center Administrator": "केन्द्र प्रशासक",
  "Treatment Administrator": "उपचार प्रशासक",
  "Patients Management": "बिरामी व्यवस्थापन",
  "Admin Management": "प्रशासक व्यवस्थापन",
  "Hospital Administration": "अस्पताल व्यवस्थापन",
  "Stock Management": "स्टक व्यवस्थापन",
  "Treatment & Injection": "उपचार र इन्जेक्सन",
  "Users Management": "प्रयोगकर्ता व्यवस्थापन",
  "Reports & Analytics": "प्रतिवेदन र विश्लेषण",
  "Audit Logs": "अनुमान लग प्रवेश",
  "System Settings": "प्रणाली सेटिङ",
  "App Services": "एप सेवाहरू",
  "News & Notices": "समाचार र सूचना",
  "Health insight tips": "स्वास्थ्य सुझावहरू",
  Dashboard: "ड्यासबोर्ड",
  Appointments: "भेटघाट",
  Export: "निर्यात",
  Search: "खोज्नुहोस्",
  Loading: "लोड हुँदैछ…",
  "Load more": "थप लोड गर्नुहोस्",
  "All Provinces": "सबै प्रदेश",
  "All types": "सबै प्रकार",
  "All status": "सबै अवस्था",
  "All centers": "सबै केन्द्र",
  "All time": "सबै समय",
  "No data yet.": "अहिलेसम्म कुनै डाटा छैन।",
  National: "राष्ट्रिय",
  "View only": "हेर्ने मात्र",
  Full: "पूर्ण",
  Unspecified: "नखुलाइएको",
  Mild: "हल्का",
  Moderate: "मध्यम",
  Severe: "गम्भीर",
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
  const underscored = trimmed.replaceAll("_", " ");
  if (dynamicPhraseMap[underscored]) return dynamicPhraseMap[underscored];
  if (lookup.exact[underscored]) return lookup.exact[underscored];
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
