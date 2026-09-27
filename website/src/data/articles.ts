import type { PageDoc } from "@/data/pages";
import { ARTICLE_CONTENT, contentToBlocks } from "@/data/article-content";
import { ARTICLE_CONTENT_REMAINING } from "@/data/article-content-remaining";

export type ArticleDoc = PageDoc & { slug: string };

const home = { label: "Home", href: "/" };
const readCrumb = { label: "Read more" };
const disclaimer =
  "This page is general information from Nepal Hemophilia Society. It is not a diagnosis or a treatment plan. A bleed, a head injury, or bleeding after an accident needs urgent hospital care. Ask your treatment centre before you change any treatment.";

const ALL_ARTICLE_CONTENT = { ...ARTICLE_CONTENT, ...ARTICLE_CONTENT_REMAINING };

function detailedArticle(slug: string): ArticleDoc {
  const content = ALL_ARTICLE_CONTENT[slug];
  if (!content) throw new Error(`Missing article content: ${slug}`);
  return {
    slug,
    title: content.title,
    description: content.lead,
    crumbs: [home, readCrumb, { label: content.title }],
    photo: content.photo,
    photoAlt: content.photoAlt,
    lead: content.lead,
    blocks: contentToBlocks(content, disclaimer),
  };
}

export const articles: Record<string, ArticleDoc> = Object.fromEntries(
  Object.keys(ALL_ARTICLE_CONTENT).map((slug) => [slug, detailedArticle(slug)]),
);

const externalLinks: Record<string, string> = {
  "pub-wfh-guidelines": "https://wfh.org",
  "video-wfh-youtube": "https://www.youtube.com/user/WFHemophilia",
  "video-wfh-whd": "https://wfh.org/world-hemophilia-day/",
  "guide-wfh-treatment": "https://wfh.org",
  "ext-wfh": "https://wfh.org",
  "ext-wfh-aid": "https://wfh.org/humanitarian-aid/",
  "ext-nfdn": "https://www.nfdn.org.np",
  "ext-mohp": "https://mohp.gov.np",
  "ext-who-blood": "https://www.who.int/health-topics/blood-products",
  "ext-cdc-hemophilia": "https://www.cdc.gov/hemophilia/about/index.html",
  "ext-uk-inquiry": "https://www.infectedbloodinquiry.org.uk/",
};

const mailtoLinks: Record<string, string> = {
  "fundraising-email-office": "mailto:nepalhemo@gmail.com?subject=Fundraising%20enquiry",
  "events-offer-venue": "mailto:nepalhemo@gmail.com?subject=Event%20enquiry",
  "appg-write-to-nhs": "mailto:nepalhemo@gmail.com?subject=Advocacy",
};

function appendLinks(slug: string, items: { title: string; text: string; href: string }[]) {
  const doc = articles[slug];
  if (!doc) return;
  doc.blocks = [
    ...doc.blocks.filter((block) => block.kind !== "note"),
    { kind: "links", items },
    { kind: "note", text: disclaimer },
  ];
}

for (const [slug, url] of Object.entries(externalLinks)) {
  appendLinks(slug, [{ title: "Visit official site", text: "Open the original page published by the organisation.", href: url }]);
}

for (const [slug, url] of Object.entries(mailtoLinks)) {
  appendLinks(slug, [{ title: "Email the office", text: "Open your email app with a message addressed to nepalhemo@gmail.com.", href: url }]);
}

const relatedPages: Record<string, { title: string; href: string }> = {
  "video-read-haemophilia-nepal": { title: "Haemophilia overview", href: "/bleeding-disorders/haemophilia" },
  "ext-support-worried": { title: "Full support page", href: "/public-inquiry/support" },
  "guide-external-resources": { title: "All external resources", href: "/resources/external-resources" },
  "events-read-advocacy-news": { title: "Latest news", href: "/news" },
  "news-all-events": { title: "All events", href: "/events/categories" },
};

for (const [slug, link] of Object.entries(relatedPages)) {
  const doc = articles[slug];
  if (doc && !doc.blocks.some((block) => block.kind === "links")) {
    appendLinks(slug, [{ title: link.title, text: "Continue to the full section on this website.", href: link.href }]);
  }
}

if (articles["uk-report"]) {
  appendLinks("uk-report", [
    { title: "Official inquiry site", text: "Read the full UK Infected Blood Inquiry report and evidence.", href: "https://www.infectedbloodinquiry.org.uk/" },
  ]);
}

export function articleHref(slug: string) {
  return `/read/${slug}`;
}

export function getArticle(slug: string): ArticleDoc {
  const doc = articles[slug];
  if (!doc) throw new Error(`Missing article: ${slug}`);
  return doc;
}

export function tryGetArticle(slug: string): ArticleDoc | null {
  return articles[slug] ?? null;
}
