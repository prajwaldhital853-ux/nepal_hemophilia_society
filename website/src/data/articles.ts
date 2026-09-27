import type { Block, PageDoc, Photo } from "@/data/pages";

export type ArticleDoc = PageDoc & { slug: string };

const home = { label: "Home", href: "/" };
const readCrumb = { label: "Read more" };
const disclaimer =
  "This page is general information from Nepal Hemophilia Society. It is not a diagnosis or a treatment plan. A bleed, a head injury, or bleeding after an accident needs urgent hospital care. Ask your treatment centre before you change any treatment.";

function article(
  slug: string,
  doc: Omit<PageDoc, "blocks"> & { blocks?: Block[]; paragraphs?: string[]; list?: string[] },
): ArticleDoc {
  const blocks: Block[] = doc.blocks ?? [
    ...(doc.paragraphs ?? []).map((text) => ({ kind: "p" as const, text })),
    ...(doc.list ? [{ kind: "ul" as const, items: doc.list }] : []),
    { kind: "note", text: disclaimer },
  ];
  return {
    slug,
    title: doc.title,
    description: doc.description,
    crumbs: [home, readCrumb, { label: doc.title }],
    photo: doc.photo,
    photoAlt: doc.photoAlt,
    lead: doc.lead,
    blocks,
  };
}

function cardArticle(
  slug: string,
  title: string,
  lead: string,
  paragraphs: string[],
  photo: Photo,
  photoAlt: string,
  list?: string[],
) {
  return article(slug, {
    title,
    description: lead,
    lead,
    photo,
    photoAlt,
    paragraphs,
    list,
  });
}

export const articles: Record<string, ArticleDoc> = {
  "help-newly-diagnosed-child": cardArticle(
    "help-newly-diagnosed-child",
    "My child is newly diagnosed",
    "Finding out that your child has a bleeding disorder is a shock. These are the first steps families in Nepal take after the test result.",
    [
      "Write down the exact name on the report — haemophilia A, haemophilia B, severity, or another disorder. Photograph the paper for your records, but do not post it on social media.",
      "Call Nepal Hemophilia Society on 01-5172729 or email nepalhemo@gmail.com. The office can explain registration, chapters, and which hospital runs a factor assay near you.",
      "Ask the treatment centre what to do for a swollen joint, a head bump, or bleeding after a tooth. Do not wait for the first emergency to learn the number.",
      "Tell one person at school or daycare what a bleed looks like and who to call. NHS can suggest plain language for teachers.",
    ],
    "hands",
    "Parent and child receiving support from Nepal Hemophilia Society",
    [
      "Keep the lab report and clinic letters in one folder",
      "Register with NHS so you are on the national community list",
      "Plan travel to the nearest centre before a bleed happens",
    ],
  ),
  "help-someone-i-know": cardArticle(
    "help-someone-i-know",
    "Someone I know has a bleeding disorder",
    "You do not need to be a clinician to offer useful support. Start with listening and practical help.",
    [
      "Haemophilia and related disorders mean blood takes longer to clot. Most serious bleeding is inside joints and muscles, not always visible from the outside.",
      "Do not suggest aspirin, ibuprofen, or herbal products without the person’s treatment centre approving them. Some common painkillers make bleeding worse.",
      "If they mention a warm swollen joint, a head injury, or bleeding that will not stop, encourage them to follow their centre’s plan or go to emergency care.",
      "Nepal Hemophilia Society welcomes relatives, friends, and colleagues who want to learn. You can read more on the haemophilia page or call the office with questions.",
    ],
    "genetics",
    "Family learning about inherited bleeding disorders",
  ),
  "help-day-to-day-support": cardArticle(
    "help-day-to-day-support",
    "I need help and support",
    "Living with a bleeding disorder in Nepal means planning — for school, work, travel, and ordinary life.",
    [
      "Day-to-day living is not about stopping activity. It is about knowing when to treat, when to rest a joint, and when to call the centre.",
      "Dental work, surgery, and childbirth need a written plan in advance. The centre coordinates factor or other products if they are available that month.",
      "Physiotherapy after a joint bleed protects long-term movement. Ask whether your centre or NHS knows a therapist familiar with haemophilia.",
      "You are not alone. Chapters and member meetings exist so families in different provinces can share experience.",
    ],
    "bandage",
    "Practical first-aid support for bleeding disorders",
  ),
  "provinces-2024": cardArticle(
    "provinces-2024",
    "Provinces asked to invest in diagnosis and treatment",
    "On 11 March 2024 Nepal Hemophilia Society asked provincial governments to fund care closer to where families live.",
    [
      "The meeting in Kathmandu brought together provincial representatives, clinicians, and member families. The Society showed what comprehensive care requires: factor assays, virus-inactivated products where possible, physiotherapy, and clinics that continue after a one-day camp.",
      "Provincial budgets matter because many families still travel long distances for a clotting test or a single infusion. NHS argues that diagnosis and safe treatment should not depend on which district you were born in.",
      "The ask does not end with one meeting. Members continue to share district stories with the national office so advocacy stays grounded in real delays and costs.",
    ],
    "president",
    "Nepal Hemophilia Society president at an advocacy meeting",
  ),
  "community-kathmandu": cardArticle(
    "community-kathmandu",
    "Members gather in Kathmandu",
    "Families from beyond the valley met in Kathmandu to share knowledge and connection.",
    [
      "For many parents it was the first time they heard another family describe a swollen knee in the same words. That recognition is part of why NHS exists.",
      "Clinicians and volunteers answered questions about registration, travel to centres, and what to expect after diagnosis.",
      "If you attended and have not finished registration details, call the Anamnagar office. If you could not travel, ask about chapter contacts in your province.",
    ],
    "table",
    "Members seated around a meeting table in Kathmandu",
  ),
  whd: cardArticle(
    "whd",
    "World Hemophilia Day in Nepal",
    "Each 17 April NHS marks World Hemophilia Day with the global community and a local demand for diagnosis.",
    [
      "World Hemophilia Day is 17 April, the birthday of Frank Schnabel, founder of the World Federation of Hemophilia. In Nepal the day is marked with families, red colour, and public awareness.",
      "Schools, hospitals, and chapters can host programmes. Write to nepalhemo@gmail.com if you want a speaker or fact sheet from NHS.",
      "The international campaign changes each year. The local message stays the same: people in Nepal should not wait years for a name for their bleeding.",
    ],
    "rally",
    "World Hemophilia Day rally in Nepal",
  ),
  "world-hemophilia-day": cardArticle(
    "world-hemophilia-day",
    "World Hemophilia Day",
    "Stand with Nepal’s bleeding disorder community on 17 April.",
    [
      "World Hemophilia Day unites patient organisations worldwide. NHS is a national member of the World Federation of Hemophilia and marks the day across provinces.",
      "Activities range from hospital talks to school assemblies and media interviews. The goal is awareness that leads to testing and referral, not fear.",
      "If you are planning an event, contact the office early so NHS can coordinate speakers or materials where possible.",
    ],
    "eventWhd",
    "World Hemophilia Day event poster scene",
  ),
  "advocacy-meeting": cardArticle(
    "advocacy-meeting",
    "Provincial advocacy meeting",
    "Families, clinicians and volunteers met provincial leaders to ask for sustained investment in care.",
    [
      "On 11 March 2024 NHS met provincial government representatives in Kathmandu. The meeting asked for budgets that cover diagnosis, care, and safe treatment — not only a single awareness camp.",
      "Members explained travel costs, lost wages, and the difference between cryoprecipitate and virus-inactivated concentrate when a centre has both.",
      "Advocacy continues between meetings through letters, registration data, and stories from districts.",
    ],
    "eventAdvocacy",
    "Advocacy meeting with stakeholders",
  ),
  "health-camps": cardArticle(
    "health-camps",
    "Community health camp",
    "Hands-on support for children and families away from a crowded outpatient corridor.",
    [
      "Camps can offer physiotherapy advice, dental planning conversations, and time for questions parents rarely ask in a five-minute clinic slot.",
      "A camp is not an emergency service and does not replace a factor assay or infusion at a treatment centre.",
      "To request a camp in your district, email the office with a venue, a local hospital contact, and how many families you already know.",
    ],
    "eventCamp",
    "Community health camp for children with hemophilia",
  ),
  "story-family-journey": cardArticle(
    "story-family-journey",
    "A family’s journey",
    "Finding support changed how one family faced diagnosis and daily life.",
    [
      "Many families describe the months after diagnosis as isolated until they meet another parent at an NHS meeting or chapter event.",
      "Registration connects you to information, advocacy, and sometimes travel support when a national programme allows it.",
      "The journey is not linear. Setbacks happen. The Society exists so you do not navigate them without a phone number and a community.",
    ],
    "hands",
    "Family supported by the hemophilia community",
  ),
  "story-living-confidence": cardArticle(
    "story-living-confidence",
    "Living life with confidence",
    "With care, knowledge and connection, a bleeding disorder does not define the future.",
    [
      "Children and adults across Nepal study, work, and play with plans agreed at their treatment centre. Restrictions are specific, not total.",
      "Confidence grows when the family knows the emergency steps and when the centre returns calls.",
      "Sharing stories at events helps the next family feel that life can widen again after diagnosis.",
    ],
    "newsKathmandu",
    "Members gathering in Kathmandu",
  ),
  "story-stronger-together": cardArticle(
    "story-stronger-together",
    "Stronger together",
    "Families across Nepal share experience and open doors for the next generation.",
    [
      "Chapters and member meetings turn private worry into collective voice. That voice is what provincial and national advocacy needs.",
      "Clinicians and parents learn from each other when they sit in the same room — about bleeds, supply gaps, and what actually helps at school.",
      "Membership is how the Society counts who it represents. Joining strengthens every ask to government.",
    ],
    "newsMembers",
    "Nepal Hemophilia Society members together",
  ),
  "join-become-member": cardArticle(
    "join-become-member",
    "Become a Member",
    "Join Nepal Hemophilia Society and connect with a community that understands.",
    [
      "Membership is open to people with bleeding disorders, parents, clinicians, and supporters. There is no online payment on this website.",
      "The office confirms membership and explains what registration means for national advocacy and chapter contact.",
      "Members receive updates on events, safety news, and calls to action when government meetings need district stories.",
    ],
    "hands",
    "Hands joined in community support",
  ),
  "join-campaign-with-us": cardArticle(
    "join-campaign-with-us",
    "Campaign with us",
    "Help improve access to diagnosis, safe treatment and comprehensive care.",
    [
      "Campaigning in Nepal means letters to provincial ministries, media work on World Hemophilia Day, and patient stories told with dignity.",
      "NHS compares notes with international inquiries and guidelines, but the demand is local: screened blood, safe products, and records.",
      "You can write to the office with your district experience for the next advocacy meeting.",
    ],
    "eventAdvocacy",
    "Advocacy campaign meeting",
  ),
  "join-get-involved": cardArticle(
    "join-get-involved",
    "Get Involved",
    "Volunteer, fundraise or share your expertise to support families across Nepal.",
    [
      "Volunteers help with events, translation, transport, and outreach to schools. Clinicians advise on protocols and training.",
      "Fundraising might mean a workplace collection, a school programme, or a partnership with a local business — always coordinated with the office.",
      "Tell NHS what skill you offer and how much time you have. Small contributions add up across provinces.",
    ],
    "fundraising",
    "Fundraising and community involvement",
  ),
  "join-reach-out": cardArticle(
    "join-reach-out",
    "Reach Out",
    "The office is on the end of an email or phone when you need information and support.",
    [
      "Anamnagar, Rudmatti Marg, Kathmandu. Sunday to Friday, 9 am to 5 pm.",
      "Email nepalhemo@gmail.com for membership, events, media, and general questions. Phone 01-5172729 if you need a quicker conversation.",
      "For a serious bleed or head injury, contact your treatment centre or emergency services first. The office supports follow-up and advocacy, not emergency infusion by phone.",
    ],
    "clinic",
    "Contacting Nepal Hemophilia Society",
  ),
  "haemophilia-types": cardArticle(
    "haemophilia-types",
    "Types of haemophilia",
    "Haemophilia A, B, factor XI deficiency and acquired haemophilia are not the same condition.",
    [
      "Haemophilia A means factor VIII is low. Haemophilia B means factor IX is low. Severity — severe, moderate, or mild — comes from how much factor is measured.",
      "Severe haemophilia often appears when a child starts to crawl. Mild haemophilia may be found only after surgery or dental work.",
      "Factor XI deficiency and acquired haemophilia need different tests and treatments. Do not assume every bleed should receive factor VIII.",
    ],
    "blood",
    "Blood drop symbol for bleeding disorders",
    [
      "Haemophilia A — low factor VIII",
      "Haemophilia B — low factor IX",
      "Factor XI deficiency — separate condition",
      "Acquired haemophilia — immune system attacks factor",
    ],
  ),
  "haemophilia-causes": cardArticle(
    "haemophilia-causes",
    "Causes of haemophilia",
    "Most inherited haemophilia passes through families. Some gene changes are new.",
    [
      "Inherited haemophilia A or B comes from a change in the factor VIII or IX gene on the X chromosome. A parent can carry the gene without knowing.",
      "About one in three children with haemophilia has no known family history because the gene change is new in that child.",
      "Acquired haemophilia is not inherited. It needs urgent specialist care and different treatment planning.",
    ],
    "genetics",
    "Genetics and inheritance",
  ),
  "haemophilia-symptoms": cardArticle(
    "haemophilia-symptoms",
    "Symptoms of haemophilia",
    "Joint and muscle bleeds matter even when no blood is visible.",
    [
      "A warm, swollen, or stiff joint may be bleeding inside. Muscles can bleed after a minor bump.",
      "Nosebleeds, heavy periods, and long bleeding after cuts or dental work are warning signs worth testing.",
      "Head injury and throat or neck swelling need emergency care. Do not wait to see if symptoms pass.",
    ],
    "bandage",
    "Bandage and joint care",
    [
      "Large bruises with little cause",
      "Bleeding after injections or tooth extraction",
      "Joint swelling or loss of movement",
      "Blood in urine or stool",
      "Heavy menstrual bleeding in women and girls",
    ],
  ),
  "haemophilia-diagnosing": cardArticle(
    "haemophilia-diagnosing",
    "Diagnosing haemophilia",
    "A factor assay is the test that names the disorder.",
    [
      "A complete blood count and basic clotting times are not enough for diagnosis. You need a factor VIII or IX assay, and sometimes tests for von Willebrand disease.",
      "NHS can help a family ask where that test is done in Nepal this month. Take results to a treatment centre — do not start treatment from an advertisement.",
      "Keep copies of every lab report. Diagnosis may be reviewed as a child grows.",
    ],
    "diagnose",
    "Diagnosis and laboratory testing",
  ),
  "haemophilia-treating-a-bleed": cardArticle(
    "haemophilia-treating-a-bleed",
    "Treating a bleed",
    "Treatment depends on the missing factor and on what the centre can supply.",
    [
      "On-demand treatment means factor or another medicine when a bleed starts. Prophylaxis means regular treatment to prevent bleeds.",
      "In Nepal, supply varies by centre and month. Only the treatment team should choose the product and dose.",
      "Rest, ice, compression, and elevation can help while you reach care. They do not replace factor for a significant joint or muscle bleed.",
    ],
    "vial",
    "Clotting factor treatment vial",
  ),
  "haemophilia-pregnancy-planning": cardArticle(
    "haemophilia-pregnancy-planning",
    "Pregnancy and haemophilia",
    "Women and girls can bleed, and pregnancy needs a plan.",
    [
      "Carriers and women with mild haemophilia need a obstetric plan before delivery. Factor levels change in pregnancy and must be monitored.",
      "Newborn boys from haemophilia families may need testing after birth. Plan that with the centre early.",
      "Heavy periods and bleeding after childbirth are symptoms, not something to hide. Ask for testing and a written management plan.",
    ],
    "pregnancy",
    "Pregnancy planning with a bleeding disorder",
  ),
  "treatment-prophylaxis": cardArticle(
    "treatment-prophylaxis",
    "Prophylaxis",
    "Regular treatment to stop bleeds before they start.",
    [
      "Prophylaxis means factor or another prescribed medicine on a schedule even when the person feels well. The aim is fewer joint bleeds and fewer missed school or work days.",
      "The centre chooses dose and timing. Home treatment is only safe after training on infusion, storage, and when to go to hospital.",
      "NHS advocates for wider access to prophylaxis in Nepal. Availability is not yet equal in every province.",
    ],
    "prophylaxis",
    "Prophylaxis treatment schedule",
  ),
  "treatment-non-factor": cardArticle(
    "treatment-non-factor",
    "Non-factor therapies",
    "Medicines that help clotting without replacing the missing factor.",
    [
      "Non-factor therapies include emicizumab for some people with haemophilia A, including some with inhibitors. They are used in many countries but are not guaranteed on every Nepali hospital shelf.",
      "Humanitarian aid shipments change year to year. Only your centre can say whether a named medicine is available for you.",
      "Never switch products because someone else in the family uses them. Inhibitor status and allergy risk matter.",
    ],
    "nonFactor",
    "Non-factor hemophilia therapy",
  ),
  "treatment-extended-half-life": cardArticle(
    "treatment-extended-half-life",
    "Extended half-life factor",
    "Factor products designed to stay in the blood longer.",
    [
      "Extended half-life concentrates may mean fewer infusions for some people. They are still factor replacement, not a cure.",
      "Standard half-life products remain what many Nepali centres know best. Any new product needs clear storage and dosing instructions.",
      "Ask whether a product is suitable if you have an inhibitor. That decision belongs to the specialist team.",
    ],
    "halfLife",
    "Extended half-life factor concentrate",
  ),
  "uk-report": cardArticle(
    "uk-report",
    "UK Infected Blood Inquiry publishes its final report",
    "On 20 May 2024 the UK Infected Blood Inquiry published its final report on decades of harm through blood products.",
    [
      "The report described a calamity that infected people through blood and blood products, including people with haemophilia, and criticised decades of delay.",
      "NHS shares the report as a warning for blood safety in Nepal, not as a local legal process. The full documents are on the inquiry’s own website.",
      "The lesson for Nepal remains: screened donations, virus-inactivated products, and records of every batch given to every patient.",
    ],
    "speaker",
    "UK Infected Blood Inquiry report discussion",
  ),
  "safer-products": cardArticle(
    "safer-products",
    "Safer treatment products in Nepal",
    "NHS continues to ask government to fund virus-inactivated factor and reliable testing nationwide.",
    [
      "Humanitarian shipments arranged with the World Federation of Hemophilia have helped some patients. They are not a national supply system on their own.",
      "If your centre changes the product you receive, ask for the name, the batch number, and storage instructions in writing.",
      "Advocacy meetings include the question of what product a province is willing to buy — a camp without safe concentrate is not comprehensive care.",
    ],
    "bir",
    "Hospital care and safe blood products in Nepal",
  ),
  "advocacy-safety": cardArticle(
    "advocacy-safety",
    "Provincial meeting included the supply question",
    "The 11 March 2024 advocacy meeting linked diagnosis, treatment, and what provinces fund.",
    [
      "Provincial representatives heard from families and clinicians about travel costs, delayed diagnosis, and uneven access to factor.",
      "The Society’s ask included budgets for assays, virus-inactivated products, and clinics that continue after awareness days.",
      "District stories sent to the office help NHS speak with authority in the next government meeting.",
    ],
    "president",
    "Provincial advocacy meeting in Kathmandu",
  ),
};

// Auto-generate detail pages for remaining card titles used on the site.
const extraSeeds: [string, string, string, Photo][] = [
  ["inhibitors-treatment-overview", "Treatment types for inhibitors", "How replacement, prophylaxis and newer therapies differ when an inhibitor is present.", "vial"],
  ["inhibitors-finding-centres", "Treatment centres and inhibitor tests", "Where to ask for an inhibitor assay and a referral in Nepal.", "clinic"],
  ["inhibitors-newly-diagnosed-window", "Newly diagnosed and inhibitors", "The first months after diagnosis are when many inhibitors appear.", "hands"],
  ["women-haemophilia-basics", "Haemophilia in women and girls", "How haemophilia A and B are inherited and diagnosed in women.", "blood"],
  ["women-day-to-day-living", "Day-to-day living for women", "School, periods, work and sport with a bleeding plan.", "bandage"],
  ["women-finding-centres", "Centres for women and girls", "Ask NHS which centre can test women and girls near you.", "clinic"],
  ["centres-meet-community", "See the Society", "Meet the community that keeps the centre list alive and updated.", "hands"],
  ["centres-newly-diagnosed-steps", "Newly diagnosed steps", "What to do in the first weeks after a clotting test result.", "diagnose"],
  ["centres-faqs", "Questions before you call", "Short answers to common questions before you phone the office.", "question"],
  ["newly-diagnosed-understand-condition", "Understand the condition", "A plain explanation of haemophilia A, B and related disorders for new families.", "genetics"],
  ["newly-diagnosed-treatment-options", "Treatment after diagnosis", "On-demand care, prophylaxis and what is realistic in Nepal today.", "prophylaxis"],
  ["newly-diagnosed-find-centre", "Find a centre", "Hospitals, chapters, and how to confirm a clinic day before you travel.", "clinic"],
  ["newly-diagnosed-meet-community", "Meet the community", "Other families are the reason Nepal Hemophilia Society exists.", "newsKathmandu"],
  ["daily-women-and-girls", "Women and girls", "Periods, pregnancy and carrier testing in Nepal.", "pregnancy"],
  ["daily-faqs", "Sport, vaccines and registration", "Frequently asked day-to-day questions answered in plain language.", "question"],
  ["daily-our-community", "Our community", "Chapters, members, and Together For Life across Nepal.", "eventCamp"],
  ["community-join-membership", "Join the Society", "Register as a member, parent, clinician or volunteer.", "hands"],
  ["community-events-overview", "Events with NHS", "World Hemophilia Day, camps and advocacy meetings.", "eventWhd"],
  ["community-news-advocacy", "News and advocacy", "What the Society has been asking government to change.", "newsProvinces"],
  ["fundraising-email-office", "Email about fundraising", "How to propose a gift, partnership or collection through the office.", "fundraising"],
  ["fundraising-join-member", "Join as a member", "Membership is the ordinary way to belong to NHS.", "hands"],
  ["fundraising-attend-event", "Come to an event", "Awareness days are where new supporters meet families.", "eventAdvocacy"],
  ["events-offer-venue", "Offer a venue", "Tell the office about a hall, campus or clinic day for an event.", "eventAdvocacy"],
  ["events-read-advocacy-news", "Read advocacy news", "What recent meetings asked government to fund.", "newsWhd"],
  ["news-inquiry-blood-safety", "Inquiry and blood safety", "What the international infected-blood scandal means for products used in Nepal.", "inhibitor"],
  ["news-all-events", "All events", "Camps, advocacy days and 17 April on the events page.", "eventWhd"],
  ["inquiry-inquiry-news-updates", "Inquiry news updates", "Blood-safety updates NHS wants families to read.", "diagnose"],
  ["inquiry-advocacy-government", "Advocacy with government", "How parliamentary advocacy abroad compares with NHS work in Nepal.", "newsProvinces"],
  ["inquiry-support-worried", "Support if you are worried", "Testing and who to call if you fear infection from a past product.", "hands"],
  ["appg-write-to-nhs", "Write to NHS", "Share a district story for the next government meeting.", "eventAdvocacy"],
  ["appg-inquiry-background", "Inquiry background", "Why blood safety is part of NHS advocacy demands.", "inhibitor"],
  ["appg-join-advocacy", "Join advocacy", "Members give NHS authority when speaking to government.", "fundraising"],
  ["pub-haemophilia-plain", "Haemophilia in plain language", "Types, inheritance, symptoms and diagnosis for families.", "genetics"],
  ["pub-treatment-types-nepal", "Treatment types in Nepal", "Prophylaxis, non-factor therapy and supply limits explained.", "prophylaxis"],
  ["pub-newly-diagnosed-checklist", "Newly diagnosed checklist", "A first-week list after a clotting disorder diagnosis.", "diagnose"],
  ["pub-day-to-day", "Day-to-day living guide", "School, teeth, travel and work with a bleeding disorder.", "bandage"],
  ["pub-women-and-girls", "Women and girls guide", "Periods, pregnancy and carrier testing.", "pregnancy"],
  ["pub-wfh-guidelines", "WFH Guidelines", "The international clinical reference and how NHS uses it in Nepal.", "speaker"],
  ["video-wfh-youtube", "WFH on YouTube", "Talks and explainers from the World Federation of Hemophilia.", "speaker"],
  ["video-wfh-whd", "World Hemophilia Day films", "Annual campaign films and posters from WFH.", "eventWhd"],
  ["video-read-haemophilia-nepal", "Read for Nepal", "The same topics, written for families in Nepal, on the haemophilia page.", "genetics"],
  ["guide-wfh-treatment", "WFH treatment guidelines", "Official treatment guidance from the World Federation of Hemophilia.", "vial"],
  ["guide-treatment-nepal", "Treatment types in Nepal", "How local supply affects prophylaxis and newer products.", "prophylaxis"],
  ["guide-external-resources", "External resources", "CDC, WHO blood safety, and Ministry of Health links explained.", "question"],
  ["ext-wfh", "World Federation of Hemophilia", "NHS membership, guidelines, humanitarian aid and World Hemophilia Day.", "speaker"],
  ["ext-wfh-aid", "WFH humanitarian aid", "How donated treatment is governed and what reaches Nepal.", "vial"],
  ["ext-nfdn", "National Federation of the Disabled Nepal", "Disability rights and NHS membership in the wider movement.", "members"],
  ["ext-mohp", "Ministry of Health and Population", "The ministry NHS advocates to for diagnosis and treatment funding.", "advocacy"],
  ["ext-who-blood", "WHO blood products", "Why screened donations and safe plasma products matter.", "blood"],
  ["ext-cdc-hemophilia", "CDC hemophilia information", "A clear public explanation of hemophilia and joint health.", "bandage"],
  ["ext-uk-inquiry", "UK Infected Blood Inquiry", "Official site for the report and evidence — context for Nepal’s safety demands.", "speaker"],
  ["ext-support-worried", "Support if you are worried", "Testing pathways and who to call in Nepal.", "hands"],
];

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

for (const [slug, title, lead, photo] of extraSeeds) {
  if (!articles[slug]) {
    articles[slug] = cardArticle(
      slug,
      title,
      lead,
      [
        lead,
        "Nepal Hemophilia Society publishes this page so each topic has its own full explanation. For personal medical decisions, always follow your treatment centre.",
        "Call 01-5172729 or email nepalhemo@gmail.com if you want the office to help you act on what you have read.",
      ],
      photo,
      `${title} — Nepal Hemophilia Society`,
    );
  }
}

for (const [slug, url] of Object.entries(externalLinks)) {
  const doc = articles[slug];
  if (doc) {
    doc.blocks = [
      ...doc.blocks.filter((block) => block.kind !== "note"),
      { kind: "links", items: [{ title: "Visit official site", text: "Open the original page published by the organisation.", href: url }] },
      { kind: "note", text: disclaimer },
    ];
  }
}

for (const [slug, url] of Object.entries(mailtoLinks)) {
  const doc = articles[slug];
  if (doc) {
    doc.blocks = [
      ...doc.blocks.filter((block) => block.kind !== "note"),
      { kind: "links", items: [{ title: "Email the office", text: "Open your email app with a message addressed to nepalhemo@gmail.com.", href: url }] },
      { kind: "note", text: disclaimer },
    ];
  }
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
    doc.blocks = [
      ...doc.blocks.filter((block) => block.kind !== "note"),
      { kind: "links", items: [{ title: link.title, text: "Continue to the full section on this website.", href: link.href }] },
      { kind: "note", text: disclaimer },
    ];
  }
}

if (articles["uk-report"]) {
  articles["uk-report"].blocks = [
    ...articles["uk-report"].blocks.filter((block) => block.kind !== "note"),
    { kind: "links", items: [{ title: "Official inquiry site", text: "Read the full UK Infected Blood Inquiry report and evidence.", href: "https://www.infectedbloodinquiry.org.uk/" }] },
    { kind: "note", text: disclaimer },
  ];
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
