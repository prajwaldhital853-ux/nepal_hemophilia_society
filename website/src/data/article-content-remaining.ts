import type { ArticleContent, ArticleSection } from "@/data/article-content";

function s(heading: string, paragraphs: string[], list?: string[]): ArticleSection {
  return { heading, paragraphs, list };
}

export const ARTICLE_CONTENT_REMAINING: Record<string, ArticleContent> = {
  "world-hemophilia-day": {
    title: "World Hemophilia Day",
    lead: "Stand with Nepal’s bleeding disorder community on 17 April — and keep asking for diagnosis and safe treatment after the banners come down.",
    photo: "eventWhd",
    photoAlt: "World Hemophilia Day event poster scene",
    sections: [
      s("Why 17 April matters worldwide", [
        "World Hemophilia Day is observed every 17 April, the birthday of Frank Schnabel, who founded the World Federation of Hemophilia. Patient organisations on every continent use the day to explain bleeding disorders and to ask governments for laboratory capacity and safe products.",
        "Nepal Hemophilia Society is a national member organisation of WFH. That membership connects Nepali families to international guidelines, humanitarian aid discussions, and a calendar the media already recognises.",
      ]),
      s("What happens in Nepal", [
        "Activities range from hospital talks and school assemblies to rallies, red-light landmarks, and interviews on radio and television. Some years emphasise children; others focus on women and girls or on blood safety.",
        "The local message is always practical: a person who bleeds for years without a factor assay is not receiving modern care. Awareness should lead to testing and referral, not fear or stigma.",
      ], [
        "Contact nepalhemo@gmail.com early if you want NHS speakers or materials",
        "Register as a member so the Society can count who it represents",
        "Tell the office what care still fails in your district after the event",
      ]),
      s("Planning an event in your school or hospital", [
        "You do not need to be a clinician to host a programme. A short talk, a poster display, and a moment for questions can change whether a teacher refers a child for testing.",
        "Avoid graphic images that frighten children without explaining what help exists. Pair every statistic with a phone number: 01-5172729 for NHS, and your local hospital for emergency care.",
      ]),
      s("After World Hemophilia Day", [
        "One day of visibility does not replace provincial budgets for factor assays or virus-inactivated concentrate. NHS uses registration data and district stories in the months after April to keep government attention.",
        "If you attended an event, follow up by completing membership, sharing a photo with consent, or writing a paragraph about travel to care. Advocacy continues when the microphones are off.",
      ]),
    ],
  },
  "advocacy-meeting": {
    title: "Provincial advocacy meeting",
    lead: "Families, clinicians, and volunteers met provincial leaders on 11 March 2024 to ask for sustained investment — not a single awareness camp.",
    photo: "eventAdvocacy",
    photoAlt: "Advocacy meeting with stakeholders",
    sections: [
      s("Who was in the room", [
        "On 11 March 2024 Nepal Hemophilia Society convened provincial government representatives, member families, and clinicians in Kathmandu. The meeting was not a celebration; it was a structured ask backed by lived experience.",
        "Parents described bus fares, lost wages, and children who missed school because joints were damaged before anyone named haemophilia. Clinicians explained the difference between cryoprecipitate and virus-inactivated concentrate when a centre has both.",
      ]),
      s("The three-part ask", [
        "Diagnosis: factor VIII and IX assays reachable in each province, not only in the capital. Treatment: safe clotting products recorded by batch for every patient. Continuity: clinics and physiotherapy that continue after World Hemophilia Day.",
        "Provincial budgets were challenged directly. If a province funds posters but not laboratory reagents, families still return to Kathmandu for every test.",
      ]),
      s("Supply and safety on the agenda", [
        "Members raised what product was on shelf that month, whether humanitarian aid filled a gap, and what happens when a batch changes mid-treatment. Blood safety is not an abstract lesson from abroad — it is a procurement decision in each province.",
        "The Society linked the meeting to wider international inquiry reports as context for why records and screened donations matter in Nepal today.",
      ]),
      s("What happens between meetings", [
        "Advocacy continues through letters, registration data, and district stories sent to nepalhemo@gmail.com with the subject “Provincial advocacy”.",
        "If you could not travel to Kathmandu, your paragraph about care in your district carries the same weight when the office presents to officials. Membership gives NHS authority to speak with numbers and names — always with consent.",
      ]),
    ],
  },
  "health-camps": {
    title: "Community health camp",
    lead: "Hands-on support for children and families away from a crowded outpatient corridor — with clear limits on what a camp can and cannot do.",
    photo: "eventCamp",
    photoAlt: "Community health camp for children with hemophilia",
    sections: [
      s("What a camp can offer", [
        "Community health camps organised with NHS can give families time to ask questions that rarely fit a five-minute clinic slot: dental planning, school letters, physiotherapy after an old bleed, and how registration works.",
        "Camps can also introduce families to each other. Many parents say the first useful conversation happened standing in a queue, not reading a leaflet.",
      ]),
      s("What a camp cannot replace", [
        "A camp is not an emergency service. It does not replace a factor assay, an inhibitor test, or an infusion at a treatment centre. If a child has a head injury or a hot swollen joint during a camp, go to emergency care immediately.",
        "Do not start or change treatment because someone at a camp suggested a product name. Only your treatment centre prescribes and supplies clotting factor.",
      ]),
      s("How to request a camp in your district", [
        "Email nepalhemo@gmail.com with a proposed venue, a local hospital contact, and how many families you already know in the area. Early planning helps NHS coordinate clinicians and volunteers.",
        "District chapters in Bhaktapur, Chitwan, Parsa, Sunsari, Kaski, and contacts elsewhere can help mobilise families. The national office links you to the nearest volunteer even if your district is not on that list.",
      ]),
      s("After the camp", [
        "Follow up with the hospital named at the camp for clinical files and assay results. Complete NHS registration if you have not already.",
        "Send the office one sentence about what still failed locally — no assay, no factor, no physiotherapist — so the next advocacy meeting has district evidence.",
      ]),
    ],
  },
  "story-family-journey": {
    title: "A family’s journey",
    lead: "Finding support changed how one family faced diagnosis and daily life — a pattern repeated across Nepal when isolation ends.",
    photo: "hands",
    photoAlt: "Family supported by the hemophilia community",
    intro: [
      "Every family’s path is different, but many describe the same months after diagnosis: shock, secrecy, and the feeling that no neighbour could understand. This page describes what changes when Nepal Hemophilia Society enters the picture — without pretending one story fits all.",
    ],
    sections: [
      s("The months before anyone names it", [
        "Repeated bruises, swollen knees, or bleeding after dental work may be dismissed as clumsiness or ‘weak blood’ until a factor assay finally gives a name. Some families travel to Kathmandu for that test; others wait years.",
        "The diagnosis paper is both relief and fear. Finally there is a word; now there is responsibility to learn emergency steps and find a centre.",
      ]),
      s("What registration and community provide", [
        "NHS registration is not a hospital file. It connects you to the national community list, event notices, and advocacy that uses aggregated numbers — with consent — when speaking to government.",
        "Meeting another parent at a chapter meeting or World Hemophilia Day rally is often the turning point. Shared language about joint bleeds and school letters reduces the sense that you are inventing care from zero.",
      ]),
      s("Setbacks are part of the journey", [
        "Supply gaps, long travel, and a centre phone that rings busy do not mean you failed. They mean Nepal’s system still has holes NHS is trying to close.",
        "When a bleed happens despite your best plan, record what product was used and tell the centre. Those records protect your child and strengthen national advocacy for safer supply.",
      ]),
      s("How to start your own chapter of the story", [
        "Call 01-5172729 or email nepalhemo@gmail.com. Say your district and whether you are newly diagnosed or years into care.",
        "You do not need to share your full story publicly to belong. Many members help quietly — translation, transport, or a phone call on a hard day.",
      ]),
    ],
  },
  "story-living-confidence": {
    title: "Living life with confidence",
    lead: "With care, knowledge, and connection, a bleeding disorder shapes plans — it does not have to define the future.",
    photo: "newsKathmandu",
    photoAlt: "Members gathering in Kathmandu",
    sections: [
      s("Confidence is built, not inherited", [
        "Children and adults across Nepal study, work, farm, and play when a written plan exists at the treatment centre and school or employer. Restrictions are specific — this sport, this job task — not a blanket ban on living.",
        "Confidence grows when the family knows emergency steps by heart and when the centre returns calls. Uncertainty drains energy faster than haemophilia itself.",
      ]),
      s("School and work with a plan", [
        "A one-page letter from the centre explaining what a bleed looks like and who to call can keep a child in class without exposing private details to the whole playground.",
        "Adults often hide bleeding disorders from employers until a crisis forces disclosure. NHS can discuss what to say and when, but medical limits belong in a letter from the specialist.",
      ]),
      s("Movement after bleeds", [
        "Rest after a joint bleed is necessary; permanent couch rest is not. Physiotherapy when the bleed settles protects long-term movement. Swimming and walking are common choices; high-impact sport needs an individual decision.",
        "Damaged joints need honest conversation with the centre, not shame. Hiding limps leads to worse injuries.",
      ]),
      s("Sharing stories at events", [
        "When members speak at World Hemophilia Day or a camp, the next family hears that life can widen again after diagnosis. You never owe the public your child’s name or photograph.",
        "If you want to share experience with NHS for advocacy, email the office. Staff will explain consent and how stories are used in government meetings.",
      ]),
    ],
  },
  "story-stronger-together": {
    title: "Stronger together",
    lead: "Families across Nepal share experience and open doors for the next generation — that collective voice is what provincial advocacy needs.",
    photo: "newsMembers",
    photoAlt: "Nepal Hemophilia Society members together",
    sections: [
      s("From private worry to collective voice", [
        "Chapters and member meetings turn worry spoken only at home into a demand officials can hear. Registration counts matter when NHS asks a province for assay funding: empty lists are easy to ignore.",
        "Volunteer chapters in Bhaktapur, Chitwan, Parsa, Sunsari, Kaski, and contacts in other districts help families reach hospitals and keep phone numbers current.",
      ]),
      s("What clinicians and parents learn together", [
        "When parents and doctors sit in the same room, both sides hear what textbooks omit: load-shedding and fridge storage, bus fare to Kathmandu, teeth pulled without factor because nobody planned ahead.",
        "That dialogue improves protocols locally even when national supply is slow to change.",
      ]),
      s("Membership as representation", [
        "Membership is open to people with bleeding disorders, parents, clinicians, and supporters. There is no online payment on this website — the office confirms details and explains fees if applicable.",
        "Each member strengthens every ask to government for screened blood, virus-inactivated products, and records of every batch given to every patient.",
      ]),
      s("Join the next gathering", [
        "Follow events on this website and ask nepalhemo@gmail.com about World Hemophilia Day programmes near you.",
        "If distance blocks travel, ask which phone contact is nearest. Community is not only the capital.",
      ]),
    ],
  },
  "join-become-member": {
    title: "Become a Member",
    lead: "Join Nepal Hemophilia Society and connect with a community that understands — membership is how the national voice is counted.",
    photo: "hands",
    photoAlt: "Hands joined in community support",
    sections: [
      s("Who can join", [
        "Membership is open to people with bleeding disorders, parents and carers, clinicians, and supporters who want diagnosis and safe treatment improved across Nepal.",
        "There is no online payment on this website. Contact the Anamnagar office to confirm membership, explain registration, and learn what chapter contact is nearest your district.",
      ]),
      s("What membership is — and is not", [
        "Membership registers you with the national patient organisation recognised by the World Federation of Hemophilia. It is not the same as opening a hospital treatment file.",
        "Clinical care — factor assays, infusions, surgery planning — still flows through your treatment centre. NHS supports community, information, events, and advocacy.",
      ]),
      s("What members receive", [
        "Updates on World Hemophilia Day, health camps, and advocacy meetings. Safety news when product batches or international inquiry reports affect Nepal.",
        "Connection to other families and volunteers who have navigated school letters, travel to centres, and supply gaps.",
      ], [
        "Phone 01-5172729, Sunday to Friday, 9 am to 5 pm",
        "Email nepalhemo@gmail.com",
        "Office: Anamnagar, Rudmatti Marg, Kathmandu",
      ]),
      s("Why numbers matter for advocacy", [
        "When NHS meets provincial ministers, registered membership shows how many people stand behind each ask. Your name in the register — held confidentially — supports funding for assays and safe products.",
        "If you were diagnosed years ago but never registered, it is not too late. Call the office this week.",
      ]),
    ],
  },
  "join-campaign-with-us": {
    title: "Campaign with us",
    lead: "Help improve access to diagnosis, safe treatment, and comprehensive care — campaigning in Nepal is letters, media, and dignified patient stories.",
    photo: "eventAdvocacy",
    photoAlt: "Advocacy campaign meeting",
    sections: [
      s("What campaigning looks like here", [
        "Campaigning is not only protests. It includes letters to provincial ministries, media work on World Hemophilia Day, parliamentary-style advocacy modelled on international examples, and patient stories told with consent and dignity.",
        "NHS compares notes with the UK Infected Blood Inquiry and World Federation of Hemophilia guidelines, but every demand is local: screened donations, virus-inactivated products, factor assays in reach, and records.",
      ]),
      s("District stories change policy", [
        "A paragraph about how far you travel for one infusion, or how long diagnosis took, is evidence officials cannot dismiss as foreign statistics.",
        "Email nepalhemo@gmail.com with the subject “Advocacy”. Staff will explain how your story may be used and ask permission before sharing names publicly.",
      ]),
      s("Skills volunteers offer", [
        "Translation between Nepali and English, photography with consent, transport for families attending meetings, social media that points to official NHS channels, and introductions to local journalists.",
        "Clinicians volunteer protocol advice and training — always coordinated with the office so messages stay consistent.",
      ]),
      s("Safety in public advocacy", [
        "Never share another family’s medical details without permission. Never post factor batch numbers or full lab reports online.",
        "For emergencies, campaign contacts do not replace the treatment centre. Keep 01-5172729 for society business and your hospital number for bleeds.",
      ]),
    ],
  },
  "join-get-involved": {
    title: "Get Involved",
    lead: "Volunteer, fundraise, or share your expertise — small contributions across provinces add up to a national movement.",
    photo: "fundraising",
    photoAlt: "Fundraising and community involvement",
    sections: [
      s("Volunteering with NHS", [
        "Volunteers help with World Hemophilia Day events, health camps, translation at meetings, transport for families, and outreach to schools. Tell the office what skill you offer and how many hours you realistically have.",
        "Parent volunteers often mentor newly diagnosed families by phone. That role requires listening, not prescribing treatment.",
      ]),
      s("Fundraising that helps the mission", [
        "Workplace collections, school programmes, and local business partnerships can support NHS priorities when coordinated with the office first.",
        "Fundraising must not imply that NHS sells factor or runs a hospital. Donations support society operations, advocacy, and events as the office explains.",
      ]),
      s("Professional expertise", [
        "Doctors, nurses, dentists, physiotherapists, and lab staff can advise on training days and camp content. Legal and media professionals help with letters and press releases.",
        "All professional involvement stays advisory unless you are acting in your official hospital role with proper referral pathways.",
      ]),
      s("First step", [
        "Email nepalhemo@gmail.com or call 01-5172729. Describe your district, your connection to bleeding disorders, and what you want to do.",
        "If you are newly diagnosed and not ready to volunteer, membership alone is already involvement. Rest is allowed.",
      ]),
    ],
  },
  "join-reach-out": {
    title: "Reach Out",
    lead: "The office is at the end of an email or phone when you need information and support — with clear limits on emergency care.",
    photo: "clinic",
    photoAlt: "Contacting Nepal Hemophilia Society",
    sections: [
      s("How to contact NHS", [
        "Nepal Hemophilia Society, Anamnagar, Rudmatti Marg, Kathmandu. Open Sunday to Friday, 9 am to 5 pm.",
        "Email nepalhemo@gmail.com for membership, events, media enquiries, fundraising, and general questions. Phone 01-5172729 when you need a quicker conversation in Nepali or English.",
      ]),
      s("What the office can help with", [
        "Registration and chapter introductions. Explaining how to reach a treatment centre and what papers to carry. Event dates and advocacy updates. Connecting you to other families when you consent.",
        "The office does not keep factor on shelf and cannot instruct a hospital to infuse by telephone.",
      ]),
      s("When to call the treatment centre or emergency services first", [
        "Head injury, neck swelling, belly pain, black stool, or a bleed that will not stop after following the plan your centre gave you — go to emergency care and say haemophilia is diagnosed or suspected.",
        "Then contact NHS when the person is stable if you need follow-up advocacy or help navigating care.",
      ]),
      s("Protecting your privacy", [
        "Avoid sending full lab reports or identity documents by unsecured social media. Email is better; in-person delivery is best for sensitive papers.",
        "Staff will never share your story in advocacy materials without asking permission first.",
      ]),
    ],
  },
  "uk-report": {
    title: "UK Infected Blood Inquiry publishes its final report",
    lead: "On 20 May 2024 the UK Infected Blood Inquiry published its final report on decades of harm through blood products — a warning for blood safety everywhere, including Nepal.",
    photo: "speaker",
    photoAlt: "UK Infected Blood Inquiry report discussion",
    sections: [
      s("What the inquiry found", [
        "The UK Infected Blood Inquiry described a calamity in which thousands of people were infected with HIV and hepatitis through blood and blood products, including people with haemophilia treated with factor concentrate from pooled plasma.",
        "The report criticised decades of delay, missing records, and failure to switch to safer products when evidence existed. Compensation and accountability processes continue in the United Kingdom; that is not Nepal’s legal process.",
      ]),
      s("Why NHS shares this news", [
        "Nepal Hemophilia Society publishes inquiry updates because the lesson crosses borders: screened donations, virus-inactivated products, and batch records for every patient are not optional extras.",
        "Families here may ask whether past products were safe. Honest answers require hospital records and testing pathways, not rumours on social media.",
      ]),
      s("What Nepal should demand", [
        "Factor assays before treatment plans. Virus-inactivated concentrate when procurement allows. Written product name and batch for every infusion. National blood policy that learns from international scandals before harm happens.",
        "Humanitarian aid from the World Federation of Hemophilia helps some patients but is not a substitute for a government supply system with safety rules.",
      ]),
      s("If you are worried about past treatment", [
        "Go to your treatment centre or a hospital that can test for HIV and hepatitis B and C. Take old discharge papers if you have them.",
        "NHS can point you to support pages on this website and advocate for clearer national testing policy. The office cannot interpret your personal test results by email.",
      ]),
    ],
  },
  "safer-products": {
    title: "Safer treatment products in Nepal",
    lead: "NHS continues to ask government to fund virus-inactivated factor and reliable testing nationwide — because product choice is a safety decision.",
    photo: "bir",
    photoAlt: "Hospital care and safe blood products in Nepal",
    sections: [
      s("Why product type matters", [
        "Clotting factor concentrates made from pooled human plasma carry infection risk if not properly screened and virus-inactivated. Recombinant products reduce but do not eliminate all risks; no medicine is careless-proof without records.",
        "Cryoprecipitate and fresh frozen plasma play roles in some settings but are not interchangeable with factor VIII concentrate for haemophilia A on demand or prophylaxis.",
      ]),
      s("Humanitarian aid and national supply", [
        "The World Federation of Hemophilia has arranged humanitarian shipments to Nepal including standard and sometimes extended half-life or non-factor products. Shipments change year to year and patient by patient.",
        "Aid fills gaps; it does not replace provincial budgets for sustained pharmacy stock. NHS argues both must exist.",
      ]),
      s("What families should insist on in writing", [
        "Product name, batch number, expiry, storage temperature, and dose for every infusion. If the centre switches brands, ask why and how dose converts.",
        "Keep copies in the folder you carry to every appointment. Those papers matter if you ever need infection testing or switch hospitals.",
      ]),
      s("Advocacy link", [
        "The 11 March 2024 provincial meeting explicitly included the supply question: what provinces fund, not only what posters say.",
        "Send your district supply story to nepalhemo@gmail.com so the next government meeting has evidence from outside Kathmandu.",
      ]),
    ],
  },
  "advocacy-safety": {
    title: "Provincial meeting included the supply question",
    lead: "The 11 March 2024 advocacy meeting linked diagnosis, treatment, and what provinces fund — including which clotting products reach hospital shelves.",
    photo: "president",
    photoAlt: "Provincial advocacy meeting in Kathmandu",
    sections: [
      s("Supply on the same agenda as diagnosis", [
        "Provincial representatives heard that a camp without factor assay capacity sends families home with awareness but no name for their bleeding. Similarly, a diagnosis without safe product on shelf sends families searching informally — a dangerous path.",
        "Clinicians explained virus inactivation, cold chain storage during power cuts, and why batch records protect patients if infection questions arise later.",
      ]),
      s("Travel and cost stories", [
        "Families described overnight buses to Kathmandu, wages lost when a joint bleed keeps a parent from work, and children who stopped sport not because haemophilia forbade it but because nobody gave a school plan.",
        "Those stories are now part of NHS’s provincial file, used with consent in letters to ministries.",
      ]),
      s("The Society’s continuing ask", [
        "Budget lines for assays, virus-inactivated products where possible, physiotherapy, and clinic days that continue monthly — not only on 17 April.",
        "Screened blood donation policy at national level supports every province’s surgery and trauma care, not only haemophilia.",
      ]),
      s("Add your district", [
        "If your province was not represented in the room, your email still counts. Write nepalhemo@gmail.com with the subject “Provincial advocacy”.",
        "Register as a member so the next invitation list includes your district explicitly.",
      ]),
    ],
  },
  "inhibitors-treatment-overview": {
    title: "Treatment types for inhibitors",
    lead: "When the immune system blocks factor replacement, treatment plans change — this page explains options in plain language for Nepal.",
    photo: "vial",
    photoAlt: "Inhibitor treatment options",
    sections: [
      s("What an inhibitor is", [
        "An inhibitor is an antibody that stops infused factor VIII or IX from working properly. It can appear after many infusions or, in some children, in the first months after diagnosis.",
        "Standard factor doses may no longer stop bleeds. Bleeds can become harder to treat and more expensive everywhere in the world, including Nepal.",
      ]),
      s("Bypassing agents and high-dose factor", [
        "Treatment centres may use bypassing agents such as activated prothrombin complex concentrate or recombinant factor VIIa for bleeding when inhibitors are present. Availability in Nepal varies by hospital and humanitarian shipments.",
        "High-dose factor regimens or immune tolerance induction are specialist plans requiring sustained product supply and monitoring — not decisions made at home.",
      ]),
      s("Emicizumab and non-factor paths", [
        "Emicizumab helps some people with haemophilia A, including some with inhibitors. It is not factor VIII and must not be confused with it. Haemophilia B with inhibitors carries different risks; products are not interchangeable.",
        "Only your centre can say whether a named non-factor medicine is on shelf for you this month.",
      ]),
      s("Records and emergency rules", [
        "Carry a card stating inhibitor status, last treatment, and centre phone number. Head injury rules become stricter, not relaxed.",
        "Every infusion or injection should be logged with product name and batch. NHS advocates for inhibitor testing when bleeds stop responding to usual doses.",
      ]),
    ],
  },
  "inhibitors-finding-centres": {
    title: "Treatment centres and inhibitor tests",
    lead: "Where to ask for an inhibitor assay and specialist referral in Nepal — start with NHS and your haemophilia centre.",
    photo: "clinic",
    photoAlt: "Treatment centre for inhibitor testing",
    sections: [
      s("When to suspect an inhibitor", [
        "Bleeds that used to stop with factor now last longer. Ordinary doses seem to do nothing. A child newly diagnosed starts bleeding despite treatment.",
        "Do not double doses at home. Call the treatment centre and ask for an inhibitor test with the next factor level check.",
      ]),
      s("Hospitals in public NHS pathways", [
        "Families are commonly referred to major centres in Kathmandu — including TU Teaching Hospital and Kanti Children’s Hospital — and to services linked through NHS meetings. Phone numbers inside hospitals change; confirm clinic days the same week you travel.",
        "Inhibitor assays are specialist tests. A small district lab may need to send samples. Ask how long results take before you leave home.",
      ]),
      s("What to carry", [
        "All factor assay results, product names already used, bleed diary if you keep one, and letters from previous hospitals.",
        "List dates when treatment seemed to fail. Patterns help specialists choose the next product.",
      ]),
      s("NHS navigation role", [
        "Call 01-5172729 or email nepalhemo@gmail.com. The office does not run inhibitor tests but helps families ask the right hospital the right question.",
        "Register so NHS knows inhibitor patients exist in your province when advocating for product stock.",
      ]),
    ],
  },
  "inhibitors-newly-diagnosed-window": {
    title: "Newly diagnosed and inhibitors",
    lead: "The first months after diagnosis are when many inhibitors appear — close monitoring matters from the start.",
    photo: "hands",
    photoAlt: "Newly diagnosed child monitoring",
    sections: [
      s("Why the first months are critical", [
        "Inhibitors most often develop in the first 50 exposure days to factor concentrate, especially in severe haemophilia A. That window overlaps with the emotional chaos of new diagnosis.",
        "Parents are learning infusion technique while also learning emergency signs. The centre should schedule inhibitor screening as part of early follow-up, not only when crises hit.",
      ]),
      s("What parents should ask at visit one", [
        "When will inhibitor testing happen? What product will we use consistently? What fridge storage plan exists during load-shedding?",
        "What head injury instructions differ from families without inhibitors? Write answers on paper.",
      ]),
      s("Product consistency", [
        "Switching brands casually because one is cheaper on the informal market increases risk. Treatment should stay under one centre’s protocol.",
        "Humanitarian shipments sometimes change brands mid-year. Ask the centre to explain dose conversion in writing when that happens.",
      ]),
      s("Support while you learn", [
        "NHS connects newly diagnosed families to volunteers who remember the first year. You are not failing if you are frightened.",
        "Register and ask about the nearest chapter. Isolation makes every bleed feel catastrophic; community adds context and phone numbers.",
      ]),
    ],
  },
  "women-haemophilia-basics": {
    title: "Haemophilia in women and girls",
    lead: "How haemophilia A and B are inherited, when women bleed, and why carrier is not the same as unaffected.",
    photo: "blood",
    photoAlt: "Women and haemophilia inheritance",
    sections: [
      s("Inheritance in plain language", [
        "Haemophilia A and B are linked to the X chromosome. A woman who carries the gene may have low factor herself or pass the gene to children. Boys who inherit the gene typically have haemophilia; girls may have mild haemophilia or be carriers who still bleed.",
        "Carrier on a lab letter does not mean ‘fine’. It means test the factor level and listen to symptoms.",
      ]),
      s("When women and girls have haemophilia", [
        "Mild haemophilia in women may show as heavy periods, bruising, or bleeding after surgery or childbirth. Moderate haemophilia in girls is less common but real.",
        "Von Willebrand disease is more common in women and is a different disorder with different treatment. Mention heavy bleeding when asking for any clotting test.",
      ]),
      s("Testing pathway in Nepal", [
        "Ask for factor VIII and IX levels plus von Willebrand testing if periods or family history suggest it. Take results to a centre that treats women — not only paediatric boys’ clinics.",
        "NHS can help you ask which hospital runs those tests near you this month.",
      ]),
      s("Pregnancy and planning", [
        "Factor levels change in pregnancy and drop after delivery. Plan with obstetrics and the bleeding-disorder centre before conception if possible.",
        "Newborn boys from haemophilia families need a plan before labour instruments are used. See the pregnancy read page for more detail.",
      ]),
    ],
  },
  "women-day-to-day-living": {
    title: "Day-to-day living for women",
    lead: "School, periods, work, sport, and relationships with a bleeding plan — written, not guessed.",
    photo: "bandage",
    photoAlt: "Day-to-day living for women with bleeding disorders",
    sections: [
      s("Menstrual bleeding", [
        "Periods lasting more than seven days, soaking protection hourly, or causing dizziness deserve testing — not shame. Treatment options depend on factor level and disorder type.",
        "Do not accept ‘all women bleed heavily’ if you cannot attend school or work. A centre familiar with women should review you.",
      ]),
      s("School and university", [
        "Carry a short letter explaining when to call a parent or go to hospital. You do not owe classmates your full genetic history.",
        "Sport choices should be individual: swimming and badminton often fit; contact sport needs centre advice especially if joints already bleed.",
      ]),
      s("Work and disclosure", [
        "Many women choose when to tell an employer. A centre letter can describe needed time off for infusions without listing your entire record.",
        "Jobs with high injury risk need honest conversation with the specialist, not silent suffering.",
      ]),
      s("Dental and surgical care", [
        "Any extraction or procedure needs a plan with factor or other products if indicated. Book dental care before emergencies.",
        "Paracetamol is often preferred for pain; check before taking ibuprofen or aspirin.",
      ]),
    ],
  },
  "women-finding-centres": {
    title: "Centres for women and girls",
    lead: "Ask NHS which centre can test and treat women and girls near you — not every clinic is used to bleeding beyond paediatric boys.",
    photo: "clinic",
    photoAlt: "Treatment centre for women and girls",
    sections: [
      s("Why a women-aware centre matters", [
        "Some haemophilia clinics historically focused on boys. Women with mild haemophilia, carriers with low factor, and girls with heavy periods need the same assay quality and respect.",
        "Obstetric teams must be linked to the bleeding-disorder centre before delivery — not called in after haemorrhage starts.",
      ]),
      s("Starting the search", [
        "Call NHS on 01-5172729 with your district. Ask which hospital currently runs factor assays for women and whether obstetric liaison exists.",
        "Major Kathmandu centres named in NHS materials include TU Teaching Hospital and Kanti Children’s Hospital for family care pathways; confirm current clinic days before travel.",
      ]),
      s("What to ask on first visit", [
        "Will you measure my factor level, not only genetic carrier status? Can you coordinate with a gynaecologist? What product is on shelf for menstrual or postpartum bleeding?",
        "If answers are vague, ask NHS for a second referral option rather than giving up.",
      ]),
      s("Chapters and peer support", [
        "Other women in the Society network may share how they navigated periods and childbirth in Nepal — privately, without social media exposure.",
        "Membership connects you to that network legally and safely through the office.",
      ]),
    ],
  },
  "centres-meet-community": {
    title: "See the Society",
    lead: "Meet the community that keeps the centre list alive — NHS is members, volunteers, and clinicians, not only an office address.",
    photo: "hands",
    photoAlt: "Nepal Hemophilia Society community",
    sections: [
      s("More than a directory", [
        "Treatment centre lists go stale when phone numbers change or clinics move. NHS volunteers update pathways through member feedback from every province.",
        "When you call the office, you reach people who also attend government meetings and World Hemophilia Day — the same team links community and advocacy.",
      ]),
      s("Chapters outside Kathmandu", [
        "Public NHS material references chapters in Bhaktapur, Chitwan, Parsa, Sunsari, and Kaski (Pokhara), plus contacts such as Kailali. Chapters help with travel planning and moral support; infusions still happen in hospitals.",
        "If your district lacks a chapter, say so when you register. New volunteers often start because one family refused isolation.",
      ]),
      s("Events where you meet people", [
        "Health camps, advocacy meetings, and 17 April gatherings are where names become phone numbers. You are not required to speak publicly to belong.",
        "Check the events section of this website or email nepalhemo@gmail.com for the next date near you.",
      ]),
      s("Give back the update", [
        "After each hospital visit, tell NHS if the clinic day or assay availability changed. Your one sentence helps the next family travelling from your district.",
      ]),
    ],
  },
  "centres-newly-diagnosed-steps": {
    title: "Newly diagnosed steps",
    lead: "What to do in the first weeks after a clotting test result — before the first emergency teaches you the hard way.",
    photo: "diagnose",
    photoAlt: "Steps after new diagnosis",
    sections: [
      s("This week", [
        "Photograph the lab report and store the original. Write the diagnosis name exactly as printed.",
        "Call Nepal Hemophilia Society on 01-5172729 and your treatment centre. Register with NHS and ask for the nearest chapter contact.",
      ], [
        "Save centre and NHS numbers in two phones",
        "Ask the doctor for a clinic follow-up date in writing",
        "Do not buy factor from informal sellers",
      ]),
      s("Before school or work restarts", [
        "Get a one-page emergency plan from the centre for teachers or employers. It should describe joint bleeds and head injury rules without unnecessary private detail.",
        "Tell one trusted neighbour or relative the plan if you are often away from the child.",
      ]),
      s("Dental and minor procedures", [
        "Schedule a dental check before pain forces an emergency extraction. Any procedure breaking gum or skin needs centre approval first.",
        "Vaccinations may proceed with plan — ask rather than skipping silently or assuming all vaccines are forbidden.",
      ]),
      s("Emotional reality", [
        "Grief and anger after diagnosis are normal. Meeting another family through NHS often helps more than reading ten websites.",
        "If you are outside Kathmandu, say your district on the first call so staff connect you locally, not only to capital events.",
      ]),
    ],
  },
  "centres-faqs": {
    title: "Questions before you call",
    lead: "Short answers to common questions before you phone the office or travel to a hospital — save time and reduce anxiety.",
    photo: "question",
    photoAlt: "Frequently asked questions",
    sections: [
      s("Does NHS supply factor?", [
        "No. Nepal Hemophilia Society is a patient organisation. Clotting factor is prescribed and dispensed through treatment centres and hospital pharmacies.",
        "NHS advocates for supply and safety; it does not sell medicine from the Anamnagar office.",
      ]),
      s("Can I get a diagnosis by phone?", [
        "No. Diagnosis requires laboratory factor assays. NHS can explain where families ask for tests and how to register after results exist.",
        "Send reports by email only if you are comfortable; in-person file review at the centre is safer for treatment decisions.",
      ]),
      s("What should I bring to a first centre visit?", [
        "All lab reports, list of medicines tried, bleed history notes, growth chart for children, and insurance or referral papers if you have them.",
        "Write questions on paper so nothing is forgotten in a short appointment.",
      ]),
      s("Office hours and emergencies", [
        "NHS office: Sunday to Friday, 9 am to 5 pm, 01-5172729. For active bleeding, head injury, or throat swelling, go to emergency services and your treatment centre first.",
        "Membership questions can wait; bleeds cannot.",
      ]),
    ],
  },
  "newly-diagnosed-understand-condition": {
    title: "Understand the condition",
    lead: "A plain explanation of haemophilia A, B, and related disorders for families who just received a lab result.",
    photo: "genetics",
    photoAlt: "Understanding haemophilia diagnosis",
    sections: [
      s("What haemophilia is", [
        "Haemophilia means clotting factor VIII or IX is lower than normal because of a gene change. Blood still clots, but slower. Internal joint and muscle bleeds are the usual danger, not only cuts on the skin.",
        "Severity — severe, moderate, mild — comes from how much factor is measured, not from how brave the child is.",
      ]),
      s("Not every bleeding disorder is haemophilia", [
        "Von Willebrand disease, factor XI deficiency, platelet disorders, and acquired haemophilia need different tests and treatments. The assay name on your report matters.",
        "Do not assume factor VIII will help if the report says something else.",
      ]),
      s("Inherited versus acquired", [
        "Most childhood haemophilia is inherited. About one in three cases has no family history because the gene change is new.",
        "Acquired haemophilia in older adults is an emergency specialist condition — different pathway entirely.",
      ]),
      s("What happens next", [
        "Treatment centre referral, NHS registration, school plan, and inhibitor monitoring schedule for severe cases.",
        "Read the types, symptoms, and treating a bleed pages on this site for depth, but let the centre personalise numbers to your child.",
      ]),
    ],
  },
  "newly-diagnosed-treatment-options": {
    title: "Treatment after diagnosis",
    lead: "On-demand care, prophylaxis, and what is realistic in Nepal today — expectations grounded in local supply.",
    photo: "prophylaxis",
    photoAlt: "Treatment options after diagnosis",
    sections: [
      s("On-demand treatment", [
        "Factor or another medicine when a bleed starts or before a planned procedure. Dose and product depend on severity and what the pharmacy has this month.",
        "Rest, ice, compression, and elevation help while travelling to care but do not replace factor for significant joint bleeds.",
      ]),
      s("Prophylaxis", [
        "Regular scheduled treatment to prevent bleeds before joints are damaged. Standard of care for severe haemophilia in many countries; access in Nepal is still uneven.",
        "Home infusion is only safe after hands-on training, fridge plan, and written emergency rules.",
      ]),
      s("Non-factor and extended half-life products", [
        "Some patients receive emicizumab or extended half-life factor through humanitarian programmes. Availability changes yearly.",
        "Never switch products because another family uses them. Inhibitor status and allergies matter.",
      ]),
      s("Honest conversations with the centre", [
        "Ask what happens if stock runs out mid-month. Ask how to store during power cuts. Ask dental planning steps now, not when a tooth abscesses.",
        "NHS advocates nationally for wider access; your centre handles individual prescriptions.",
      ]),
    ],
  },
  "newly-diagnosed-find-centre": {
    title: "Find a centre",
    lead: "Hospitals, chapters, and how to confirm a clinic day before you travel — saving a wasted bus fare.",
    photo: "clinic",
    photoAlt: "Finding a haemophilia treatment centre",
    sections: [
      s("Start with NHS", [
        "Call 01-5172729 or email nepalhemo@gmail.com with your district. Staff share which hospitals families use for factor assays and follow-up, updated by member feedback.",
        "Public materials name TU Teaching Hospital, Kanti Children’s Hospital, and other referral paths — always confirm the clinic schedule the same week you travel.",
      ]),
      s("Chapters as navigators", [
        "Chapters in Bhaktapur, Chitwan, Parsa, Sunsari, Kaski, and other contacts help you reach the right hospital door. They do not replace infusion.",
        "If no chapter exists near you, the national office still helps — distance is common, not shameful.",
      ]),
      s("What to confirm before leaving home", [
        "Is the haemophilia or paediatric haematology clinic running this week? Is assay sampling available? Is the doctor who knows factor products on duty?",
        "Bring all prior reports so tests are not duplicated unnecessarily.",
      ]),
      s("After the first visit", [
        "Save the direct desk phone if offered. Register with NHS and report back if information was wrong so the next family benefits.",
      ]),
    ],
  },
  "newly-diagnosed-meet-community": {
    title: "Meet the community",
    lead: "Other families are the reason Nepal Hemophilia Society exists — you are not registering into a empty database.",
    photo: "newsKathmandu",
    photoAlt: "Meeting the hemophilia community",
    sections: [
      s("Why community comes early", [
        "Diagnosis paperwork is cold. Another parent who remembers the first swollen knee often explains more in ten minutes than a stack of brochures.",
        "NHS introduces families when you consent — by phone, at meetings, or through chapter volunteers.",
      ]),
      s("World Hemophilia Day and camps", [
        "17 April and district health camps are the usual first meeting points. You can attend without speaking publicly.",
        "Children seeing other children on factor or in wheelchairs from joint damage learn both hope and seriousness — care matters.",
      ]),
      s("Privacy choices", [
        "You control whether your name appears in advocacy stories or photos. Membership does not require social media exposure.",
        "Many help only by updating centre information quietly after appointments.",
      ]),
      s("How to step in", [
        "Register at the office. Ask for the nearest active member contact. Say if you prefer Nepali or English.",
        "If you are a clinician, offer training days — community includes white coats and parent volunteers equally.",
      ]),
    ],
  },
  "daily-women-and-girls": {
    title: "Women and girls",
    lead: "Periods, pregnancy, carrier testing, and von Willebrand disease — day-to-day topics women ask NHS about.",
    photo: "pregnancy",
    photoAlt: "Women and girls with bleeding disorders",
    sections: [
      s("Bleeding that should be tested", [
        "Heavy periods, bruising with little trauma, bleeding after childbirth or surgery, and family history of haemophilia in males all warrant factor testing in women.",
        "Carrier status alone does not tell you whether you need treatment.",
      ]),
      s("Pregnancy and postpartum", [
        "Plan with obstetrics and the bleeding centre before delivery. Factor levels fall after birth when bleeding risk rises.",
        "Newborn care for boys in haemophilia families needs a written plan before instruments are used.",
      ]),
      s("Von Willebrand disease", [
        "More common than haemophilia in women. Treatment differs; factor VIII alone may be wrong. Ask specifically for von Willebrand workup if periods dominate symptoms.",
      ]),
      s("Support from NHS", [
        "Call 01-5172729 for introductions to women-aware centres and peer contacts. Read the dedicated women pages on this site for depth.",
      ]),
    ],
  },
  "daily-faqs": {
    title: "Sport, vaccines and registration",
    lead: "Frequently asked day-to-day questions answered in plain language for Nepal.",
    photo: "question",
    photoAlt: "Day-to-day FAQs",
    sections: [
      s("Sport and exercise", [
        "Exercise strengthens muscles that protect joints. Swimming and walking are common choices. Contact sport and heavy collision activities need individual centre advice — especially if a target joint already exists.",
        "Sitting out one game beats bleeding into a knee and missing a month of school.",
      ]),
      s("Vaccines", [
        "Most vaccinations proceed with a plan from the centre. Intramuscular injections may need factor cover or alternate sites.",
        "Do not skip all vaccines from fear; ask the centre for a schedule.",
      ]),
      s("Pain medicines", [
        "Paracetamol is often preferred. Ibuprofen, aspirin, and some herbal products can worsen bleeding — check before buying over the counter.",
      ]),
      s("Registration with NHS", [
        "Separate from hospital files. Helps advocacy and events. Call 01-5172729 or email nepalhemo@gmail.com.",
        "You can register as a parent, patient, clinician, or supporter.",
      ]),
    ],
  },
  "daily-our-community": {
    title: "Our community",
    lead: "Chapters, members, and Together For Life across Nepal — you are not the only family figuring this out.",
    photo: "eventCamp",
    photoAlt: "Community across Nepal",
    sections: [
      s("National reach", [
        "Nepal Hemophilia Society registers families from every province even when care concentrates in Kathmandu hospitals.",
        "Chapters shorten the emotional distance; hospitals still deliver factor.",
      ]),
      s("Together For Life", [
        "The Society’s long-standing message: comprehensive care, safe products, and dignity from diagnosis onward. Community events embody that slogan practically — introductions, not speeches only.",
      ]),
      s("How to connect locally", [
        "Register and ask for your nearest chapter or contact person. Attend World Hemophilia Day if travel allows.",
        "If isolated geographically, phone mentorship from another parent may be available through the office.",
      ]),
      s("Giving back", [
        "Update NHS when centre information changes. Volunteer translation or transport if you can.",
        "Membership counts strengthen every government letter.",
      ]),
    ],
  },
  "community-join-membership": {
    title: "Join the Society",
    lead: "Register as a member, parent, clinician, or volunteer — the ordinary way to belong to NHS.",
    photo: "hands",
    photoAlt: "Join Nepal Hemophilia Society",
    sections: [
      s("Membership categories", [
        "People with bleeding disorders, parents, carers, health professionals, and supporters may join. The office explains current fees and forms — not online on this site.",
      ]),
      s("Benefits", [
        "Connection to chapters, event invitations, advocacy updates, and a national voice counted when NHS meets ministers.",
      ]),
      s("How to apply", [
        "Visit Anamnagar office Sunday to Friday 9–5, or email nepalhemo@gmail.com, or call 01-5172729.",
        "Bring diagnosis papers if you have them; lack of papers should not block initial contact.",
      ]),
      s("Clinicians welcome", [
        "Doctors and nurses who treat bleeding disorders strengthen NHS credibility in advocacy. Membership is not endorsement of every society press release — it is partnership for patient safety.",
      ]),
    ],
  },
  "community-events-overview": {
    title: "Events with NHS",
    lead: "World Hemophilia Day, health camps, and advocacy meetings — where community and policy meet.",
    photo: "eventWhd",
    photoAlt: "NHS events overview",
    sections: [
      s("World Hemophilia Day — 17 April", [
        "The flagship awareness day with rallies, media, and hospital programmes nationwide.",
      ]),
      s("Health camps", [
        "District events offering time for questions, physiotherapy advice, and introductions — not emergency infusion.",
      ]),
      s("Advocacy meetings", [
        "Provincial and national meetings like 11 March 2024 where member stories support funding asks.",
      ]),
      s("Stay informed", [
        "Email nepalhemo@gmail.com to join the mailing list. Check the news and events pages on this website.",
        "Offer a venue if your school or hospital wants to host — early planning helps.",
      ]),
    ],
  },
  "community-news-advocacy": {
    title: "News and advocacy",
    lead: "What the Society has been asking government to change — diagnosis funding, safe products, and provincial capacity.",
    photo: "newsProvinces",
    photoAlt: "Advocacy news from NHS",
    sections: [
      s("Provincial investment", [
        "Since the March 2024 meeting, NHS continues asking each province to budget for factor assays, virus-inactivated products, and ongoing clinics.",
      ]),
      s("Blood safety", [
        "International infected-blood inquiry reports reinforce NHS demands for screened donations, batch records, and no informal factor market.",
      ]),
      s("Humanitarian aid reality", [
        "WFH shipments help named patients but do not replace government procurement. News updates track both channels honestly.",
      ]),
      s("Your story in the next headline", [
        "District delays and successes sent to the office become anonymised advocacy evidence. Email nepalhemo@gmail.com with consent to be quoted or keep details private.",
      ]),
    ],
  },
  "fundraising-email-office": {
    title: "Email about fundraising",
    lead: "How to propose a gift, partnership, or collection through the office — coordinated help beats duplicate drives.",
    photo: "fundraising",
    photoAlt: "Fundraising enquiry",
    sections: [
      s("Before you collect money", [
        "Contact NHS first so your effort aligns with society priorities and legal receipt practices.",
        "Explain who you are, your district, and whether you represent a school, company, or informal group.",
      ]),
      s("What fundraising supports", [
        "Society operations, events, advocacy travel, and member support programmes as the office explains annually — not direct factor purchase by individuals through NHS.",
      ]),
      s("How to write the email", [
        "Use nepalhemo@gmail.com with subject “Fundraising enquiry”. Include expected amount, date, and whether you need a letter for your employer or school.",
      ]),
      s("Transparency", [
        "NHS will not lend its name to unverified medical product sales or informal factor schemes. Legitimate fundraising stays separate from clinical supply.",
      ]),
    ],
  },
  "fundraising-join-member": {
    title: "Join as a member",
    lead: "Membership is the ordinary way to belong — fundraising starts with being counted in the community.",
    photo: "hands",
    photoAlt: "Membership and fundraising",
    sections: [
      s("Membership before megaphones", [
        "Many supporters first register as members, then volunteer at events or organise collections with office approval.",
      ]),
      s("Why belong", [
        "Strengthens advocacy numbers, connects you to families, and keeps you informed where help is needed after disasters or supply gaps.",
      ]),
      s("Sign up", [
        "Phone 01-5172729 or email nepalhemo@gmail.com. Visit Anamnagar Sunday–Friday 9–5 if you prefer paper forms.",
      ]),
      s("Combine with campaigning", [
        "Read the Campaign with us page for district story submissions alongside membership.",
      ]),
    ],
  },
  "fundraising-attend-event": {
    title: "Come to an event",
    lead: "Awareness days are where new supporters meet families face to face — before writing cheques or volunteering.",
    photo: "eventAdvocacy",
    photoAlt: "Attending NHS event",
    sections: [
      s("Why attend first", [
        "Understanding bleeds, factor supply, and travel barriers makes fundraising respectful rather than pity-based.",
      ]),
      s("World Hemophilia Day", [
        "17 April is the easiest entry point nationwide. Contact the office to find the nearest programme.",
      ]),
      s("Health camps and meetings", [
        "Smaller settings allow longer conversations with parents and clinicians.",
      ]),
      s("After the event", [
        "Ask the office how to help next — membership, venue offer, or structured fundraising letter.",
      ]),
    ],
  },
  "events-offer-venue": {
    title: "Offer a venue",
    lead: "Tell the office about a hall, campus, or clinic day for an event — logistics make awareness possible outside Kathmandu.",
    photo: "eventAdvocacy",
    photoAlt: "Venue for NHS event",
    sections: [
      s("What makes a good venue", [
        "Accessible by public transport, space for seated talks, privacy for medical questions, and nearby hospital contact for emergencies — not factor on site.",
      ]),
      s("Information to send", [
        "Address, date options, expected audience size, local hospital partner if any, and your phone number.",
        "Email nepalhemo@gmail.com with subject “Event enquiry”.",
      ]),
      s("Schools and colleges", [
        "Student health clubs often host 17 April programmes. Early booking gets materials from the national office.",
      ]),
      s("Follow-through", [
        "NHS coordinates speakers when available. Local organisers handle permissions and seating — shared work.",
      ]),
    ],
  },
  "events-read-advocacy-news": {
    title: "Read advocacy news",
    lead: "What recent meetings asked government to fund — context before you write your own district paragraph.",
    photo: "newsWhd",
    photoAlt: "Advocacy news",
    sections: [
      s("March 2024 provincial meeting", [
        "Investment in diagnosis, virus-inactivated products, and clinics beyond one-day camps.",
      ]),
      s("Blood safety thread", [
        "Links to international inquiry lessons and Nepal’s need for batch records.",
      ]),
      s("Ongoing asks", [
        "Assays in each province, physiotherapy access, dental planning protocols, and inhibitor testing capacity.",
      ]),
      s("Continue reading", [
        "Visit the news section on this website for updates. Then email your story to strengthen the next meeting.",
      ]),
    ],
  },
  "news-inquiry-blood-safety": {
    title: "Inquiry and blood safety",
    lead: "What the international infected-blood scandal means for products used in Nepal today.",
    photo: "inhibitor",
    photoAlt: "Blood safety and inquiry",
    sections: [
      s("Historical lesson", [
        "Pooled plasma products without adequate virus inactivation infected thousands globally. Inquiry reports document institutional failure to switch to safer options and to warn patients.",
      ]),
      s("Nepal’s position", [
        "Modern concentrates and recombinant products reduce many risks when properly stored and recorded. Informal factor sales and missing batch logs recreate old dangers in new forms.",
      ]),
      s("NHS response", [
        "Publish updates, demand national screening policy, and support families seeking testing if they worry about past products.",
      ]),
      s("Personal action", [
        "Request hospital records. Test through official pathways. Avoid social media diagnosis.",
      ]),
    ],
  },
  "news-all-events": {
    title: "All events",
    lead: "Camps, advocacy days, and 17 April on the events calendar — how to stay in the loop.",
    photo: "eventWhd",
    photoAlt: "All NHS events",
    sections: [
      s("Event types", [
        "World Hemophilia Day, provincial advocacy meetings, community health camps, and membership gatherings.",
      ]),
      s("Finding dates", [
        "Check this website’s events categories page. Email nepalhemo@gmail.com to be notified when new dates are fixed.",
      ]),
      s("Hosting locally", [
        "Offer a venue or hospital partnership — national office supports materials when calendars allow.",
      ]),
      s("After you attend", [
        "Register if new. Send one sentence on what your district still needs — advocacy uses event momentum.",
      ]),
    ],
  },
  "inquiry-inquiry-news-updates": {
    title: "Inquiry news updates",
    lead: "Blood-safety updates NHS wants families to read — international context, local action.",
    photo: "diagnose",
    photoAlt: "Inquiry news updates",
    sections: [
      s("Why a UK inquiry matters here", [
        "Factor concentrate policies in rich countries shaped global manufacturing. When inquiries expose harm, low-income countries can demand better imports and records before tragedy.",
      ]),
      s("What NHS publishes", [
        "Summaries, links to official reports, and plain-language lessons — not legal advice on foreign compensation schemes.",
      ]),
      s("Watch this space", [
        "New inquiry publications and WFH safety statements appear on the news section when relevant to Nepal.",
      ]),
      s("Worried patients", [
        "See the support page for testing pathways through Nepali hospitals.",
      ]),
    ],
  },
  "inquiry-advocacy-government": {
    title: "Advocacy with government",
    lead: "How parliamentary advocacy abroad compares with NHS work in Nepal — same safety principles, different budget levers.",
    photo: "newsProvinces",
    photoAlt: "Government advocacy",
    sections: [
      s("UK All-Party Parliamentary Group context", [
        "British MPs have examined infected blood alongside patient groups. NHS learns from their questions but speaks to provincial ministers and the Ministry of Health and Population here.",
      ]),
      s("Nepal levers", [
        "Provincial health budgets, national blood policy, drug procurement, and hospital pharmacy stocking lists.",
      ]),
      s("Member role", [
        "Registration, district stories, and World Hemophilia Day visibility give officials something to respond to.",
      ]),
      s("Write in", [
        "Email nepalhemo@gmail.com subject “Advocacy” with your province and one concrete gap in care.",
      ]),
    ],
  },
  "inquiry-support-worried": {
    title: "Support if you are worried",
    lead: "Testing and who to call in Nepal if you fear infection from a past blood product — practical steps, not panic.",
    photo: "hands",
    photoAlt: "Support for worried families",
    sections: [
      s("First steps", [
        "Gather discharge papers listing product names and dates if possible. Visit your treatment centre or a hospital laboratory that tests for HIV and hepatitis B and C.",
      ]),
      s("What NHS can do", [
        "Explain general pathways, advocate for clearer national testing policy, and connect you to peer support — not interpret individual results by email.",
      ]),
      s("What to avoid", [
        "Informal retesting kits without counselling. Buying factor from unverified sellers. Public posts with batch numbers.",
      ]),
      s("Emergency distinction", [
        "Active bleeding or head injury still goes to emergency first. Infection worries are serious but rarely the same-hour emergency unless acute illness is present.",
      ]),
    ],
  },
  "appg-write-to-nhs": {
    title: "Write to NHS",
    lead: "Share a district story for the next government meeting — one honest paragraph can change a budget line.",
    photo: "eventAdvocacy",
    photoAlt: "Write to NHS for advocacy",
    sections: [
      s("What to include", [
        "Your province or district, distance to nearest assay, product used last if known, what failed — not only what succeeded — and whether NHS may quote you by first name or anonymously.",
      ]),
      s("How to send", [
        "Email nepalhemo@gmail.com with subject “Advocacy”. Post is slow; email reaches the advocacy file faster.",
      ]),
      s("Safety", [
        "Do not attach national ID numbers or full medical records unless staff request them through a secure channel.",
      ]),
      s("After you write", [
        "Staff may call to confirm details before ministers see your story. That call is normal, not suspicion.",
      ]),
    ],
  },
  "appg-inquiry-background": {
    title: "Inquiry background",
    lead: "Why blood safety is part of NHS advocacy demands — from international reports to Nepali pharmacy shelves.",
    photo: "inhibitor",
    photoAlt: "Inquiry background",
    sections: [
      s("Concentrate era", [
        "Factor concentrates revolutionised haemophilia care and, when poorly made or tracked, created mass infection tragedies.",
      ]),
      s("Lessons applied here", [
        "Screen donors, virus-inactivate plasma products, use recombinant when procurement allows, record every batch, ban informal sales.",
      ]),
      s("NHS position", [
        "Support families seeking testing. Demand government systems, not only charity shipments.",
      ]),
      s("Read more", [
        "UK report summary page and safer products page on this site.",
      ]),
    ],
  },
  "appg-join-advocacy": {
    title: "Join advocacy",
    lead: "Members give NHS authority when speaking to government — numbers and names with consent.",
    photo: "fundraising",
    photoAlt: "Join advocacy",
    sections: [
      s("Why join", [
        "Empty registers weaken letters to ministers. Membership shows a province has organised patients, not isolated families.",
      ]),
      s("Beyond membership", [
        "Submit district stories, attend World Hemophilia Day, introduce NHS to local media or MPs’ local offices when visits happen.",
      ]),
      s("Clinicians", [
        "Your voice on protocol gaps lends medical weight — coordinated through the office.",
      ]),
      s("Start", [
        "Register at 01-5172729 then email subject “Advocacy”.",
      ]),
    ],
  },
  "pub-haemophilia-plain": {
    title: "Haemophilia in plain language",
    lead: "Types, inheritance, symptoms, and diagnosis for families — a publication-style overview for Nepal.",
    photo: "genetics",
    photoAlt: "Plain language haemophilia guide",
    sections: [
      s("Types A and B", [
        "Low factor VIII or IX on a measured assay, with severity guiding treatment intensity.",
      ]),
      s("Inheritance", [
        "X-linked pattern most common; new mutations without family history happen.",
      ]),
      s("Symptoms", [
        "Joint and muscle bleeds, prolonged bleeding after procedures, heavy periods in women with mild haemophilia or carriers who bleed.",
      ]),
      s("Diagnosis and next steps", [
        "Factor assay at a capable lab, referral to treatment centre, NHS registration, school plan, inhibitor monitoring when severe.",
        "Use the dedicated read pages on each topic for more depth.",
      ]),
    ],
  },
  "pub-treatment-types-nepal": {
    title: "Treatment types in Nepal",
    lead: "Prophylaxis, non-factor therapy, extended half-life factor, and cryoprecipitate — with supply limits explained honestly.",
    photo: "prophylaxis",
    photoAlt: "Treatment types publication",
    sections: [
      s("On-demand and prophylaxis", [
        "Both depend on product on shelf. Prophylaxis prevents joint damage when sustainable.",
      ]),
      s("Non-factor therapies", [
        "Emicizumab for some haemophilia A patients including some with inhibitors — check centre stock monthly.",
      ]),
      s("Extended half-life factor", [
        "Fewer infusions possible for some; still replacement therapy with storage rules.",
      ]),
      s("Nepal reality", [
        "Humanitarian aid plus government procurement determine what is possible. Ask the centre; advocate through NHS when gaps persist.",
      ]),
    ],
  },
  "pub-newly-diagnosed-checklist": {
    title: "Newly diagnosed checklist",
    lead: "A first-week list after a clotting disorder diagnosis — print mentally and act step by step.",
    photo: "diagnose",
    photoAlt: "Newly diagnosed checklist",
    sections: [
      s("Day one to three", [
        "Secure lab report copies. Call treatment centre and NHS. Stop aspirin and ibuprofen unless centre approves.",
      ], [
        "Photograph report — do not post publicly",
        "Save emergency numbers",
        "Ask school for meeting once plan exists",
      ]),
      s("Week one", [
        "Register with NHS. Ask inhibitor testing schedule if severe haemophilia. Book dental review.",
      ]),
      s("Week two", [
        "Visit centre with questions written. Meet chapter contact if available. Fridge plan for factor if prescribed.",
      ]),
      s("Ongoing", [
        "Bleed diary optional but useful. Update NHS if hospital information changes.",
      ]),
    ],
  },
  "pub-day-to-day": {
    title: "Day-to-day living guide",
    lead: "School, teeth, travel, and work with a bleeding disorder in Nepal — practical habits.",
    photo: "bandage",
    photoAlt: "Day-to-day living guide",
    sections: [
      s("School and work", [
        "Written plans, specific sport limits, paracetamol for pain after centre approval.",
      ]),
      s("Dental", [
        "Plan before emergencies. Centre coordinates factor if needed.",
      ]),
      s("Travel", [
        "Carry reports, factor if prescribed, centre phone number, know hospital on route.",
      ]),
      s("Festivals and physical work", [
        "Rest swollen joints even during celebrations. Adults in manual jobs need ergonomic honesty with the centre.",
      ]),
    ],
  },
  "pub-women-and-girls": {
    title: "Women and girls guide",
    lead: "Periods, pregnancy, carrier testing, and von Willebrand disease — publication overview.",
    photo: "pregnancy",
    photoAlt: "Women and girls guide",
    sections: [
      s("Testing", [
        "Factor levels in women, not only carrier genetics. Von Willebrand workup when periods dominate.",
      ]),
      s("Menstrual care", [
        "Treat heavy bleeding as medical, not normal suffering.",
      ]),
      s("Pregnancy", [
        "Joint obstetric and bleeding-centre plan before delivery.",
      ]),
      s("Support", [
        "NHS introductions to women-aware centres and peers at 01-5172729.",
      ]),
    ],
  },
  "pub-wfh-guidelines": {
    title: "WFH Guidelines",
    lead: "The international clinical reference — how NHS uses it while advocating for Nepal-specific access.",
    photo: "speaker",
    photoAlt: "WFH guidelines",
    sections: [
      s("What the guidelines are", [
        "The World Federation of Hemophilia publishes evidence-based recommendations for diagnosis, treatment, and comprehensive care updated across editions.",
      ]),
      s("Nepal application", [
        "Guidelines describe ideal care; local supply and assays determine what is possible this month. Centres adapt with WFH tools where stock allows.",
      ]),
      s("Humanitarian link", [
        "WFH aid programmes reference the same standards when shipping donated product.",
      ]),
      s("Official source", [
        "Use the link below to open WFH directly for PDFs and updates — not unofficial translations alone.",
      ]),
    ],
  },
  "video-wfh-youtube": {
    title: "WFH on YouTube",
    lead: "Talks and explainers from the World Federation of Hemophilia — watch from the official channel.",
    photo: "speaker",
    photoAlt: "WFH YouTube channel",
    sections: [
      s("Why video helps", [
        "Visual explanations of infusion, inhibitors, and women’s bleeding disorders complement NHS text pages.",
      ]),
      s("Source matters", [
        "Prefer WFH’s official YouTube channel so guidance is not mixed with unverified home remedies.",
      ]),
      s("Nepal context", [
        "Products shown in videos may not be on Nepali shelves. Always map back to your centre’s stock list.",
      ]),
      s("Watch next", [
        "Use the link below, then read the Nepal treatment types page on this site.",
      ]),
    ],
  },
  "video-wfh-whd": {
    title: "World Hemophilia Day films",
    lead: "Annual campaign films and posters from WFH — global visuals, local action in Nepal.",
    photo: "eventWhd",
    photoAlt: "World Hemophilia Day films",
    sections: [
      s("Global campaign materials", [
        "Each year WFH releases themes, posters, and short films for 17 April.",
      ]),
      s("Using them in Nepal", [
        "Contact NHS before printing so translations and local phone numbers appear alongside international branding.",
      ]),
      s("Beyond posters", [
        "Pair films with assay and treatment asks — awareness alone does not clot blood.",
      ]),
      s("Official page", [
        "Open WFH World Hemophilia Day site via the link below for downloads.",
      ]),
    ],
  },
  "video-read-haemophilia-nepal": {
    title: "Read for Nepal",
    lead: "The same topics as international videos, written for families in Nepal on the haemophilia section.",
    photo: "genetics",
    photoAlt: "Read haemophilia content for Nepal",
    sections: [
      s("Why read locally", [
        "NHS pages name Nepali hospitals, travel realities, and supply limits WFH videos cannot cover.",
      ]),
      s("Topics mirrored", [
        "Types, causes, symptoms, diagnosis, treating bleeds, pregnancy, treatment options.",
      ]),
      s("Language", [
        "English on this site; office can point to Nepali materials when available at events.",
      ]),
      s("Continue", [
        "Use the link below to open the full haemophilia overview page.",
      ]),
    ],
  },
  "guide-wfh-treatment": {
    title: "WFH treatment guidelines",
    lead: "Official treatment guidance from the World Federation of Hemophilia — the reference clinicians cite.",
    photo: "vial",
    photoAlt: "WFH treatment guidelines",
    sections: [
      s("Content overview", [
        "Dosing principles, inhibitor management, surgery planning, and comprehensive care models.",
      ]),
      s("For patients", [
        "You do not need to read every page — ask your centre which sections apply to you.",
      ]),
      s("Advocacy use", [
        "NHS cites guidelines when asking government to fund prophylaxis and assays.",
      ]),
      s("Open official site", [
        "Link below goes to WFH — verify edition date when discussing with doctors.",
      ]),
    ],
  },
  "guide-treatment-nepal": {
    title: "Treatment types in Nepal",
    lead: "How local supply affects prophylaxis and newer products — guide for families comparing options.",
    photo: "prophylaxis",
    photoAlt: "Treatment guide Nepal",
    sections: [
      s("Standard care", [
        "On-demand factor remains baseline when prophylaxis is not yet funded or stocked.",
      ]),
      s("Newer products", [
        "Extended half-life and non-factor therapies appear through humanitarian channels selectively.",
      ]),
      s("Questions for the centre", [
        "Product name, schedule, fridge backup, inhibitor plan, dental protocol.",
      ]),
      s("When stock fails", [
        "Tell NHS anonymously in advocacy emails — patterns drive national asks.",
      ]),
    ],
  },
  "guide-external-resources": {
    title: "External resources",
    lead: "CDC, WHO blood safety, and Ministry of Health links — what each offers Nepali readers.",
    photo: "question",
    photoAlt: "External resources guide",
    sections: [
      s("WHO blood products", [
        "Global standards for donation screening and plasma product quality.",
      ]),
      s("CDC hemophilia pages", [
        "Clear public English on joints, inhibitors, and living with haemophilia.",
      ]),
      s("Ministry of Health and Population", [
        "National policy context for NHS advocacy letters.",
      ]),
      s("Use wisely", [
        "International sites supplement — not replace — your Nepali treatment centre.",
        "See the full external resources section via the link below.",
      ]),
    ],
  },
  "ext-wfh": {
    title: "World Federation of Hemophilia",
    lead: "NHS membership, guidelines, humanitarian aid, and World Hemophilia Day — WFH is the global patient federation.",
    photo: "speaker",
    photoAlt: "World Federation of Hemophilia",
    sections: [
      s("Who WFH is", [
        "International non-profit supporting national patient organisations in diagnosis, treatment, and policy.",
      ]),
      s("Nepal link", [
        "NHS is a national member organisation participating in global days and aid discussions.",
      ]),
      s("What you find on wfh.org", [
        "Guidelines, education, humanitarian programme information, and campaign materials.",
      ]),
      s("Visit", [
        "Open the official site via the link below.",
      ]),
    ],
  },
  "ext-wfh-aid": {
    title: "WFH humanitarian aid",
    lead: "How donated treatment is governed and what reaches Nepal — year by year, patient by patient.",
    photo: "vial",
    photoAlt: "WFH humanitarian aid",
    sections: [
      s("Programme aim", [
        "Supply factor and sometimes non-factor products where national systems cannot yet cover everyone.",
      ]),
      s("Governance", [
        "Hospitals and patient organisations document need; WFH coordinates donations with manufacturers.",
      ]),
      s("Nepal experience", [
        "Shipments have included standard and newer products but change annually — never assume continuity without centre confirmation.",
      ]),
      s("Official page", [
        "Link below describes humanitarian aid principles on WFH site.",
      ]),
    ],
  },
  "ext-nfdn": {
    title: "National Federation of the Disabled Nepal",
    lead: "Disability rights and NHS membership in the wider Nepali movement — bleeding disorders inside disability advocacy.",
    photo: "members",
    photoAlt: "NFDN Nepal",
    sections: [
      s("NFDN role", [
        "Umbrella organisation advocating for disabled people’s rights, access, and policy in Nepal.",
      ]),
      s("NHS connection", [
        "Membership links haemophilia advocacy to broader disability coalitions for education and employment access.",
      ]),
      s("Joint issues", [
        "School inclusion, workplace reasonable adjustment, and health financing overlap both missions.",
      ]),
      s("Visit", [
        "Open NFDN site via link below for their programmes.",
      ]),
    ],
  },
  "ext-mohp": {
    title: "Ministry of Health and Population",
    lead: "The ministry NHS advocates to for diagnosis and treatment funding — national policy lever.",
    photo: "advocacy",
    photoAlt: "Ministry of Health Nepal",
    sections: [
      s("Relevance", [
        "Blood policy, essential medicines lists, and referral hospital funding flow through national ministry structures.",
      ]),
      s("Provincial interface", [
        "Provinces implement much delivery; ministry sets frames NHS also engages at provincial level.",
      ]),
      s("Public information", [
        "Official notices and health programmes appear on mohp.gov.np.",
      ]),
      s("Advocacy", [
        "Member stories reach ministers through NHS — not by spamming ministry inboxes individually without coordination.",
      ]),
    ],
  },
  "ext-who-blood": {
    title: "WHO blood products",
    lead: "Why screened donations and safe plasma products matter — global frame for Nepal’s blood policy.",
    photo: "blood",
    photoAlt: "WHO blood products",
    sections: [
      s("WHO standards", [
        "Guidance on donor selection, testing, component preparation, and plasma derivative quality.",
      ]),
      s("Nepal application", [
        "NHS cites WHO when arguing against informal factor markets and for national screening capacity.",
      ]),
      s("Patient takeaway", [
        "Ask hospitals whether blood and plasma products follow national protocols aligned with WHO frameworks.",
      ]),
      s("Read official topic", [
        "Link below opens WHO blood products health topic.",
      ]),
    ],
  },
  "ext-cdc-hemophilia": {
    title: "CDC hemophilia information",
    lead: "A clear public explanation of hemophilia and joint health from the U.S. Centers for Disease Control and Prevention.",
    photo: "bandage",
    photoAlt: "CDC hemophilia information",
    sections: [
      s("CDC content", [
        "Patient-friendly pages on symptoms, treatment, inhibitors, and living well — in American English.",
      ]),
      s("Mapping to Nepal", [
        "Medical concepts transfer; product names and hospital pathways differ. Use CDC for learning, centre for doing.",
      ]),
      s("Joint health emphasis", [
        "Particularly useful for understanding target joints and physiotherapy rationale.",
      ]),
      s("Official link", [
        "Open CDC hemophilia pages via link below.",
      ]),
    ],
  },
  "ext-uk-inquiry": {
    title: "UK Infected Blood Inquiry",
    lead: "Official site for the report and evidence — context for Nepal’s safety demands, not a local legal process.",
    photo: "speaker",
    photoAlt: "UK Infected Blood Inquiry",
    sections: [
      s("Scope", [
        "Examined infection of thousands through NHS blood and blood products in the UK, especially haemophilia community harm.",
      ]),
      s("Final report May 2024", [
        "Documented systemic failure and recommended accountability and support — processes ongoing in UK courts and parliament.",
      ]),
      s("Nepali readers", [
        "Use inquiry facts to demand records and safe products here — do not expect UK compensation automatically.",
      ]),
      s("Official documents", [
        "Link below is the authoritative source.",
      ]),
    ],
  },
  "ext-support-worried": {
    title: "Support if you are worried",
    lead: "Testing pathways and who to call in Nepal if past blood products cause fear — linked from external resources.",
    photo: "hands",
    photoAlt: "External support page",
    sections: [
      s("Start at hospital", [
        "Treatment centre or licensed lab for HIV and hepatitis B and C testing with counselling.",
      ]),
      s("NHS role", [
        "Navigation, peer support, policy advocacy — not laboratory analysis by email.",
      ]),
      s("Full section", [
        "This site’s public inquiry support page has longer detail — use link below.",
      ]),
      s("Emergency reminder", [
        "Active bleeding still requires emergency care first.",
      ]),
    ],
  },
};
