import { createFileRoute } from "@tanstack/react-router";

import { FeatureSections } from "@/components/site/FeatureSections";
import { HomeHero } from "@/components/site/HomeHero";
import { Reveal } from "@/components/site/Reveal";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SiteLink } from "@/components/site/SiteLink";
import { TopicCard } from "@/components/site/TopicCard";
import { Button } from "@/components/ui/button";
import type { CardImage } from "@/assets/cards";
import { articleHref } from "@/data/articles";
import type { Tone } from "@/data/pages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nepal Hemophilia Society | Together For Life" },
      { name: "description", content: "Nepal Hemophilia Society supports people with hemophilia and other bleeding disorders through care, education and advocacy." },
      { property: "og:title", content: "Nepal Hemophilia Society | Together For Life" },
      { property: "og:description", content: "Support, care and community for people with bleeding disorders across Nepal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const helpCards: { title: string; text: string; href: string; tone: Tone; image: CardImage }[] = [
  { title: "My child is newly diagnosed", text: "Finding out that you or your child has a bleeding disorder can be stressful. We’re here to help you make sense of it all.", href: articleHref("help-newly-diagnosed-child"), tone: "primary", image: "hands" },
  { title: "Someone I know has a bleeding disorder", text: "Learn about different bleeding disorders, available diagnosis and treatment options, and how you can offer support.", href: articleHref("help-someone-i-know"), tone: "magenta", image: "genetics" },
  { title: "I need help and support", text: "Find practical information for staying active and healthy, along with support available to you and your family.", href: articleHref("help-day-to-day-support"), tone: "sky", image: "bandage" },
];

const newsCards: { kicker: string; title: string; text: string; href: string; tone: Tone; image: CardImage }[] = [
  { kicker: "11 MAR 24", title: "NHS asks provinces to invest in diagnosis and treatment", text: "Provincial governments were asked to fund diagnosis, care and safe treatment closer to home.", href: articleHref("provinces-2024"), tone: "primary", image: "newsProvinces" },
  { kicker: "11 MAR 24", title: "Members gather in Kathmandu for hemophilia care", text: "Families, clinicians and volunteers met in Kathmandu to share knowledge and connection.", href: articleHref("community-kathmandu"), tone: "magenta", image: "newsKathmandu" },
  { kicker: "17 APR", title: "World Hemophilia Day in Nepal", text: "Each 17 April NHS marks World Hemophilia Day with families across the country.", href: articleHref("whd"), tone: "sky", image: "newsWhd" },
];

const events: { kicker: string; title: string; text: string; href: string; tone: Tone; image: CardImage }[] = [
  { kicker: "17 Apr", title: "World Hemophilia Day", text: "Stand with Nepal’s bleeding disorder community and help raise awareness.", href: articleHref("world-hemophilia-day"), tone: "primary", image: "eventWhd" },
  { kicker: "11 Mar", title: "Provincial advocacy meeting", text: "Families, clinicians and volunteers sharing knowledge and connection.", href: articleHref("advocacy-meeting"), tone: "magenta", image: "eventAdvocacy" },
  { kicker: "Camp", title: "Community health camp", text: "Hands-on support for children living with hemophilia.", href: articleHref("health-camps"), tone: "sky", image: "eventCamp" },
];

const storySlugs = ["story-family-journey", "story-living-confidence", "story-stronger-together"] as const;

const stories = [
  { title: "A family’s journey", text: "Finding support, confidence and a community that understands changed everything." },
  { title: "Living life with confidence", text: "With care, knowledge and connection, a bleeding disorder does not define the future." },
  { title: "Stronger together", text: "Families across Nepal are sharing experience and opening doors for the next generation." },
];

const joinCards = [
  ["Become a Member", "Join Nepal Hemophilia Society and connect with a community that understands.", "Read more", articleHref("join-become-member")],
  ["Campaign with us", "Help improve access to diagnosis, safe treatment and comprehensive care.", "Read more", articleHref("join-campaign-with-us")],
  ["Get Involved", "Volunteer, fundraise or share your expertise to support families across Nepal.", "Read more", articleHref("join-get-involved")],
  ["Reach Out", "We’re on the end of an email or phone whenever you need information and support.", "Read more", articleHref("join-reach-out")],
];

function Index() {
  return (
    <SiteFrame>
      <main id="top" className="page-main page-enter">
        <HomeHero />
        <section className="site-container">
          <div className="value-grid relative z-10 -mt-8 grid w-full gap-4 md:-mt-12 md:grid-cols-3">
            {[
              ["Get involved", "Share time, advice or support — every little thing helps bring hope.", "bg-magenta", "/get-involved/fundraising"],
              ["Make a difference", "Share stories and advice, advocate for change. We’re in this together.", "bg-orange", "/public-inquiry/the-infected-blood-inquiry/appg"],
              ["Become part of the family", "We’re united through blood, and we’re there for each other no matter what.", "bg-sky", "/support/our-community"],
            ].map(([title, text, tone, href], index) => (
              <Reveal key={title} variant="left" delay={index * 70}>
                <SiteLink href={href} className={`${tone} block min-h-44 rounded-md p-7 text-center`}>
                  <h2 className="text-xl font-black text-tone-foreground">{title}</h2>
                  <p className="mt-4 text-sm font-semibold leading-relaxed text-tone-copy">{text}</p>
                </SiteLink>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="site-container py-12 text-base leading-relaxed">
          <Reveal variant="up">
            <p>Living with a bleeding disorder is never black and white. Life after diagnosis may start out hard, but we learn by doing, asking questions and surrounding ourselves with people who understand.</p>
            <p className="mt-4">Then, slowly, it becomes life again. A bleeding disorder shouldn&apos;t define who we are, what we do or how we feel.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="brand" asChild><SiteLink href="/about">About the Society</SiteLink></Button>
              <Button variant="brand" asChild><SiteLink href="#understanding">What we do</SiteLink></Button>
            </div>
          </Reveal>
        </section>

        <FeatureSections />

        <section className="site-container py-16">
          <Reveal variant="up">
            <h2 className="section-title">What do you need help with today?</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {helpCards.map((card, index) => (
              <Reveal key={card.title} variant="up" delay={index * 60}>
                <TopicCard title={card.title} text={card.text} href={card.href} tone={card.tone} image={card.image} />
              </Reveal>
            ))}
          </div>
        </section>

        <section id="news" className="site-container scroll-mt-24 pb-16">
          <Reveal variant="up">
            <h2 className="section-title">Latest news at Nepal Hemophilia Society</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {newsCards.map((card, index) => (
              <Reveal key={card.title} variant="up" delay={index * 60}>
                <TopicCard kicker={card.kicker} title={card.title} text={card.text} href={card.href} tone={card.tone} image={card.image} />
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" delay={180}>
            <div className="mt-6 text-center"><Button variant="brand" asChild><SiteLink href="/news">Read more news articles</SiteLink></Button></div>
          </Reveal>
        </section>

        <section id="events" className="site-container scroll-mt-24 pb-16">
          <Reveal variant="up">
            <h2 className="section-title">Upcoming &amp; recent events at Nepal Hemophilia Society</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {events.map((event, index) => (
              <Reveal key={event.title} variant="up" delay={index * 60}>
                <TopicCard kicker={event.kicker} title={event.title} text={event.text} href={event.href} tone={event.tone} image={event.image} />
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" delay={180}>
            <div className="mt-6 text-center"><Button variant="brand" asChild><SiteLink href="/events/categories">See all events</SiteLink></Button></div>
          </Reveal>
        </section>

        <section className="bg-gold py-14">
          <div className="site-container">
            <Reveal variant="up">
              <h2 className="text-center text-3xl font-black text-gold-foreground">Members Stories</h2>
            </Reveal>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {stories.map((story, index) => (
                <Reveal key={story.title} variant="up" delay={index * 60}>
                  <article className="overflow-hidden rounded-md bg-background">
                    <div className="flex min-h-56 flex-col items-center p-7 text-center">
                      <h3 className="text-xl font-black text-primary">{story.title}</h3>
                      <p className="mt-4 text-sm leading-relaxed">{story.text}</p>
                      <Button variant="brand" className="mt-auto" asChild><SiteLink href={articleHref(storySlugs[index])}>Read more</SiteLink></Button>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal variant="up" delay={180}>
              <div className="mt-7 text-center"><Button variant="brand" asChild><SiteLink href="/support/our-community">Read all members stories</SiteLink></Button></div>
            </Reveal>
          </div>
        </section>

        <section id="join" className="site-container grid scroll-mt-24 gap-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {joinCards.map(([title, text, action, href], index) => (
            <Reveal key={title} variant="left" delay={index * 50}>
              <article className="action-card flex min-h-64 flex-col items-center p-6 text-center">
                <h3 className="text-xl font-black text-primary">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed">{text}</p>
                <Button variant="brand" className="mt-auto" asChild><SiteLink href={href}>{action}</SiteLink></Button>
              </article>
            </Reveal>
          ))}
        </section>

        <section id="understanding" className="scroll-mt-24 bg-magenta px-5 py-14">
          <Reveal variant="up">
            <div className="mx-auto max-w-3xl rounded-md bg-background px-8 py-12 text-center">
              <h2 className="text-3xl font-black leading-tight text-primary">Understanding Hemophilia &amp; other bleeding disorders</h2>
              <p className="mt-5 leading-relaxed">People with bleeding disorders have a condition that means their blood cannot clot properly. They may bleed for longer and can experience spontaneous bleeds into joints, muscles and soft tissues.</p>
              <p className="mt-4 font-bold text-primary">Common disorders include Hemophilia A &amp; B and Von Willebrand Disease.</p>
              <Button variant="brand" className="mt-6" asChild><SiteLink href="/bleeding-disorders/haemophilia">Browse bleeding disorder information</SiteLink></Button>
            </div>
          </Reveal>
        </section>
      </main>
    </SiteFrame>
  );
}
