import type { CardImage } from "@/assets/cards";

export type Photo = "advocacy" | "president" | "members" | "speaker" | "camp" | "table" | "group" | "rally" | "bir";
export type Tone = "primary" | "magenta" | "sky" | "orange" | "gold";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; id?: string; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "note"; text: string }
  | { kind: "cards"; items: { title: string; text: string; href: string; tone: Tone; image: CardImage }[] }
  | { kind: "links"; items: { title: string; text: string; href: string }[] }
  | { kind: "faq"; items: { q: string; a: string }[] }
  | { kind: "articles"; items: { id: string; date: string; title: string; paragraphs: string[]; photo: Photo }[] }
  | { kind: "form"; intent: "join" | "message" };

export type PageDoc = {
  title: string;
  description: string;
  crumbs: { label: string; href?: string }[];
  photo: Photo;
  photoAlt: string;
  lead: string;
  blocks: Block[];
};

const disclaimer =
  "This page is general information from Nepal Hemophilia Society. It is not a diagnosis or a treatment plan. A bleed, a head injury, or bleeding after an accident needs urgent hospital care. Ask your treatment centre before you change any treatment.";

const home = { label: "Home", href: "/" };
const disorders = { label: "Bleeding disorders", href: "/bleeding-disorders/haemophilia" };
const support = { label: "Support", href: "/support/newly-diagnosed" };
const involved = { label: "Get involved", href: "/get-involved/join" };
const resources = { label: "Resources", href: "/resources/publications" };
const inquiry = { label: "Public inquiry", href: "/public-inquiry/the-infected-blood-inquiry" };

export const pages: Record<string, PageDoc> = {
  "/bleeding-disorders/haemophilia": {
    title: "Haemophilia",
    description: "What haemophilia is, how it is inherited, and how care works for families in Nepal.",
    crumbs: [home, disorders, { label: "Haemophilia" }],
    photo: "rally",
    photoAlt: "Nepal Hemophilia Society members marking World Hemophilia Day 2023 in Kathmandu",
    lead: "Haemophilia is a lifelong bleeding disorder. A clotting factor is partly or completely missing, so bleeding lasts longer than it should. With the right diagnosis and care, people in Nepal live, study and work.",
    blocks: [
      { kind: "p", text: "Most bleeding is inside the body. Joints and muscles are the usual places. A joint that is warm, swollen or hard to move may be bleeding, even when you cannot see blood. Nosebleeds, heavy periods, and long bleeding after a cut, tooth extraction or surgery also happen." },
      { kind: "p", text: "Haemophilia A means factor VIII is low. Haemophilia B, sometimes called Christmas disease, means factor IX is low. Both are usually passed through families on the X chromosome, so they are more often diagnosed in boys. Girls and women can have haemophilia too, and some bleed enough to need treatment." },
      { kind: "p", text: "A new diagnosis is a shock. Parents often feel alone, especially when the nearest clotting test is far from home. Nepal Hemophilia Society was started in 1992 so families would have a place to ask questions, register, and push for care. The Society’s vision is comprehensive care of haemophilia, so people can live with dignity." },
      { kind: "p", text: "Treatment in Nepal is still uneven. Some families reach a centre that can test factor levels and give clotting factor. Others are still treated late, or with products the centre would rather replace with virus-inactivated concentrate. Prophylaxis — regular treatment to prevent bleeds — is not yet available to everyone. NHS advocates for it with the Ministry of Health and Population and with provincial governments." },
      { kind: "h2", id: "types", text: "Types" },
      { kind: "p", text: "Severe haemophilia usually shows up in the first years of life, often when a child starts to crawl. Moderate and mild haemophilia may be found later, after an injury, dental work or surgery. The label comes from how much factor is measured in the blood, and the centre uses that result to plan care." },
      { kind: "h2", id: "causes", text: "Causes" },
      { kind: "p", text: "In inherited haemophilia A or B, a change in the factor VIII or factor IX gene means the body does not make enough working factor. A parent can carry the gene without knowing. About one in three children with haemophilia has no known family history, because the gene change is new." },
      { kind: "h2", id: "symptoms", text: "Symptoms" },
      { kind: "ul", items: [
        "Bruises that are large or appear with little cause",
        "Bleeding that continues after a small cut, injection or tooth extraction",
        "A joint that swells, feels warm, or will not straighten",
        "A muscle that becomes painful, tight or swollen",
        "Blood in urine or stool, or a bleed that follows a bump to the head",
        "In women and girls: heavy periods, or bleeding after childbirth",
      ] },
      { kind: "h2", id: "diagnosing", text: "Diagnosing" },
      { kind: "p", text: "A complete blood count and the usual clotting times are not enough. Diagnosis needs a factor VIII or factor IX assay, and sometimes tests for von Willebrand disease or other factors. NHS can help a family ask where that test is done. If you already have a result, take it to a treatment centre rather than starting treatment on your own." },
      { kind: "h2", id: "factor-xi", text: "Factor XI deficiency" },
      { kind: "p", text: "Factor XI deficiency is sometimes called haemophilia C. It is not haemophilia A or B. The clotting reaction stops too early. Bleeding is less predictable: some people bleed after surgery or dental work and rarely have joint bleeds. It is uncommon worldwide, and a factor assay is how it is confirmed. Care is planned by the centre. Do not assume a factor VIII product will help." },
      { kind: "h2", id: "acquired", text: "Acquired haemophilia" },
      { kind: "p", text: "Acquired haemophilia is not inherited. The immune system makes an antibody, usually against factor VIII. It can appear in older adults, and sometimes late in pregnancy or after birth. Both men and women are affected. Bleeding into skin and muscles, and bleeding after a procedure, are typical. This is an emergency for a specialist. Diagnosis needs a low factor level plus an inhibitor test. Treatment aims to stop the bleeding and to calm the immune system. What is stocked in Nepal varies, and the centre decides." },
      { kind: "cards", items: [
        { title: "Types", text: "A, B, factor XI deficiency and acquired haemophilia are not the same condition.", href: "#types", tone: "primary", image: "blood" },
        { title: "Causes", text: "Most inherited haemophilia is passed through the family. Some gene changes are new.", href: "#causes", tone: "magenta", image: "genetics" },
        { title: "Symptoms", text: "Joint and muscle bleeds matter even when no blood is visible.", href: "#symptoms", tone: "sky", image: "bandage" },
        { title: "Diagnosing", text: "A factor assay is the test that names the disorder.", href: "#diagnosing", tone: "orange", image: "diagnose" },
        { title: "Treating a bleed", text: "Treatment depends on the missing factor and on what the centre can supply.", href: "/bleeding-disorders/treatment-types", tone: "gold", image: "vial" },
        { title: "Pregnancy", text: "Women and girls can bleed, and pregnancy needs a plan.", href: "/bleeding-disorders/women-with-bleeding-disorders", tone: "primary", image: "pregnancy" },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/bleeding-disorders/treatment-types": {
    title: "Treatment types",
    description: "How bleeds are treated in Nepal, and which options depend on supply at the treatment centre.",
    crumbs: [home, disorders, { label: "Treatment types" }],
    photo: "president",
    photoAlt: "Nepal Hemophilia Society president speaking at a Kathmandu meeting",
    lead: "The right treatment depends on the bleeding disorder, how severe it is, and what the centre has in stock. Treatment does not yet cure haemophilia. It stops bleeds, limits joint damage, and lets people recover.",
    blocks: [
      { kind: "p", text: "For haemophilia A the missing protein is factor VIII. For haemophilia B it is factor IX. Giving the missing factor is called replacement. Some people are treated only when a bleed starts. That is on-demand treatment. Others take treatment on a schedule to prevent bleeds. That is prophylaxis." },
      { kind: "p", text: "In Nepal, prophylaxis is the goal NHS argues for. It is not yet routine for every child. Families should ask their centre what is possible this month, and should not buy clotting products from an unknown seller. Unsafe plasma and cryoprecipitate can carry infections. Virus-inactivated concentrates, when the centre has them, are the safer replacement products." },
      { kind: "cards", items: [
        { title: "Prophylaxis", text: "Regular treatment to stop bleeds before they start.", href: "#prophylaxis", tone: "primary", image: "prophylaxis" },
        { title: "Non-factor therapies", text: "Newer medicines that help clotting without replacing the missing factor.", href: "#non-factor", tone: "magenta", image: "nonFactor" },
        { title: "Extended half-life factor", text: "Factor products designed to last longer in the body.", href: "#half-life", tone: "sky", image: "halfLife" },
      ] },
      { kind: "h2", id: "prophylaxis", text: "Prophylaxis" },
      { kind: "p", text: "Prophylaxis means factor, or another prescribed treatment, is given on a regular schedule even when the person feels well. The aim is fewer joint bleeds and fewer days lost from school or work. A physiotherapist still matters: strong muscles protect joints that have already bled." },
      { kind: "p", text: "A centre chooses the dose and the days. Home treatment is only safe after the family has been taught how to infuse, how to store the product, and when to go to hospital. Head injury, neck swelling, belly pain, or a bleed that does not settle needs urgent care, even if a dose was just given." },
      { kind: "h2", id: "non-factor", text: "Non-factor replacement therapies" },
      { kind: "p", text: "Non-factor therapies help the blood clot without infusing the missing factor. Emicizumab is the best known example for haemophilia A, including some people with inhibitors. These medicines are used in many countries. They are not a product you should assume is on the shelf in every Nepali hospital." },
      { kind: "p", text: "The World Federation of Hemophilia has reported that humanitarian aid, including some non-factor treatment, has reached patients in Nepal. Shipments change from year to year. Only the treatment centre can say whether a named medicine is available, and for whom. NHS does not supply prescriptions through this website." },
      { kind: "h2", id: "half-life", text: "Extended half-life factor concentrates" },
      { kind: "p", text: "Extended half-life, sometimes called enhanced half-life, factor concentrates stay in the blood longer than standard factor VIII or IX. Some people need fewer infusions. They are still factor replacement. They are not a cure, and they are not automatically stocked in Nepal." },
      { kind: "p", text: "Standard half-life concentrates remain the products many centres know best. If a new product arrives, the centre should explain the dose, the storage rules, and whether it is suitable for someone who has an inhibitor." },
      { kind: "h2", text: "Other care that belongs with treatment" },
      { kind: "ul", items: [
        "Rest, ice, compression and elevation can ease a joint while you reach care. They do not replace factor.",
        "Medicines that make bleeding worse, including aspirin and some painkillers, should be checked with the centre.",
        "Dental work and surgery need a written plan before the day of the procedure.",
        "Physiotherapy after a bleed protects the joint.",
        "Vaccination and ordinary childhood care should continue, with pressure after an injection.",
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/bleeding-disorders/inhibitors": {
    title: "Inhibitors",
    description: "What an inhibitor is, why bleeding becomes harder to treat, and what to ask the centre in Nepal.",
    crumbs: [home, disorders, { label: "Inhibitors" }],
    photo: "speaker",
    photoAlt: "A clinician explaining haemophilia at a Nepal Hemophilia Society programme",
    lead: "An inhibitor is an antibody that attacks the clotting factor given as treatment. The dose that used to stop a bleed may stop working. This is more common in severe haemophilia A than in haemophilia B, and it needs a specialist plan.",
    blocks: [
      { kind: "p", text: "Inhibitors often appear in childhood, after the first exposures to factor, but they can appear later. Warning signs are a bleed that does not settle after the usual dose, or bleeds that become more frequent. Only a blood test, called an inhibitor assay or Bethesda assay, can confirm it." },
      { kind: "h2", text: "What the centre may do" },
      { kind: "ul", items: [
        "Repeat the factor level and send an inhibitor test.",
        "Treat a serious bleed with a bypassing product or another medicine the specialist chooses. Product names change, and stock in Nepal is not guaranteed.",
        "Consider immune tolerance therapy, which means regular factor under a strict plan to teach the immune system to stop attacking it. This uses a large amount of factor and is not available in every hospital.",
        "For some people with haemophilia A and inhibitors, a non-factor therapy may be discussed if the centre can obtain it.",
      ] },
      { kind: "p", text: "Do not increase the dose on your own and do not switch products because a relative was given something else. Haemophilia B inhibitors can, rarely, cause a severe allergic reaction. That is a reason to infuse where help is close until the centre says home treatment is safe." },
      { kind: "p", text: "NHS can help a family prepare questions and can advocate when a child with an inhibitor cannot get a product. The medical decision stays with the treatment centre." },
      { kind: "cards", items: [
        { title: "Treatment types", text: "How replacement, prophylaxis and newer therapies differ.", href: "/bleeding-disorders/treatment-types", tone: "primary", image: "vial" },
        { title: "Treatment centres", text: "Where to ask for an inhibitor test and a referral.", href: "/bleeding-disorders/treatment-centres", tone: "sky", image: "clinic" },
        { title: "Newly diagnosed", text: "The first months are when many inhibitors appear.", href: "/support/newly-diagnosed", tone: "orange", image: "hands" },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/bleeding-disorders/women-with-bleeding-disorders": {
    title: "Women with bleeding disorders",
    description: "Bleeding symptoms in women and girls, carrier testing, and planning a pregnancy in Nepal.",
    crumbs: [home, disorders, { label: "Women with bleeding disorders" }],
    photo: "members",
    photoAlt: "Nepal Hemophilia Society members at a Kathmandu meeting",
    lead: "Women and girls bleed too. A mother, sister or daughter in a haemophilia family may be a carrier, may have mild haemophilia, or may have another bleeding disorder such as von Willebrand disease. Heavy periods are a symptom, not something to endure in silence.",
    blocks: [
      { kind: "p", text: "Because the genes for factor VIII and factor IX sit on the X chromosome, women often have one changed copy and one working copy. Many have enough factor. Some do not. Lyonization, a new gene change, or rarer chromosome patterns can leave a woman with factor levels in the haemophilia range. She can pass the gene to a son or a daughter." },
      { kind: "h2", text: "Symptoms worth testing" },
      { kind: "ul", items: [
        "Periods that last more than seven days, soak through protection hourly, or cause dizziness",
        "Bleeding after a tooth extraction, delivery or operation",
        "Nosebleeds and bruising that seem out of proportion",
        "A family history of haemophilia, even if the woman herself has never been tested",
        "Anaemia that keeps returning",
      ] },
      { kind: "h2", text: "Pregnancy and birth" },
      { kind: "p", text: "A woman who may carry haemophilia should be offered factor testing before pregnancy if that is possible, and a written plan with the obstetric team and the bleeding-disorder centre. Factor levels can rise in pregnancy and then fall after birth, so the weeks after delivery still need watching." },
      { kind: "p", text: "A boy born into the family, or a girl who may be affected, should not have instruments used at birth unless the obstetric team has no safer choice. Circumcision, injections in the muscle, and surgery wait until the clotting test is known. The cord-blood test is a start. The centre will say when to repeat it." },
      { kind: "p", text: "Testing a pregnancy for haemophilia is a specialist service. It is not offered in every Nepali hospital. NHS can help a couple ask the right centre what is available. The decision belongs to the family." },
      { kind: "h2", text: "Von Willebrand disease" },
      { kind: "p", text: "Von Willebrand disease is the bleeding disorder most often found in women. It is not haemophilia. Treatment is different, and a factor VIII product alone may be the wrong plan. Mention heavy periods and a family history when you ask for a test." },
      { kind: "cards", items: [
        { title: "Haemophilia", text: "How A and B are inherited, and how diagnosis works.", href: "/bleeding-disorders/haemophilia", tone: "magenta", image: "blood" },
        { title: "Day-to-day living", text: "School, periods, work and sport with a plan.", href: "/support/day-day-living", tone: "sky", image: "bandage" },
        { title: "Treatment centres", text: "Ask NHS which centre can test women and girls.", href: "/bleeding-disorders/treatment-centres", tone: "orange", image: "clinic" },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/bleeding-disorders/treatment-centres": {
    title: "Treatment centres",
    description: "How to find haemophilia care in Nepal and confirm the current referral with Nepal Hemophilia Society.",
    crumbs: [home, disorders, { label: "Treatment centres" }],
    photo: "bir",
    photoAlt: "Bir Hospital in Kathmandu, one of the hospitals where haemophilia care is provided",
    lead: "Care is organised through hospitals and through Nepal Hemophilia Society chapters. Hospital units change their clinic days. Call the NHS office before you travel, and ask which centre can do a factor assay this week.",
    blocks: [
      { kind: "h2", text: "Start here" },
      { kind: "p", text: "Nepal Hemophilia Society, Anamnagar, Rudmatti Marg, Kathmandu. Phone 01-5172729. Email nepalhemo@gmail.com. The office is open Sunday to Friday, 9am to 5pm. Staff and volunteers help with registration, referrals and questions. They do not replace the emergency department." },
      { kind: "h2", text: "Hospitals families are referred to" },
      { kind: "p", text: "These hospitals have been named in public NHS meetings and care pathways. Phone numbers inside hospitals change, so they are not listed here. Confirm the clinic with NHS or with the hospital the same week you plan to go." },
      { kind: "ul", items: [
        "Bir Hospital, Kathmandu — a public hospital where haemophilia care has been provided",
        "Civil Service Hospital, Kathmandu",
        "Kathmandu Medical College, Kathmandu",
      ] },
      { kind: "h2", text: "Chapters and contacts outside the valley" },
      { kind: "p", text: "Volunteer chapters help families reach a centre and keep the register closer to home. Public NHS material has referred to chapters in Bhaktapur, Chitwan, Parsa, Sunsari and Kaski (Pokhara), and to a contact in Kailali. A chapter is a community link. Clotting factor and surgery still go through a hospital." },
      { kind: "p", text: "If your district is not on this list, you are not turned away. Many people travel to Kathmandu for the first diagnosis and then continue with a local hospital plus phone advice. Tell NHS your district so the Society can connect you with the nearest volunteer." },
      { kind: "h2", text: "What to carry" },
      { kind: "ul", items: [
        "Any old discharge papers, factor assay results and the names of products already given",
        "A list of medicines, including herbal products",
        "The name and phone of a relative who can speak with the team",
        "For a child: the child health card and vaccine record",
      ] },
      { kind: "cards", items: [
        { title: "See the Society", text: "Meet the community that keeps this list alive.", href: "/support/our-community", tone: "primary", image: "hands" },
        { title: "Newly diagnosed", text: "What to do in the first weeks after a test.", href: "/support/newly-diagnosed", tone: "gold", image: "diagnose" },
        { title: "Ask a question", text: "Short answers before you call the office.", href: "/bleeding-disorders/faqs", tone: "sky", image: "question" },
      ] },
      { kind: "note", text: "For a bleed that will not stop, a swollen neck or throat, belly pain, black stool, or a head injury, go to the nearest emergency department. Tell them haemophilia or a bleeding disorder is suspected or diagnosed. Then call your centre and NHS when the person is safe." },
    ],
  },
  "/bleeding-disorders/faqs": {
    title: "Bleeding disorder FAQs",
    description: "Plain answers to the questions Nepal Hemophilia Society hears from families and clinicians.",
    crumbs: [home, disorders, { label: "FAQs" }],
    photo: "table",
    photoAlt: "Nepal Hemophilia Society members seated around a meeting table",
    lead: "These answers are a starting point. Your factor level, inhibitor status and local hospital supply change what is safe for you.",
    blocks: [
      { kind: "faq", items: [
        { q: "Is haemophilia the same as thin blood?", a: "No. The blood does not clot properly because a clotting protein is missing or blocked. People with haemophilia do not bleed faster from a small cut in every case. They bleed longer, and they can bleed inside a joint or muscle." },
        { q: "Can girls have haemophilia?", a: "Yes. It is less common, and it is often missed. Heavy periods, bleeding after delivery, and a brother or uncle with haemophilia are reasons to test. Read the page on women with bleeding disorders." },
        { q: "What is von Willebrand disease?", a: "It is a different inherited bleeding disorder and the one most often found in women. The tests and the treatment are not the same as for haemophilia A. Ask for a specific test if periods are very heavy." },
        { q: "Can haemophilia be cured?", a: "Standard treatment controls bleeding. It is not a cure. Gene therapy is discussed in some countries for selected adults. It is not a service NHS can book in Nepal today. Be wary of anyone who offers a cure online." },
        { q: "Why is prophylaxis not given to every child yet?", a: "Regular preventive factor is the standard NHS wants. Supply, cost and the number of trained centres still limit it. On-demand treatment is what many families receive. Ask your centre, and tell NHS if a child is having repeated joint bleeds." },
        { q: "Are emicizumab and extended half-life factor available?", a: "They are used internationally. In Nepal they depend on what a centre can obtain, including occasional humanitarian supply. Do not assume a product is in stock. The centre will name what they can give." },
        { q: "What if factor stops working?", a: "Ask for an inhibitor test. Do not keep raising the dose without a plan. The inhibitors page explains the next questions to ask." },
        { q: "Can my child play sport?", a: "Many children do. Swimming, walking and non-contact games are usual starting points. Football headers, wrestling and other high-impact sport need a conversation with the centre. Shoes, guards and a warm-up matter." },
        { q: "Should we avoid all injections?", a: "No. Vaccines and necessary injections should still be given. The team uses a smaller needle where possible, presses on the site afterwards, and avoids an intramuscular injection when a different route is safe. Tell every vaccinator about the bleeding disorder." },
        { q: "How do we register with NHS?", a: "Call 01-5172729, email nepalhemo@gmail.com, or use the join page. Bring whatever test results you have. Registration helps the Society plan supply and advocacy. It is not a substitute for hospital care." },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/support/newly-diagnosed": {
    title: "Newly diagnosed",
    description: "The first steps after a bleeding-disorder diagnosis for families in Nepal.",
    crumbs: [home, support, { label: "Newly diagnosed" }],
    photo: "rally",
    photoAlt: "Families gathered for World Hemophilia Day with Nepal Hemophilia Society",
    lead: "A new diagnosis turns ordinary days into questions. You do not have to learn all of it this week. Keep the person safe, get the test in writing, and contact Nepal Hemophilia Society.",
    blocks: [
      { kind: "h2", text: "This week" },
      { kind: "ul", items: [
        "Ask the doctor to write the diagnosis, the factor level if it is known, and the phone number of the clinic.",
        "Learn the signs of a joint bleed, a muscle bleed and a head injury.",
        "Tell the school or workplace that a bump to the head or a swollen joint needs a phone call, not a wait until evening.",
        "Store any factor exactly as the centre teaches. Heat and freezing both spoil it.",
        "Write down every bleed and every dose. That notebook is how the centre improves the plan.",
      ] },
      { kind: "h2", text: "What NHS can do" },
      { kind: "p", text: "The Society registers people with haemophilia, introduces families to a chapter, and explains how to reach a centre. Volunteers are parents and patients who have already lived the first frightening year. They are not a replacement for the doctor on duty." },
      { kind: "p", text: "Call 01-5172729 or email nepalhemo@gmail.com. If you are outside Kathmandu, say your district. Office hours are Sunday to Friday, 9am to 5pm." },
      { kind: "cards", items: [
        { title: "Understand the condition", text: "A plain explanation of haemophilia A, B and related disorders.", href: "/bleeding-disorders/haemophilia", tone: "primary", image: "genetics" },
        { title: "Treatment", text: "On-demand care, prophylaxis and what is realistic in Nepal.", href: "/bleeding-disorders/treatment-types", tone: "magenta", image: "prophylaxis" },
        { title: "Find a centre", text: "Hospitals and chapters, and how to confirm a visit.", href: "/bleeding-disorders/treatment-centres", tone: "sky", image: "clinic" },
        { title: "Meet the community", text: "Other families are the reason NHS exists.", href: "/support/our-community", tone: "orange", image: "newsKathmandu" },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/support/day-day-living": {
    title: "Day-to-day living",
    description: "School, work, travel, teeth, pain and exercise for people with a bleeding disorder in Nepal.",
    crumbs: [home, support, { label: "Day-to-day living" }],
    photo: "president",
    photoAlt: "Nepal Hemophilia Society leadership speaking at a public meeting",
    lead: "A bleeding disorder changes how you prepare. It should not decide whether a child goes to school or an adult keeps a job. Most of life is planning, not prohibition.",
    blocks: [
      { kind: "h2", text: "Home and school" },
      { kind: "p", text: "Tell the class teacher and the school nurse, if there is one, what a bleed looks like. A child can sit out of one game and still belong in the class. Punishments that involve standing for a long time or physical drills are a bad idea during a joint bleed. Share a short letter from the centre so the school is not guessing." },
      { kind: "h2", text: "Teeth, pain and medicines" },
      { kind: "p", text: "Brush with a soft brush. Book dental care before a tooth becomes an emergency, and ask the dentist to speak with the treatment centre first. For pain, paracetamol is the medicine many centres prefer. Ibuprofen, aspirin and some other painkillers can increase bleeding. Check before you buy a tablet at a pharmacy." },
      { kind: "h2", text: "Joints and movement" },
      { kind: "p", text: "After a bleed settles, gentle movement stops the joint from stiffening. A physiotherapist who understands haemophilia is worth the referral. Swimming and walking are common choices. High-impact sport needs an individual decision, especially if a target joint already exists." },
      { kind: "h2", text: "Travel and festivals" },
      { kind: "ul", items: [
        "Carry the diagnosis paper, the centre’s phone number, and enough prescribed treatment for the trip plus a delay.",
        "Keep factor in the cabin bag, at the temperature the label requires. Do not leave it in a hot bus.",
        "Know the hospital at your destination before you leave. Ask NHS if a chapter is there.",
        "A medical alert card in a wallet is useful when you cannot speak for yourself.",
      ] },
      { kind: "h2", text: "Work" },
      { kind: "p", text: "People with haemophilia work in offices, classrooms, shops and farms. Jobs with repeated heavy impact are harder on joints that have bled. If an employer needs a letter, the centre can describe limits without sharing your whole record. NHS can talk with you about what to disclose." },
      { kind: "cards", items: [
        { title: "Women and girls", text: "Periods, pregnancy and carrier testing.", href: "/bleeding-disorders/women-with-bleeding-disorders", tone: "magenta", image: "pregnancy" },
        { title: "FAQs", text: "Sport, vaccines and registration.", href: "/bleeding-disorders/faqs", tone: "sky", image: "question" },
        { title: "Our community", text: "You are not the only family figuring this out.", href: "/support/our-community", tone: "gold", image: "eventCamp" },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/support/our-community": {
    title: "Our community",
    description: "Nepal Hemophilia Society’s members, chapters and the idea behind Together For Life.",
    crumbs: [home, support, { label: "Our community" }],
    photo: "speaker",
    photoAlt: "A clinician explaining haemophilia at a Nepal Hemophilia Society programme",
    lead: "Nepal Hemophilia Society is a community of people with haemophilia, parents, clinicians and volunteers. It was founded in 1992. It is a national member organization of the World Federation of Hemophilia and a member of the National Federation of the Disabled Nepal.",
    blocks: [
      { kind: "p", text: "The vision is comprehensive care of haemophilia for living a life with dignity. The mission is to provide haemophilia care and treatment services so people with haemophilia can recover toward ordinary health. That work is practical: registration, information, chapter links, and advocacy with government." },
      { kind: "p", text: "NHS has said publicly that many more people in Nepal are likely to have a bleeding disorder than the number already diagnosed and registered. Finding them is part of the mission. A bruise that does not make sense, or a boy with a swollen knee and an uncle who bled, is a reason to test." },
      { kind: "h2", id: "stories", text: "What members say this community is for" },
      { kind: "ul", items: [
        "A family that finally has a name for the bleeding, and a person to call who has heard the story before.",
        "A young person who stays in school because a teacher was told what a joint bleed is.",
        "A chapter volunteer who helps a new family reach Kathmandu for the first assay, then helps them go home with a plan.",
      ] },
      { kind: "p", text: "These are the kinds of stories shared at World Hemophilia Day and at the March 2024 advocacy meeting in Kathmandu. They are not case reports. Medical details stay with the centre." },
      { kind: "cards", items: [
        { title: "Join", text: "Register as a member, parent, clinician or volunteer.", href: "/get-involved/join", tone: "primary", image: "hands" },
        { title: "Events", text: "World Hemophilia Day, camps and meetings.", href: "/events/categories", tone: "orange", image: "eventWhd" },
        { title: "News", text: "What the Society has been asking government to do.", href: "/news", tone: "sky", image: "newsProvinces" },
      ] },
    ],
  },
  "/get-involved/join": {
    title: "Join Nepal Hemophilia Society",
    description: "Become a member, volunteer or clinical partner of Nepal Hemophilia Society.",
    crumbs: [home, involved, { label: "Join" }],
    photo: "president",
    photoAlt: "Nepal Hemophilia Society leadership speaking at a public meeting",
    lead: "Membership connects you to the register, the chapters and the advocacy. Patients, parents, clinicians and other supporters are all welcome. There is no online payment on this page. The office confirms membership with you directly.",
    blocks: [
      { kind: "ul", items: [
        "People with haemophilia or another bleeding disorder, and their families",
        "Health workers who treat bleeding disorders or want to learn",
        "Volunteers who can translate, organise a chapter day, or help at a camp",
        "Organisations that want a formal link with NHS",
      ] },
      { kind: "p", text: "Send the form and your email app will open a message to nepalhemo@gmail.com. You can also call 01-5172729, Sunday to Friday, 9am to 5pm. Please do not include full medical files in the first email. The office will tell you what to bring." },
      { kind: "form", intent: "join" },
    ],
  },
  "/get-involved/fundraising": {
    title: "Fundraising",
    description: "How to support Nepal Hemophilia Society’s work without a fake donate button.",
    crumbs: [home, involved, { label: "Fundraising" }],
    photo: "bir",
    photoAlt: "Bir Hospital, Kathmandu, where families are referred for haemophilia care",
    lead: "NHS is a nonprofit. Money, time and introductions all change whether a family reaches a factor assay. This website does not take card payments. Support is arranged with the office so gifts stay accountable.",
    blocks: [
      { kind: "h2", text: "Ways to help" },
      { kind: "ul", items: [
        "Become a member and pay the membership the office explains.",
        "Hold a World Hemophilia Day collection at a school, campus or workplace and send the proceeds with a written total.",
        "Ask a business or a trust to fund a named need: a clinic day, a physiotherapy camp, or travel for a family that must reach Kathmandu for diagnosis.",
        "Offer a skill: design, translation, legal advice, or a hall for a meeting.",
      ] },
      { kind: "p", text: "Please do not send clotting factor, blood, or medicine by courier unless the treatment centre has agreed in writing. The wrong product, or a product that was stored badly, can harm a patient." },
      { kind: "p", text: "Write to nepalhemo@gmail.com with the subject “Fundraising”. Say whether you are an individual, a school or a company, and what you would like to support. The office replies Sunday to Friday." },
      { kind: "cards", items: [
        { title: "Email the office", text: "Open a message about a gift, a partnership or a collection.", href: "mailto:nepalhemo@gmail.com?subject=Fundraising%20enquiry", tone: "primary", image: "fundraising" },
        { title: "Join as a member", text: "Membership is the ordinary way to belong.", href: "/get-involved/join", tone: "gold", image: "hands" },
        { title: "Come to an event", text: "Awareness days are where new supporters meet families.", href: "/events/categories", tone: "sky", image: "eventAdvocacy" },
      ] },
    ],
  },
  "/events/categories": {
    title: "Events",
    description: "World Hemophilia Day, advocacy meetings and community camps run with Nepal Hemophilia Society.",
    crumbs: [home, { label: "Events" }],
    photo: "rally",
    photoAlt: "World Hemophilia Day gathering organised with Nepal Hemophilia Society",
    lead: "NHS meets in Kathmandu and, through chapters, closer to home. Dates for the next camp are confirmed by phone. The events below are the ones the Society keeps every year or has recently held.",
    blocks: [
      { kind: "articles", items: [
        {
          id: "world-hemophilia-day",
          date: "17 April",
          title: "World Hemophilia Day",
          photo: "president",
          paragraphs: [
            "World Hemophilia Day is 17 April, the birthday of Frank Schnabel, who founded the World Federation of Hemophilia. In Nepal the day is marked with families, red colour, and a public ask: diagnosis and safe treatment in every province.",
            "Schools and colleges are welcome to host a small programme. Tell NHS if you want a speaker or a fact sheet. The international campaign pages are published each year by the World Federation of Hemophilia.",
          ],
        },
        {
          id: "advocacy-meeting",
          date: "11 March 2024",
          title: "Provincial advocacy meeting",
          photo: "speaker",
          paragraphs: [
            "On 11 March 2024 NHS met provincial government representatives at Ramada Encore in Thamel, Kathmandu. The meeting asked provinces to invest in diagnosis, care and treatment.",
            "Members, clinicians and the Society’s leadership were in the same room. The ask was a budget for diagnosis and safe treatment, not a one-day camp.",
          ],
        },
        {
          id: "health-camps",
          date: "Through the year",
          title: "Community health camps",
          photo: "members",
          paragraphs: [
            "Camps are where physiotherapy, dental advice and family questions happen away from a crowded outpatient corridor. A camp is not an emergency service and it does not replace a factor assay.",
            "If you want a camp in your district, write to the office with the place, a local hospital contact, and the number of families you already know. NHS will say whether the calendar allows it.",
          ],
        },
      ] },
      { kind: "cards", items: [
        { title: "Offer a venue", text: "Tell the office about a hall, a campus or a clinic day.", href: "mailto:nepalhemo@gmail.com?subject=Event%20enquiry", tone: "orange", image: "eventAdvocacy" },
        { title: "Read the news", text: "What those meetings asked government to change.", href: "/news", tone: "primary", image: "newsWhd" },
      ] },
    ],
  },
  "/resources/publications": {
    title: "Publications",
    description: "Guides from Nepal Hemophilia Society and the international references we point families to.",
    crumbs: [home, resources, { label: "Publications" }],
    photo: "speaker",
    photoAlt: "A teaching session at a Nepal Hemophilia Society programme",
    lead: "Start with the pages on this website. They were written for Nepal. For clinical protocols, use the World Federation of Hemophilia guidelines and your treatment centre, not a social-media summary.",
    blocks: [
      { kind: "links", items: [
        { title: "Haemophilia, in plain language", text: "Types, inheritance, symptoms and diagnosis for families.", href: "/bleeding-disorders/haemophilia" },
        { title: "Treatment types", text: "Prophylaxis, non-factor therapy and extended half-life factor, with Nepal supply limits.", href: "/bleeding-disorders/treatment-types" },
        { title: "Newly diagnosed", text: "A first-week checklist.", href: "/support/newly-diagnosed" },
        { title: "Day-to-day living", text: "School, teeth, travel and work.", href: "/support/day-day-living" },
        { title: "Women and girls", text: "Periods, pregnancy and carrier testing.", href: "/bleeding-disorders/women-with-bleeding-disorders" },
        { title: "WFH Guidelines for the Management of Hemophilia, 3rd edition", text: "The international clinical reference. Opens the World Federation of Hemophilia site.", href: "https://wfh.org" },
      ] },
      { kind: "note", text: "NHS does not republish paid textbooks or whole guideline PDFs. Use the publisher’s own page so you read the current edition." },
    ],
  },
  "/resources/videos": {
    title: "Videos",
    description: "Where to watch trusted haemophilia education, and when NHS recordings are shared.",
    crumbs: [home, resources, { label: "Videos" }],
    photo: "speaker",
    photoAlt: "A clinician presenting at a Nepal Hemophilia Society session",
    lead: "NHS programmes are often in a meeting room, not on a film set. When a recording is cleared for the public, it will be listed here. Until then, use the World Federation of Hemophilia’s own films rather than an unnamed upload.",
    blocks: [
      { kind: "links", items: [
        { title: "World Federation of Hemophilia on YouTube", text: "Talks and explainers published by WFH. Watch on their channel so the source is clear.", href: "https://www.youtube.com/user/WFHemophilia" },
        { title: "World Hemophilia Day", text: "The annual campaign films and posters, published by WFH.", href: "https://wfh.org/world-hemophilia-day/" },
        { title: "Read instead", text: "The same topics, written for Nepal, are on the haemophilia page.", href: "/bleeding-disorders/haemophilia" },
      ] },
      { kind: "p", text: "If you filmed an NHS event, do not post patients’ faces or names without their permission. Send the office a link first if you want it considered for this page." },
    ],
  },
  "/resources/guidelines": {
    title: "Guidelines",
    description: "The care principles Nepal Hemophilia Society points clinicians to, and where the full text lives.",
    crumbs: [home, resources, { label: "Guidelines" }],
    photo: "table",
    photoAlt: "Discussion among Nepal Hemophilia Society members and clinicians",
    lead: "Clinicians in Nepal are asked to follow the World Federation of Hemophilia Guidelines for the Management of Hemophilia, 3rd edition, and to adapt them to the product that is actually in the pharmacy.",
    blocks: [
      { kind: "p", text: "The third edition, published in 2020 with later updates on the WFH site, is the reference NHS names in teaching. It covers diagnosis, prophylaxis, inhibitors, surgery, physiotherapy and outcome tracking. This website does not copy that text." },
      { kind: "h2", text: "Principles that do not change with the brand of factor" },
      { kind: "ul", items: [
        "Diagnose with a factor assay, not with a story alone.",
        "Treat a bleed early. A joint that is already tight is harder to save.",
        "Prefer virus-inactivated concentrates over untreated plasma products when both are available.",
        "Record the product name, the batch, the dose and the time.",
        "Test for an inhibitor when bleeding no longer responds.",
        "Plan dental work and surgery. Do not discover the bleeding disorder in the operating theatre.",
        "Include women and girls in the family history and in testing.",
        "Teach home care only after the family has practised with the centre.",
      ] },
      { kind: "p", text: "Where the guideline and the Nepali pharmacy disagree, the centre documents the gap and treats with the safest available product. NHS uses those gaps in advocacy. They are not a reason to delay a serious bleed." },
      { kind: "links", items: [
        { title: "WFH treatment guidelines", text: "Official page of the World Federation of Hemophilia.", href: "https://wfh.org" },
        { title: "Treatment types in Nepal", text: "How prophylaxis and newer products fit local supply.", href: "/bleeding-disorders/treatment-types" },
        { title: "External resources", text: "CDC, WHO blood safety, and the Ministry of Health.", href: "/resources/external-resources" },
      ] },
      { kind: "note", text: disclaimer },
    ],
  },
  "/resources/external-resources": {
    title: "External resources",
    description: "Organisations Nepal Hemophilia Society works with or sends readers to.",
    crumbs: [home, resources, { label: "External resources" }],
    photo: "members",
    photoAlt: "Nepal Hemophilia Society members seated together at a meeting",
    lead: "These sites are run by other organisations. NHS links to them so you can read the original. Their pages can change, and a product mentioned there may not be stocked in Nepal.",
    blocks: [
      { kind: "links", items: [
        { title: "World Federation of Hemophilia", text: "NHS is a national member organization. Treatment guidelines, humanitarian aid and World Hemophilia Day.", href: "https://wfh.org" },
        { title: "WFH humanitarian aid", text: "How donated treatment is governed. Availability in Nepal is year by year.", href: "https://wfh.org/humanitarian-aid/" },
        { title: "National Federation of the Disabled Nepal", text: "NHS is a member. Disability rights and the wider Nepali movement.", href: "https://www.nfdn.org.np" },
        { title: "Ministry of Health and Population", text: "The ministry NHS advocates with for diagnosis and treatment.", href: "https://mohp.gov.np" },
        { title: "World Health Organization — blood products", text: "Why screened donations and safe plasma products matter.", href: "https://www.who.int/health-topics/blood-products" },
        { title: "U.S. CDC — hemophilia", text: "A clear public explanation of hemophilia and joint health.", href: "https://www.cdc.gov/hemophilia/about/index.html" },
      ] },
    ],
  },
  "/news": {
    title: "Latest news",
    description: "Advocacy, World Hemophilia Day and care updates from Nepal Hemophilia Society.",
    crumbs: [home, { label: "Latest news" }],
    photo: "speaker",
    photoAlt: "A clinician teaching at a Nepal Hemophilia Society programme",
    lead: "News on this page comes from NHS programmes and from public decisions that change care in Nepal. It is not a medical alert service. For a bleed, contact your centre or the emergency department.",
    blocks: [
      { kind: "articles", items: [
        {
          id: "provinces-2024",
          date: "11 March 2024",
          title: "Provinces asked to invest in diagnosis and treatment",
          photo: "president",
          paragraphs: [
            "Nepal Hemophilia Society met provincial government representatives in Kathmandu and asked them to fund diagnosis, care and treatment closer to where families live. The meeting was held on 11 March 2024.",
            "Members, clinicians and the Society’s leadership used the day to show what comprehensive care means: a factor assay, a product that is safe, physiotherapy, and a clinic that does not disappear after one camp.",
          ],
        },
        {
          id: "community-kathmandu",
          date: "11 March 2024",
          title: "Members gather in Kathmandu",
          photo: "table",
          paragraphs: [
            "The same meetings brought families from beyond the valley into one room. For many, it was the first time they had heard another parent describe a swollen knee in the same words.",
            "Registration remains open. If you were in the room and have not completed your details, call the Anamnagar office.",
          ],
        },
        {
          id: "whd",
          date: "17 April",
          title: "World Hemophilia Day in Nepal",
          photo: "rally",
          paragraphs: [
            "Each 17 April NHS marks World Hemophilia Day with the global community and with a local demand: people in Nepal should not wait years for a name for their bleeding.",
            "Schools, hospitals and chapters can host the day. Write to nepalhemo@gmail.com if you want the Society involved.",
          ],
        },
      ] },
      { kind: "cards", items: [
        { title: "Inquiry and blood safety", text: "What the international infected-blood scandal means for products used here.", href: "/public-inquiry/inquiry-news", tone: "primary", image: "inhibitor" },
        { title: "All events", text: "Camps, advocacy days and 17 April.", href: "/events/categories", tone: "sky", image: "eventWhd" },
      ] },
    ],
  },
  "/public-inquiry/the-infected-blood-inquiry": {
    title: "The infected blood inquiry",
    description: "What the UK Infected Blood Inquiry found, and what Nepal Hemophilia Society takes from it.",
    crumbs: [home, inquiry, { label: "The infected blood inquiry" }],
    photo: "speaker",
    photoAlt: "A clinician teaching at a Nepal Hemophilia Society programme",
    lead: "The Infected Blood Inquiry is a United Kingdom public inquiry. It is not a Nepal government inquiry, and NHS does not pretend that it is. Its findings still matter here, because people with haemophilia were harmed by blood products in many countries.",
    blocks: [
      { kind: "p", text: "In the 1970s and 1980s, clotting factor made from large pools of donated plasma infected thousands of people with HIV and hepatitis. In the UK, Sir Brian Langstaff led a statutory inquiry. The final report, published in May 2024, found that infections were not an accident of the time alone. Patients were not told enough, safer products were delayed, and the state failed the people who depended on it." },
      { kind: "p", text: "Nepal’s haemophilia community is smaller and younger as an organised society — NHS was founded in 1992 — but the lesson is the same. Untreated plasma and cryoprecipitate can carry viruses. Records of which product, which batch and which patient must exist. A person who may have been infected deserves testing and care, not silence." },
      { kind: "h2", text: "What NHS asks for in Nepal" },
      { kind: "ul", items: [
        "Screened blood donation and a plasma supply that does not cut corners",
        "Virus-inactivated factor concentrates as the normal treatment, not a luxury",
        "A written record of every product given",
        "Testing and treatment for anyone who may have acquired hepatitis or HIV from a blood product",
        "No sale of clotting factor through informal dealers",
      ] },
      { kind: "p", text: "Compensation schemes announced in the UK apply to people recognised by that inquiry. They are not a payment NHS can claim for a Nepali patient. If you are worried about an infection, the next step is a doctor and a test, then a conversation with NHS about care and advocacy." },
      { kind: "cards", items: [
        { title: "Inquiry news", text: "Updates NHS wants families to see.", href: "/public-inquiry/inquiry-news", tone: "primary", image: "diagnose" },
        { title: "Advocacy with government", text: "How the UK parliamentary group compares with NHS advocacy here.", href: "/public-inquiry/the-infected-blood-inquiry/appg", tone: "magenta", image: "newsProvinces" },
        { title: "Support", text: "If you are worried about a past blood product.", href: "/public-inquiry/support", tone: "orange", image: "hands" },
      ] },
    ],
  },
  "/public-inquiry/inquiry-news": {
    title: "Inquiry news",
    description: "Blood-safety news for Nepal Hemophilia Society members, including the UK inquiry as context.",
    crumbs: [home, inquiry, { label: "Inquiry news" }],
    photo: "table",
    photoAlt: "Nepal Hemophilia Society members meeting to discuss care",
    lead: "This page tracks blood safety. It is not a feed of the UK inquiry alone, and it is not medical advice for a person waiting on a test.",
    blocks: [
      { kind: "articles", items: [
        {
          id: "uk-report",
          date: "20 May 2024",
          title: "UK Infected Blood Inquiry publishes its final report",
          photo: "speaker",
          paragraphs: [
            "On 20 May 2024 the UK Infected Blood Inquiry published its final report. It described a calamity that infected people through blood and blood products, including people with haemophilia, and it criticised decades of delay.",
            "NHS shares the report as a warning, not as a local legal process. The full documents are on the inquiry’s own website.",
          ],
        },
        {
          id: "safer-products",
          date: "Ongoing",
          title: "Safer treatment products in Nepal",
          photo: "bir",
          paragraphs: [
            "NHS continues to ask the Ministry of Health and Population and provincial governments to fund virus-inactivated factor and reliable testing. Humanitarian shipments arranged with the World Federation of Hemophilia have helped some patients. They are not a national supply system.",
            "If your centre changes the product you receive, ask for the name, the batch number and the storage instructions in writing.",
          ],
        },
        {
          id: "advocacy-safety",
          date: "11 March 2024",
          title: "Provincial meeting included the supply question",
          photo: "president",
          paragraphs: [
            "The 11 March 2024 advocacy meeting was about diagnosis and treatment, which includes what product a province is willing to buy. A camp without a safe concentrate is not comprehensive care.",
          ],
        },
      ] },
      { kind: "links", items: [
        { title: "UK Infected Blood Inquiry", text: "Official inquiry site for the report and evidence.", href: "https://www.infectedbloodinquiry.org.uk/" },
        { title: "Support if you are worried", text: "Testing and who to call in Nepal.", href: "/public-inquiry/support" },
      ] },
    ],
  },
  "/public-inquiry/the-infected-blood-inquiry/appg": {
    title: "Advocacy with government",
    description: "The UK all-party group on contaminated blood, and how Nepal Hemophilia Society advocates here.",
    crumbs: [home, inquiry, { label: "Advocacy with government" }],
    photo: "president",
    photoAlt: "Nepal Hemophilia Society president speaking at a Kathmandu meeting",
    lead: "The All-Party Parliamentary Group on Haemophilia and Contaminated Blood is a United Kingdom Parliament group. Nepal does not have that group. The work that resembles it is NHS advocacy with the Ministry of Health and Population and with provincial governments.",
    blocks: [
      { kind: "p", text: "In the UK, parliamentarians from different parties have used an all-party group to question ministers about infected blood, treatment and support for the community. That group does not make law by itself, and it does not represent Nepali patients." },
      { kind: "p", text: "In Nepal, NHS takes the same kind of demands to the institutions that can act: the Ministry of Health and Population, provincial health ministries, public hospitals and, where disability rights are concerned, networks such as the National Federation of the Disabled Nepal. The 11 March 2024 meeting with provincial government was one of those days." },
      { kind: "h2", text: "What the Society asks for" },
      { kind: "ul", items: [
        "Factor assays in reach of each province, not only a one-time camp",
        "A budget line for safe clotting factor and for prophylaxis, starting with children who are already bleeding into joints",
        "Training for doctors, nurses, dentists and physiotherapists",
        "Inclusion of women and girls in testing",
        "Blood safety rules that are enforced, with records of products and batches",
      ] },
      { kind: "p", text: "You can help by writing a short account of what care is like in your district, without posting someone else’s medical details online. Send it to nepalhemo@gmail.com with the subject “Advocacy”. The office uses lived experience in meetings. It does not publish your file." },
      { kind: "cards", items: [
        { title: "Write to NHS", text: "Share a district story for the next government meeting.", href: "mailto:nepalhemo@gmail.com?subject=Advocacy", tone: "primary", image: "eventAdvocacy" },
        { title: "Read the inquiry background", text: "Why blood safety is part of this demand.", href: "/public-inquiry/the-infected-blood-inquiry", tone: "magenta", image: "inhibitor" },
        { title: "Join", text: "Members give the advocacy its authority.", href: "/get-involved/join", tone: "gold", image: "fundraising" },
      ] },
    ],
  },
  "/public-inquiry/support": {
    title: "Support after infected blood products",
    description: "What to do in Nepal if you are worried that a blood product caused hepatitis or HIV.",
    crumbs: [home, inquiry, { label: "Support" }],
    photo: "bir",
    photoAlt: "Bir Hospital in Kathmandu, where people can ask for a clotting test",
    lead: "If you or your child received blood, plasma, cryoprecipitate or clotting factor and you are worried about hepatitis or HIV, you deserve a test and an explanation. Worry alone is not a diagnosis. NHS will help you find the conversation. We cannot see your result on this website.",
    blocks: [
      { kind: "h2", text: "What to do" },
      { kind: "ul", items: [
        "Go to your treatment centre or a hospital that can test for HIV and for hepatitis B and C. Take old discharge papers if you have them.",
        "Ask which product was given, in which year, and whether the batch was recorded. Write down the answer.",
        "If a test is positive, stay with the clinician for treatment. Hepatitis and HIV both have care pathways in Nepal. Do not buy medicine from an advertisement.",
        "Tell NHS what support you need: a referral, a chapter contact, or someone to come with you to a meeting. Call 01-5172729 or email nepalhemo@gmail.com.",
      ] },
      { kind: "p", text: "The UK inquiry recommended compensation for people infected and affected in that country’s system. Those schemes do not automatically cover treatment given in Nepal. If a lawyer or a stranger promises a UK payment for a Nepali hospital record, treat that as a warning and talk to NHS before you sign anything or pay a fee." },
      { kind: "p", text: "Families who were not infected still live with the fear. That belongs in the community too. You can come to a meeting, join as a member, and ask for information without having a positive test." },
      { kind: "form", intent: "message" },
      { kind: "note", text: "Email is not confidential in the way a clinic record is. Do not send photographs of a full medical file, an ID card, or a child’s photo. Say that you want a call, and the office will arrange a safer conversation." },
    ],
  },
};

export function getPage(path: string) {
  const page = pages[path];
  if (!page) throw new Error(`Missing page: ${path}`);
  return page;
}
