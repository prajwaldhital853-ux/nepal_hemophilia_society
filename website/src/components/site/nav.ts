export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  { label: "About Us", href: "/about" },
  {
    label: "Bleeding Disorders",
    href: "/bleeding-disorders/haemophilia",
    children: [
      { label: "Haemophilia", href: "/bleeding-disorders/haemophilia" },
      { label: "Treatment types", href: "/bleeding-disorders/treatment-types" },
      { label: "Inhibitors", href: "/bleeding-disorders/inhibitors" },
      { label: "Women with bleeding disorders", href: "/bleeding-disorders/women-with-bleeding-disorders" },
      { label: "Treatment centres", href: "/bleeding-disorders/treatment-centres" },
      { label: "FAQs", href: "/bleeding-disorders/faqs" },
    ],
  },
  {
    label: "Support",
    href: "/support/newly-diagnosed",
    children: [
      { label: "Newly diagnosed", href: "/support/newly-diagnosed" },
      { label: "Day-to-day living", href: "/support/day-day-living" },
      { label: "Our community", href: "/support/our-community" },
    ],
  },
  {
    label: "Get Involved",
    href: "/get-involved/join",
    children: [
      { label: "Join", href: "/get-involved/join" },
      { label: "Fundraising", href: "/get-involved/fundraising" },
    ],
  },
  { label: "Events", href: "/events/categories" },
  {
    label: "Resources",
    href: "/resources/publications",
    children: [
      { label: "Publications", href: "/resources/publications" },
      { label: "Videos", href: "/resources/videos" },
      { label: "Guidelines", href: "/resources/guidelines" },
      { label: "External resources", href: "/resources/external-resources" },
    ],
  },
  { label: "Latest News", href: "/news" },
  {
    label: "Public Inquiry",
    href: "/public-inquiry/the-infected-blood-inquiry",
    children: [
      { label: "The infected blood inquiry", href: "/public-inquiry/the-infected-blood-inquiry" },
      { label: "Inquiry news", href: "/public-inquiry/inquiry-news" },
      { label: "Advocacy with government", href: "/public-inquiry/the-infected-blood-inquiry/appg" },
      { label: "Support", href: "/public-inquiry/support" },
    ],
  },
];
