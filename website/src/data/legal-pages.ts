import type { Block, PageDoc } from "@/data/pages";

const UPDATED = "27 September 2026";
const home = { label: "Home", href: "/" };
const legal = { label: "Legal" };

function sections(entries: { heading: string; paragraphs: string[] }[]): Block[] {
  return entries.flatMap(({ heading, paragraphs }) => [
    { kind: "h2" as const, text: heading },
    ...paragraphs.map((text) => ({ kind: "p" as const, text })),
  ]);
}

export const legalPages: Record<string, PageDoc> = {
  "/legal/privacy-policy": {
    title: "Privacy Policy",
    description: "How Nepal Hemophilia Society handles information when you use this public website.",
    crumbs: [home, legal, { label: "Privacy Policy" }],
    photo: "table",
    photoAlt: "Members at a Nepal Hemophilia Society meeting",
    lead: "This Privacy Policy explains how Nepal Hemophilia Society (NHS) collects, uses, and protects information when you visit nepalhemophilia.org.np and related public web pages. It does not govern the NHMS patient mobile app, which has its own privacy policy.",
    blocks: [
      { kind: "note", text: `Last updated: ${UPDATED}` },
      ...sections([
        {
          heading: "1. Who we are",
          paragraphs: [
            "Nepal Hemophilia Society is a nonprofit organisation for people with hemophilia, von Willebrand disease, and related bleeding disorders in Nepal.",
            "The public website shares information about bleeding disorders, NHS activities, membership, and how to contact the office. It is not a clinical record system.",
          ],
        },
        {
          heading: "2. What this policy covers",
          paragraphs: [
            "This policy applies to visitors who browse the website, follow links to email the office, or read publications and news posted here.",
            "If you use the Nepal Hemophilia Digital Management System (NHMS) patient app, your clinical data is handled under separate app policies and by your treatment centre. This website does not display individual patient records.",
          ],
        },
        {
          heading: "3. Information we collect",
          paragraphs: [
            "Information you choose to send: when you use a contact or membership form, your device opens your email app with the text you typed (name, phone, district, message). NHS receives that information only if you send the email. We do not store those drafts on the website server.",
            "Technical information: like most websites, our hosting provider may log your IP address, browser type, pages visited, and the time of the visit so the site can load securely and we can fix errors. We do not use this log to identify you for marketing.",
            "We do not ask for your Unique Patient ID, diagnosis papers, or other clinical files through this public website.",
          ],
        },
        {
          heading: "4. Cookies and similar technologies",
          paragraphs: [
            "We use cookies and similar storage to remember your cookie choice, run the site securely, and—only if you agree—measure how pages are used.",
            "When you first visit, a banner lets you accept all cookies, reject optional cookies, or choose categories. You can change your choice at any time using Cookie settings in the footer.",
            "See our Cookie Policy for a full list of cookie names, purposes, and retention periods.",
          ],
        },
        {
          heading: "5. How we use information",
          paragraphs: [
            "To answer enquiries about membership, treatment centres, events, and advocacy.",
            "To improve the website, fix broken links, and keep content accurate for families and clinicians in Nepal.",
            "To meet legal duties if a competent authority lawfully requests information about how the site was used.",
          ],
        },
        {
          heading: "6. Who may see your information",
          paragraphs: [
            "NHS staff and volunteers who handle membership and public enquiries may read emails you send to nepalhemo@gmail.com.",
            "Our hosting and email providers process data only to operate the website and deliver mail. They are not allowed to use NHS visitor data for their own marketing.",
            "We do not sell personal information. We do not publish private emails or phone numbers on the website without consent.",
          ],
        },
        {
          heading: "7. Links to other sites",
          paragraphs: [
            "This website links to hospitals, government pages, publications, and social media. Those sites have their own privacy practices. Read their policies before you share personal information there.",
          ],
        },
        {
          heading: "8. Your choices",
          paragraphs: [
            "You choose what to write in an email. Do not send full medical files, national ID copies, or photographs of a child unless NHS staff have asked for them through a safe channel.",
            "You may ask what information NHS holds about your enquiry and request correction of contact details you previously shared.",
          ],
        },
        {
          heading: "9. How we protect information",
          paragraphs: [
            "The website is served over encrypted connections (HTTPS). Access to the NHS email account is limited to authorised staff.",
            "No online system is perfectly secure. If you need to discuss a sensitive clinical matter, call 01-5172729 and ask for a conversation through your treatment centre rather than sending details by public email.",
          ],
        },
        {
          heading: "10. Children",
          paragraphs: [
            "Parents and guardians may contact NHS on behalf of a child. Please do not post a child’s full name, school, or photograph on a public web form. The office will arrange safer ways to register or support families.",
          ],
        },
        {
          heading: "11. Changes to this policy",
          paragraphs: [
            "We may update this policy when the website or the law changes. The date at the top will change. Continued use of the site after an update means you accept the revised policy.",
          ],
        },
        {
          heading: "12. Contact",
          paragraphs: [
            "Nepal Hemophilia Society",
            "Anamnagar, Rudmatti Marg, Kathmandu, Nepal",
            "Email: nepalhemo@gmail.com",
            "Phone: 01-5172729",
            "Office hours: Sunday to Friday, 9 am to 5 pm.",
          ],
        },
      ]),
      {
        kind: "links",
        items: [
          {
            title: "Cookie Policy",
            text: "What cookies we use and how to manage them.",
            href: "/legal/cookie-policy",
          },
          {
            title: "Terms and Conditions",
            text: "Rules for using this public website.",
            href: "/legal/terms-and-conditions",
          },
        ],
      },
    ],
  },
  "/legal/cookie-policy": {
    title: "Cookie Policy",
    description: "How Nepal Hemophilia Society uses cookies on this public website and how you can control them.",
    crumbs: [home, legal, { label: "Cookie Policy" }],
    photo: "members",
    photoAlt: "Nepal Hemophilia Society members",
    lead: "This Cookie Policy explains what cookies are, which cookies Nepal Hemophilia Society (NHS) uses on this public website, and how you can accept, reject, or change your choices.",
    blocks: [
      { kind: "note", text: `Last updated: ${UPDATED}` },
      ...sections([
        {
          heading: "1. What are cookies?",
          paragraphs: [
            "Cookies are small text files stored on your phone or computer when you visit a website. They help the site remember settings, keep pages secure, and—if you allow it—understand how visitors use content.",
            "Some cookies are set by NHS. Others may be set by tools we use to host or measure the site. We describe both below.",
          ],
        },
        {
          heading: "2. How you choose",
          paragraphs: [
            "The first time you open the website, a banner asks whether to accept all cookies, reject optional cookies, or customise your choices.",
            "Reject All and Necessary only mean we store only the cookies required to remember your decision and run the site. Analytics and preference cookies are not set.",
            "Accept All turns on optional analytics and preference cookies described below.",
            "You can reopen the banner at any time from Cookie settings in the website footer.",
          ],
        },
        {
          heading: "3. Cookie categories",
          paragraphs: [
            "Necessary — always active. These cookies remember your consent choice and support basic security. They cannot be switched off through the banner because the site would not know your preference.",
            "Analytics — optional. These help NHS see which pages are read most often so we can improve information for families and clinicians. They use an anonymous session identifier. We do not use them to advertise to you on other websites.",
            "Preferences — optional. These remember optional comfort settings on your device, such as whether you prefer reduced motion for animations.",
          ],
        },
        {
          heading: "4. Cookies we use",
          paragraphs: [
            "nhs_cookie_consent (necessary) — stores your cookie choices as JSON. Duration: up to 12 months. Set by: NHS website.",
            "nhs_analytics_id (analytics, optional) — anonymous random ID used to group page views in the same visit session. Duration: up to 12 months while analytics consent remains on. Removed when you reject analytics or choose necessary only.",
            "nhs_site_prefs (preferences, optional) — stores optional site comfort settings you allow. Duration: up to 12 months while preferences consent remains on. Removed when you turn preferences off.",
            "Hosting logs — our hosting provider may process technical data such as IP address and browser type to deliver pages securely. That processing is described in our Privacy Policy and is separate from the optional analytics cookie above.",
          ],
        },
        {
          heading: "5. Browser controls",
          paragraphs: [
            "You can also block or delete cookies through your browser settings. If you delete nhs_cookie_consent, the banner will appear again on your next visit.",
            "Blocking all cookies may stop the site from remembering that you already answered the banner, so the prompt may return each time you load a page.",
          ],
        },
        {
          heading: "6. Changes",
          paragraphs: [
            "If we add new cookies or change how they work, we will update this policy and the date at the top. Material changes may also show in the cookie banner again.",
          ],
        },
        {
          heading: "7. Contact",
          paragraphs: [
            "Nepal Hemophilia Society",
            "Anamnagar, Rudmatti Marg, Kathmandu, Nepal",
            "Email: nepalhemo@gmail.com",
            "Phone: 01-5172729",
          ],
        },
      ]),
      {
        kind: "links",
        items: [
          {
            title: "Privacy Policy",
            text: "How we handle personal information on this website.",
            href: "/legal/privacy-policy",
          },
          {
            title: "Terms and Conditions",
            text: "Rules for using this public website.",
            href: "/legal/terms-and-conditions",
          },
        ],
      },
    ],
  },
  "/legal/terms-and-conditions": {
    title: "Terms and Conditions",
    description: "Rules for using the Nepal Hemophilia Society public website.",
    crumbs: [home, legal, { label: "Terms and Conditions" }],
    photo: "group",
    photoAlt: "Nepal Hemophilia Society community gathering",
    lead: "These Terms and Conditions govern your use of the Nepal Hemophilia Society public website. By browsing or using this site, you agree to these terms and to our Privacy Policy.",
    blocks: [
      { kind: "note", text: `Last updated: ${UPDATED}` },
      ...sections([
        {
          heading: "1. About this website",
          paragraphs: [
            "This website is operated by Nepal Hemophilia Society (NHS) to share information about bleeding disorders, NHS programmes, news, and ways to get involved in Nepal.",
            "The site is for general information and community support. It is not the NHMS patient app and does not replace care from a qualified clinician or emergency services.",
          ],
        },
        {
          heading: "2. Not medical advice",
          paragraphs: [
            "Articles, FAQs, and publications on this site are educational. They are not a diagnosis, prescription, or treatment plan for you or your child.",
            "A serious bleed, head injury, or bleeding after an accident needs urgent hospital care. Contact your treatment centre or local emergency services immediately. Do not delay care because you read something here.",
            "Before you change any treatment, ask the clinician who knows your factor level and inhibitor status.",
          ],
        },
        {
          heading: "3. Using the site",
          paragraphs: [
            "You may read, print, and share links to pages for personal, non-commercial use if you credit NHS and do not misrepresent the content.",
            "Do not attempt to break into the site, scrape it in a way that harms performance, upload malware, or use NHS branding to imply endorsement of a product or clinic we have not approved.",
            "Do not use contact forms or email to harass staff, advertise unrelated services, or send unlawful content.",
          ],
        },
        {
          heading: "4. Membership and enquiries",
          paragraphs: [
            "Membership requests and messages sent through the website are handled by NHS staff. Submitting a form does not by itself make you a member until NHS confirms registration according to its membership rules.",
            "Information you provide must be accurate to the best of your knowledge. NHS may decline or remove membership where rules are breached.",
          ],
        },
        {
          heading: "5. Intellectual property",
          paragraphs: [
            "The NHS name, logo, website text prepared by NHS, and photographs credited to NHS are protected. You may not copy large sections for another organisation’s site or printed material without written permission, except for fair personal sharing as described above.",
            "Some images or PDFs may belong to third parties and are used with permission. Respect their copyright notices.",
          ],
        },
        {
          heading: "6. External links",
          paragraphs: [
            "Links to hospitals, government sites, news, or partner organisations are provided for convenience. NHS does not control those sites and is not responsible for their content, availability, or privacy practices.",
          ],
        },
        {
          heading: "7. Limitation of liability",
          paragraphs: [
            "NHS works to keep information current and the site available, but pages may contain errors or be temporarily offline during maintenance or network problems.",
            "To the fullest extent permitted by applicable law, NHS is not liable for loss arising from reliance on website content alone, from third-party links, or from events outside our reasonable control. Nothing here limits liability where the law does not allow that limit.",
          ],
        },
        {
          heading: "8. Privacy",
          paragraphs: [
            "Your use of the site is also governed by our Privacy Policy, which explains how we handle information you send to the office and technical logs from hosting.",
          ],
        },
        {
          heading: "9. Changes to these terms",
          paragraphs: [
            "We may update these terms when the website or legal requirements change. The date at the top will change. If you do not agree with an update, stop using the site. Continued use after an update means you accept the revised terms.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "Nepal Hemophilia Society",
            "Anamnagar, Rudmatti Marg, Kathmandu, Nepal",
            "Email: nepalhemo@gmail.com",
            "Phone: 01-5172729",
          ],
        },
      ]),
      {
        kind: "links",
        items: [
          {
            title: "Privacy Policy",
            text: "How we handle information when you use this website.",
            href: "/legal/privacy-policy",
          },
          {
            title: "Cookie Policy",
            text: "What cookies we use and how to manage them.",
            href: "/legal/cookie-policy",
          },
        ],
      },
    ],
  },
};

export function getLegalPage(path: string) {
  const page = legalPages[path];
  if (!page) throw new Error(`Missing legal page: ${path}`);
  return page;
}
