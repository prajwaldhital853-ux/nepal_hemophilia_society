import type { Block, Photo } from "@/data/pages";

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type ArticleContent = {
  title: string;
  lead: string;
  photo: Photo;
  photoAlt: string;
  intro?: string[];
  sections: ArticleSection[];
};

export function s(heading: string, paragraphs: string[], list?: string[]): ArticleSection {
  return { heading, paragraphs, list };
}

export function contentToBlocks(content: ArticleContent, disclaimer: string): Block[] {
  const blocks: Block[] = [
    ...(content.intro ?? []).map((text) => ({ kind: "p" as const, text })),
  ];
  for (const section of content.sections) {
    blocks.push({ kind: "h2", text: section.heading });
    for (const paragraph of section.paragraphs) {
      blocks.push({ kind: "p", text: paragraph });
    }
    if (section.list?.length) {
      blocks.push({ kind: "ul", items: section.list });
    }
  }
  blocks.push({ kind: "note", text: disclaimer });
  return blocks;
}

export const ARTICLE_CONTENT: Record<string, ArticleContent> = {
  "help-newly-diagnosed-child": {
    title: "My child is newly diagnosed",
    lead: "Finding out that your child has a bleeding disorder is a shock. This guide walks through the first weeks after a test result in Nepal.",
    photo: "hands",
    photoAlt: "Parent and child receiving support from Nepal Hemophilia Society",
    intro: [
      "A new diagnosis changes a family’s rhythm overnight. You may feel alone, especially if the nearest clotting test was far from home or if no one at the local clinic had seen haemophilia before. Nepal Hemophilia Society exists so those first weeks are not spent guessing.",
    ],
    sections: [
      s("What the report actually means", [
        "Write down the exact words on the laboratory report: haemophilia A or B, severe, moderate, or mild, or another disorder such as von Willebrand disease. Severity is measured by how much factor is in the blood, and it guides treatment planning.",
        "Photograph the report for your records and keep the original in a folder with clinic letters. Do not post the full report or your child’s name on social media. Identity and medical detail spread quickly online.",
      ]),
      s("Your first calls and registrations", [
        "Call Nepal Hemophilia Society on 01-5172729 or email nepalhemo@gmail.com. The Anamnagar office is open Sunday to Friday, 9 am to 5 pm. Staff can explain membership, provincial chapters, and which hospital currently runs a factor assay.",
        "Register with NHS so your family is counted in the national community and can receive event notices and advocacy updates. Registration is not the same as opening a hospital file — you still need a treatment centre for clinical care.",
      ], [
        "Keep one folder for lab reports and clinic letters",
        "Save the treatment centre phone number in two places",
        "Ask NHS which chapter is nearest your district",
      ]),
      s("Before the first bleed or bump", [
        "Ask the treatment centre what to do for a swollen joint, a head injury, or bleeding after a tooth. Write the answer on paper and give a copy to whoever cares for your child at school or daycare.",
        "Do not buy clotting factor from a pharmacy advertisement or a neighbour. Product names, storage, and dose belong to the centre that knows your child’s factor level.",
        "NHS can suggest plain language for teachers: what a joint bleed looks like, when to call you, and when to go straight to emergency care.",
      ]),
      s("School, travel, and emotional support", [
        "Most children with haemophilia attend school when a plan exists. The plan should name who to call and what is not an emergency. It should not label the child in a way that invites bullying.",
        "Travel within Nepal often means long bus rides. Know where the nearest hospital is on the route and carry the report copy. For air travel, ask the centre about documentation for factor if you carry it.",
        "Parents often grieve the life they imagined before diagnosis. Meeting another family at an NHS meeting or chapter event is often the turning point. You are not failing if you ask for help.",
      ]),
      s("When to go to emergency care", [
        "Head injury, neck or throat swelling, belly pain, black stool, or a bleed that will not stop after the plan your centre gave you — go to emergency care and say haemophilia is diagnosed or suspected.",
        "Then call your treatment centre and NHS when the child is stable. The office cannot infuse factor by phone, but it can help with follow-up and advocacy if care was delayed.",
      ]),
    ],
  },
  "help-someone-i-know": {
    title: "Someone I know has a bleeding disorder",
    lead: "You do not need to be a clinician to offer useful support. This page explains what helps and what can harm.",
    photo: "genetics",
    photoAlt: "Family learning about inherited bleeding disorders",
    sections: [
      s("What haemophilia is — and is not", [
        "Haemophilia and related disorders mean clotting takes longer than usual. Most dangerous bleeding is inside joints and muscles. A person can look fine while a knee or elbow is filling with blood.",
        "It is not contagious. You cannot catch it by living with someone or sharing food. It is not a reason to exclude someone from school, work, or friendship.",
      ]),
      s("How to support without taking over", [
        "Listen first. Many families are tired of advice from people who have never seen a joint bleed. Ask what they need today — a lift to hospital, childcare, or quiet company.",
        "Learn the emergency signs they mention: warm swollen joints, head bumps, bleeding after dental work. Encourage them to follow their centre’s plan rather than improvising.",
      ], [
        "Do not recommend aspirin or ibuprofen unless their centre approves",
        "Do not compare their child to another patient’s treatment",
        "Do not share their medical story online",
      ]),
      s("At school and work", [
        "Teachers and employers benefit from a short written plan from the family or centre. You can help by offering to attend a meeting or translate if language is a barrier.",
        "Reasonable adjustments are not favouritism. They prevent bleeds that would otherwise cause missed weeks and damaged joints.",
      ]),
      s("Where to learn more in Nepal", [
        "Nepal Hemophilia Society publishes plain-language pages on this website and answers the phone at 01-5172729. You may attend public events such as World Hemophilia Day without being a patient yourself.",
        "If you want to fundraise or volunteer, contact the office so your effort supports the Society’s priorities rather than duplicating work.",
      ]),
    ],
  },
  "help-day-to-day-support": {
    title: "I need help and support",
    lead: "Living with a bleeding disorder in Nepal means planning for school, work, travel, teeth, and ordinary life — not giving up on life.",
    photo: "bandage",
    photoAlt: "Practical first-aid support for bleeding disorders",
    sections: [
      s("Planning, not prohibition", [
        "Day-to-day living is about knowing when to treat, when to rest a joint, and when to call the centre. Most people continue study, employment, and family life with adjustments agreed in writing.",
        "A bleeding disorder should not silently decide a child’s education or an adult’s job. When exclusion happens, NHS can sometimes help you speak with institutions — but medical plans come from the centre.",
      ]),
      s("Dental care, surgery, and childbirth", [
        "Any procedure that breaks skin or gum needs a plan before the appointment date. The centre coordinates factor or other products if they are available that month in Nepal.",
        "Do not arrive at a dentist or surgeon without telling them about the bleeding disorder and without the centre’s letter. Discovering haemophilia on the operating table is dangerous.",
        "Women and girls need obstetric plans too. Heavy periods and postpartum bleeding are symptoms, not something to endure without testing.",
      ]),
      s("Exercise, physiotherapy, and joints", [
        "Strong muscles protect joints that have already bled. Physiotherapy after a bleed is part of care, not an optional extra. Ask whether your centre or NHS knows a therapist familiar with haemophilia.",
        "Contact sports with high head-injury risk need honest discussion with the centre. Swimming and many non-contact activities are often encouraged when joints are stable.",
      ]),
      s("Community and chapters", [
        "Provincial chapters and member meetings exist so families outside Kathmandu can share experience. You are not the only household figuring out bus travel with factor or explaining bleeds to a village school.",
        "Membership connects you to registration, advocacy, and event notices. Call the office if you do not know whether a chapter meets near you.",
      ]),
    ],
  },
  "provinces-2024": {
    title: "Provinces asked to invest in diagnosis and treatment",
    lead: "On 11 March 2024 Nepal Hemophilia Society asked provincial governments to fund care closer to where families live.",
    photo: "newsProvinces",
    photoAlt: "Provincial advocacy meeting for hemophilia care",
    sections: [
      s("What happened on 11 March 2024", [
        "Nepal Hemophilia Society met provincial government representatives in Kathmandu. Members, clinicians, and Society leadership asked provinces to invest in diagnosis, care, and safe treatment — not only one-day awareness camps.",
        "The meeting was held at a time when families still travel long distances for a factor assay or a single infusion. Provincial budgets were challenged to reflect that reality.",
      ]),
      s("What comprehensive care means", [
        "Comprehensive care is more than a poster. It includes a factor VIII or IX assay, virus-inactivated concentrate when available, physiotherapy, dental planning, and a clinic that continues after World Hemophilia Day.",
        "Families at the meeting described travel costs, lost wages, and children who missed school because joints were already damaged before diagnosis.",
      ], [
        "Factor assays reachable in each province",
        "Safe clotting products in hospital pharmacies",
        "Recorded batches and product names for every infusion",
        "Training for doctors, nurses, dentists, and physiotherapists",
      ]),
      s("Why provinces matter", [
        "Health delivery in Nepal is increasingly discussed at provincial level. If a province funds only outreach without laboratory capacity, families still return to Kathmandu for every test.",
        "NHS uses registration data and district stories — with consent — to show where gaps remain. Numbers without faces are easy to ignore; both together are harder to dismiss.",
      ]),
      s("What members can do next", [
        "Write a short account of care in your district: how far you travel, what product was used, what you still lack. Email nepalhemo@gmail.com with the subject “Provincial advocacy”.",
        "Follow news on this website and attend World Hemophilia Day events when they happen near you. Advocacy continues between meetings.",
      ]),
    ],
  },
  "community-kathmandu": {
    title: "Members gather in Kathmandu",
    lead: "Families from beyond the valley met in Kathmandu to share knowledge and connection.",
    photo: "newsKathmandu",
    photoAlt: "Members gathering in Kathmandu",
    sections: [
      s("Why the room mattered", [
        "The same week as provincial advocacy in March 2024, many families entered one room who had never met another parent facing haemophilia. For some, it was the first time they heard a swollen knee described in the same words they use at home.",
        "Clinicians and volunteers answered questions about registration, travel to centres, and what to expect after diagnosis. That conversation cannot be replaced by a single pamphlet.",
      ]),
      s("Registration still open", [
        "If you were in the room and have not completed membership details, call the Anamnagar office on 01-5172729. Registration helps NHS represent the community in government meetings and plan events.",
        "If you could not travel to Kathmandu, ask the office which chapter or contact is nearer your district.",
      ]),
      s("What people took home", [
        "Phone numbers of other families, not only of staff. Paper lists of hospitals that ran assays that month. A sense that diagnosis is not the end of community.",
        "Meetings end, but relationships continue. Many chapters started because someone refused to let distance be the last word.",
      ]),
    ],
  },
  whd: {
    title: "World Hemophilia Day in Nepal",
    lead: "Each 17 April NHS marks World Hemophilia Day with the global community and a local demand for diagnosis.",
    photo: "newsWhd",
    photoAlt: "World Hemophilia Day in Nepal",
    sections: [
      s("The global day and local meaning", [
        "World Hemophilia Day is 17 April, the birthday of Frank Schnabel, founder of the World Federation of Hemophilia. Around the world, patient organisations mark the day with awareness and policy asks.",
        "In Nepal the message is concrete: people should not wait years for a name for their bleeding. Red colour, rallies, and school talks are tools — diagnosis and safe treatment are the goal.",
      ]),
      s("How NHS marks the day", [
        "Hospitals, schools, colleges, and chapters host programmes across provinces. Some years focus on media; others on meetings with officials. The Society publishes materials and may send speakers when the calendar allows.",
        "Write to nepalhemo@gmail.com if you want NHS involved in an event you are planning. Early contact helps staff allocate volunteers and fact sheets.",
      ]),
      s("Beyond one day", [
        "Awareness without laboratory capacity fades by May. NHS therefore pairs World Hemophilia Day with ongoing asks for factor assays, safe products, and provincial budgets.",
        "If you attended a rally, follow up by registering as a member and telling the office what care still fails in your district.",
      ]),
    ],
  },
  "haemophilia-types": {
    title: "Types of haemophilia",
    lead: "Haemophilia A, B, factor XI deficiency, and acquired haemophilia are not the same condition — and they are not treated the same way.",
    photo: "blood",
    photoAlt: "Blood drop symbol for bleeding disorders",
    sections: [
      s("Haemophilia A and B", [
        "Haemophilia A means factor VIII is low. Haemophilia B, sometimes called Christmas disease, means factor IX is low. Both are usually inherited on the X chromosome and are more often diagnosed in boys, though girls and women can bleed enough to need treatment.",
        "Severity — severe, moderate, or mild — comes from how much factor is measured in the blood, not from how brave the patient is. Severe haemophilia often appears when a child starts to crawl; mild haemophilia may be found only after surgery or dental work.",
      ]),
      s("Factor XI deficiency", [
        "Factor XI deficiency is sometimes called haemophilia C. It is not haemophilia A or B. Bleeding is less predictable: some people bleed after surgery or dental work and rarely have spontaneous joint bleeds.",
        "A factor assay confirms the diagnosis. Do not assume a factor VIII product will help. Care is planned by the centre that knows the full panel result.",
      ]),
      s("Acquired haemophilia", [
        "Acquired haemophilia is not inherited. The immune system makes an antibody, usually against factor VIII. It can appear in older adults and sometimes late in pregnancy or after birth. Both men and women are affected.",
        "Bleeding into skin and muscles, and bleeding after procedures, are typical. This is an emergency for a specialist. Diagnosis needs a low factor level plus an inhibitor test.",
      ], [
        "Inherited A — low factor VIII",
        "Inherited B — low factor IX",
        "Factor XI deficiency — separate pathway",
        "Acquired — immune antibody, urgent specialist care",
      ]),
      s("Why the label matters in Nepal", [
        "Treatment centres in Nepal stock different products by month and by donor programme. The name on your report determines which product is appropriate.",
        "Nepal Hemophilia Society can help you ask for the right test if diagnosis was incomplete. Take every result to a treatment centre rather than starting treatment from an advertisement.",
      ]),
    ],
  },
  "haemophilia-causes": {
    title: "Causes of haemophilia",
    lead: "Most haemophilia is inherited. Some gene changes are new. Acquired haemophilia is a different story altogether.",
    photo: "genetics",
    photoAlt: "Genetics and inheritance",
    sections: [
      s("Inherited haemophilia A and B", [
        "In inherited haemophilia, a change in the factor VIII or factor IX gene means the body does not make enough working factor. The gene sits on the X chromosome.",
        "A parent can carry the gene without knowing. Daughters may carry; sons may be affected. Family history helps diagnosis but is not always present.",
      ]),
      s("When there is no family history", [
        "About one in three children with haemophilia has no known family history because the gene change is new in that child. Parents should not blame themselves for a mutation no one could see in advance.",
        "Testing still matters for siblings and future pregnancy planning. The centre or genetics service can explain what to test and when.",
      ]),
      s("Carriers and women who bleed", [
        "Because women have two X chromosomes, many carriers have enough factor to feel well. Lyonization and other patterns can leave a woman with factor levels in the haemophilia range.",
        "Heavy periods, bleeding after childbirth, and bleeding after dental work in women in haemophilia families deserve testing, not dismissal.",
      ]),
      s("Acquired causes are different", [
        "Acquired haemophilia is not passed to children the same way. It needs urgent specialist care and inhibitor testing. If someone tells you all haemophilia is ‘from the family’, that is not true of acquired cases.",
      ]),
    ],
  },
  "haemophilia-symptoms": {
    title: "Symptoms of haemophilia",
    lead: "Joint and muscle bleeds matter even when no blood is visible on the skin.",
    photo: "bandage",
    photoAlt: "Bandage and joint care",
    sections: [
      s("Bleeding you cannot see", [
        "Most serious bleeding in haemophilia is internal. A knee or elbow may swell, feel warm, and refuse to straighten while the skin looks normal.",
        "Muscle bleeds can tighten a limb and press on nerves. Belly pain can mean internal bleeding. These are not situations to sleep off.",
      ]),
      s("Bleeding you can see", [
        "Nosebleeds that last, bruises that appear with little cause, and bleeding that continues after a small cut or injection are common clues.",
        "After dental extraction or surgery, bleeding may restart hours later when the first clot fails. That delay confuses families who thought the procedure went well.",
      ], [
        "Large bruises with little trauma",
        "Bleeding after injections or tooth extraction",
        "Warm, swollen, or stiff joints",
        "Blood in urine or stool",
        "Heavy menstrual bleeding in women and girls",
      ]),
      s("Head injury is always urgent", [
        "A bump on the head in a person with haemophilia needs emergency assessment even if they act normal at first. Do not wait for vomiting or sleepiness before you go.",
        "Tell emergency staff that haemophilia is diagnosed or suspected. Show the report if you have it.",
      ]),
      s("When symptoms do not fit a label", [
        "If bleeding pattern suggests another disorder — von Willebrand disease, platelet problems, or acquired haemophilia — the centre may order a wider panel. One test is not always enough.",
      ]),
    ],
  },
  "haemophilia-diagnosing": {
    title: "Diagnosing haemophilia",
    lead: "A factor assay is the test that names the disorder. Ordinary clotting times are not enough.",
    photo: "diagnose",
    photoAlt: "Diagnosis and laboratory testing",
    sections: [
      s("Tests that screen vs tests that diagnose", [
        "A complete blood count and prothrombin time may be normal in haemophilia. Diagnosis requires a factor VIII or IX assay, and sometimes tests for von Willebrand disease or other factors.",
        "If a hospital only checked ‘clotting time’ and said results were fine, that does not rule out haemophilia. Ask specifically for a factor assay.",
      ]),
      s("Where testing happens in Nepal", [
        "Capacity varies by month and by hospital. NHS can help a family ask where an assay is run near them. Bir Hospital and other centres have historically performed testing — confirm with the office before you travel.",
        "Keep copies of every report. Diagnosis may be revised as a child grows and factor levels are remeasured.",
      ]),
      s("After the result", [
        "Take the report to a treatment centre before you buy any product. Do not start treatment from a pharmacy or a relative’s leftover factor.",
        "Register with Nepal Hemophilia Society so you receive community support and advocacy that reflects real patient numbers.",
      ]),
      s("Testing family members", [
        "Siblings, mothers, and daughters may need carrier or factor testing. Planning prevents surprises at surgery or childbirth.",
      ]),
    ],
  },
  "haemophilia-treating-a-bleed": {
    title: "Treating a bleed",
    lead: "Treatment depends on the missing factor, inhibitor status, and what the centre can supply in Nepal this month.",
    photo: "vial",
    photoAlt: "Clotting factor treatment vial",
    sections: [
      s("On-demand and prophylaxis", [
        "On-demand treatment means factor or another medicine when a bleed starts or before a planned procedure. Prophylaxis means regular treatment to prevent bleeds before they damage joints.",
        "In Nepal, not every child receives prophylaxis yet. NHS advocates for wider access. Your centre decides what is possible with current stock.",
      ]),
      s("What you should not do alone", [
        "Do not increase dose because a bleed feels worse without calling the centre. Do not switch brands because another family uses a different product.",
        "Do not use aspirin or ibuprofen unless the centre approves. Do not buy factor from informal sellers — unsafe plasma products carry infection risk.",
      ]),
      s("While you travel to care", [
        "Rest, ice, compression, and elevation may ease pain while you reach help. They do not replace factor for a significant joint or muscle bleed.",
        "For minor surface bleeding, direct pressure helps. For anything involving head, neck, belly, or a joint that will not move — go to emergency care.",
      ]),
      s("Recording every treatment", [
        "Ask the centre to write product name, batch, dose, and time. Records matter for inhibitor monitoring, surgery planning, and blood safety advocacy nationwide.",
      ]),
    ],
  },
  "haemophilia-pregnancy-planning": {
    title: "Pregnancy and haemophilia",
    lead: "Women and girls can bleed, and pregnancy needs a plan written before delivery day.",
    photo: "pregnancy",
    photoAlt: "Pregnancy planning with a bleeding disorder",
    sections: [
      s("Carriers and women with mild haemophilia", [
        "Factor levels change in pregnancy. A woman who felt well before may need monitoring near delivery. An obstetrician and the haemophilia centre should share plans.",
        "Newborn boys from haemophilia families may need testing after birth. Arrange that before labour so nobody improvises.",
      ]),
      s("Heavy periods and prior bleeds", [
        "Heavy menstrual bleeding is a symptom worth testing, not a secret to hide. Bleeding after childbirth or surgery likewise.",
        "Treatment options depend on factor level and disorder type. Only the specialist team should choose them.",
      ]),
      s("Genetic counselling in plain language", [
        "Families want to know what chance a future child has. Answers depend on whether the mother carries, has haemophilia, or the father is affected. Ask the centre for diagrams you can keep.",
      ]),
      s("Support from NHS", [
        "The Society connects women to information and advocacy. You can call the office without sending private records by email first — staff will explain safer ways to talk.",
      ]),
    ],
  },
  "treatment-prophylaxis": {
    title: "Prophylaxis",
    lead: "Regular treatment to stop bleeds before they start — the goal NHS argues for nationwide.",
    photo: "prophylaxis",
    photoAlt: "Prophylaxis treatment schedule",
    sections: [
      s("What prophylaxis means", [
        "Prophylaxis means factor or another prescribed medicine on a schedule even when the person feels well. The aim is fewer joint bleeds, less joint damage, and fewer missed school or work days.",
        "It is standard of care for severe haemophilia in many countries. In Nepal access is still uneven — advocacy continues.",
      ]),
      s("How centres plan it", [
        "Dose and schedule depend on severity, product available, weight, and bleeding history. Home infusion is only safe after hands-on training and a clear emergency plan.",
        "Head injury rules do not change because prophylaxis was given this morning. Serious symptoms still need emergency care.",
      ]),
      s("Physiotherapy alongside medicine", [
        "Strong muscles protect joints. Physiotherapy after old bleeds is part of comprehensive care, not a luxury.",
      ]),
      s("Nepal’s supply reality", [
        "Humanitarian aid and government procurement both affect whether prophylaxis is possible in a given month. Ask the centre honestly what schedule is sustainable — and tell NHS if gaps persist so advocacy has evidence.",
      ]),
    ],
  },
  "treatment-non-factor": {
    title: "Non-factor therapies",
    lead: "Medicines that help clotting without replacing the missing factor — availability in Nepal varies year to year.",
    photo: "nonFactor",
    photoAlt: "Non-factor hemophilia therapy",
    sections: [
      s("What ‘non-factor’ means", [
        "Non-factor therapies help blood clot by another pathway. Emicizumab is the best-known example for some people with haemophilia A, including some with inhibitors.",
        "They are not a cure and they are not interchangeable with factor VIII concentrate.",
      ]),
      s("Humanitarian access", [
        "The World Federation of Hemophilia has reported humanitarian shipments to Nepal including some non-factor treatment. Shipments change annually.",
        "Only your treatment centre can say whether a named medicine is on shelf for you. NHS does not prescribe through this website.",
      ]),
      s("Safety and inhibitors", [
        "Never switch products because social media says a new medicine is better. Inhibitor status, allergy history, and surgery plans all matter.",
        "Haemophilia B with inhibitors carries different risks than haemophilia A. Specialist supervision is mandatory.",
      ]),
    ],
  },
  "treatment-extended-half-life": {
    title: "Extended half-life factor",
    lead: "Factor products designed to stay in the blood longer — still replacement, not a cure.",
    photo: "halfLife",
    photoAlt: "Extended half-life factor concentrate",
    sections: [
      s("How they differ from standard factor", [
        "Extended half-life concentrates remain in circulation longer for some patients. That may mean fewer infusions per week on prophylaxis.",
        "They are still factor VIII or IX replacement. Storage, reconstitution, and inhibitor monitoring rules still apply.",
      ]),
      s("Stock in Nepal", [
        "Standard half-life products remain what many centres know best. When extended half-life arrives, the centre must explain dose conversion and what to do if supply stops mid-month.",
      ]),
      s("Questions to ask the centre", [
        "Is this product suitable if I have an inhibitor? How do I store it during load-shedding hours? What is the plan if only standard factor is available next month?",
      ]),
    ],
  },
};
