import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Handshake, Mail, MapPin, Phone, Sprout } from "lucide-react";

import advocacyImage from "@/assets/nhs-advocacy.jpg";
import campImage from "@/assets/nhs-camp.jpg";
import groupImage from "@/assets/nhs-group.jpg";
import membersImage from "@/assets/nhs-members.jpg";
import tableImage from "@/assets/nhs-table.jpg";
import { Reveal } from "@/components/site/Reveal";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SiteLink } from "@/components/site/SiteLink";
import { TopicCard } from "@/components/site/TopicCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Nepal Hemophilia Society" },
      { name: "description", content: "Who we are, what we stand for, and how Nepal Hemophilia Society has supported families since 1992." },
      { property: "og:title", content: "About Us | Nepal Hemophilia Society" },
      { property: "og:description", content: "Comprehensive care of hemophilia — together for life across Nepal." },
    ],
  }),
  component: AboutPage,
});

const milestones = [
  { year: "1992", text: "Nepal Hemophilia Society is founded so families have a voice and a place to register." },
  { year: "2000s", text: "Patient registration grows and links with hospitals begin in Kathmandu and beyond." },
  { year: "2010s", text: "Chapters open in provinces; advocacy pushes for safer clotting factor and diagnosis." },
  { year: "Today", text: "NHS connects families, clinicians and government so care can reach every province." },
];

const focus = [
  { title: "Awareness", icon: BookOpen, text: "Teaching families, teachers and health workers what a bleed looks like and where to get tested." },
  { title: "Progress", icon: Sprout, text: "Registering patients and helping treatment centres learn how to care for hemophilia." },
  { title: "Advocacy", icon: Handshake, text: "Asking government to fund diagnosis, factor treatment and comprehensive care nationwide." },
];

const gallery = [
  { src: campImage, alt: "Health camp support for children with hemophilia" },
  { src: tableImage, alt: "Members and clinicians discussing care at a meeting" },
  { src: advocacyImage, alt: "Advocacy meeting with government stakeholders" },
];

function AboutPage() {
  return (
    <SiteFrame>
      <main className="page-main page-enter">
        <section className="relative overflow-hidden bg-neutral-900 text-white">
          <img src={groupImage} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
          <div className="hero-gradient pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" aria-hidden="true" />
          <div className="site-container relative py-14 sm:py-20 lg:py-24">
            <Reveal variant="up">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-white/90">
                <SiteLink href="/" className="hover:underline">Home</SiteLink>
                <span aria-hidden="true">/</span>
                <span>About us</span>
              </nav>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">About Nepal Hemophilia Society</h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-relaxed text-white/95">
                Since 1992 we have stood with people affected by hemophilia and other bleeding disorders — finding families, sharing knowledge, and asking for care that reaches every province.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="brand" asChild><SiteLink href="/get-involved/join">Become a member</SiteLink></Button>
                <Button variant="paper" asChild><SiteLink href="/bleeding-disorders/treatment-centres">Find a centre</SiteLink></Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="site-container py-14 lg:py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <Reveal variant="left">
              <h2 className="text-3xl font-black text-primary">Who we are</h2>
              <p className="mt-4 leading-relaxed">
                Nepal Hemophilia Society is a nonprofit organisation for people with hemophilia, von Willebrand disease and related conditions. We work with families, volunteer chapters and hospital treatment centres so diagnosis is not the end of the story.
              </p>
              <p className="mt-4 leading-relaxed">
                Living with a bleeding disorder is never black and white. Life after diagnosis may start out hard, but we learn by doing, asking questions and surrounding ourselves with people who understand. Through our community, families find freedom, opportunity and confidence.
              </p>
              <p className="mt-4 leading-relaxed">
                The Kathmandu office in Anamnagar is open Sunday to Friday, 9 am to 5 pm. Call 01-5172729 or email nepalhemo@gmail.com before you travel to a clinic day in another district.
              </p>
            </Reveal>
            <Reveal variant="up" delay={60}>
              <img src={membersImage} alt="Nepal Hemophilia Society members at a meeting in Kathmandu" className="aspect-[4/3] w-full rounded-md object-cover shadow-lg" />
            </Reveal>
          </div>
        </section>

        <section className="bg-secondary py-14 lg:py-16">
          <div className="site-container">
            <Reveal variant="up">
              <h2 className="text-center text-3xl font-black text-primary sm:text-4xl">Our journey</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {milestones.map((item, index) => (
                <Reveal key={item.year} variant="up" delay={index * 60}>
                  <article className="h-full rounded-md border border-border bg-white p-6 shadow-sm">
                    <p className="text-2xl font-black text-primary">{item.year}</p>
                    <p className="mt-3 text-sm leading-relaxed">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="site-container py-14 lg:py-16">
          <Reveal variant="up">
            <h2 className="text-center text-3xl font-black sm:text-4xl">
              Our <span className="text-primary">vision & mission</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Reveal variant="up" delay={0}>
              <article className="h-full rounded-md bg-white p-8 shadow-md lg:p-10">
                <h3 className="text-2xl font-black text-primary">Vision</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
                  <li>Comprehensive care of hemophilia, so people can live with dignity.</li>
                  <li>A Nepal where a bleeding disorder does not decide a child&apos;s future.</li>
                </ul>
              </article>
            </Reveal>
            <Reveal variant="up" delay={70}>
              <article className="h-full rounded-md bg-white p-8 shadow-md lg:p-10">
                <h3 className="text-2xl font-black text-primary">Mission</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
                  <li>Find and register people with hemophilia and other bleeding disorders.</li>
                  <li>Give families and health workers clear information about care.</li>
                  <li>Help treatment reach patients, including through provincial centres.</li>
                  <li>Advocate with government so safe treatment is a right, not a favour.</li>
                </ul>
              </article>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-neutral-900 py-16 text-white lg:py-20">
          <img src={advocacyImage} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
          <div className="site-container relative">
            <Reveal variant="up">
              <h2 className="text-center text-3xl font-black sm:text-4xl">What we focus on</h2>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {focus.map((item, index) => (
                <Reveal key={item.title} variant="up" delay={index * 60}>
                  <article className="flex min-h-64 flex-col items-center bg-white px-8 py-10 text-center text-foreground shadow-xl">
                    <item.icon className="size-14 text-primary" strokeWidth={1.6} />
                    <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="site-container py-14 lg:py-16">
          <Reveal variant="up">
            <h2 className="text-center text-3xl font-black text-primary">Life with the Society</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((photo, index) => (
              <Reveal key={photo.src} variant="up" delay={index * 60} className={index === 2 ? "sm:col-span-2 lg:col-span-1" : ""}>
                <img src={photo.src} alt={photo.alt} className="aspect-[4/3] w-full rounded-md object-cover shadow-md" />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bg-primary py-14 text-primary-foreground lg:py-16">
          <div className="site-container grid gap-8 lg:grid-cols-2 lg:items-center">
            <Reveal variant="left">
              <h2 className="text-3xl font-black">Visit or call the office</h2>
              <p className="mt-4 leading-relaxed text-primary-foreground/95">
                Anamnagar, Rudmatti Marg, Kathmandu. We answer questions about registration, chapters, treatment centres and how to get involved.
              </p>
              <ul className="mt-6 space-y-3 text-sm font-bold">
                <li className="flex items-center gap-2"><MapPin className="size-4" /> Kathmandu, Nepal</li>
                <li className="flex items-center gap-2"><Phone className="size-4" /><a href="tel:+97715172729" className="hover:underline">01-5172729</a></li>
                <li className="flex items-center gap-2"><Mail className="size-4" /><a href="mailto:nepalhemo@gmail.com" className="hover:underline">nepalhemo@gmail.com</a></li>
              </ul>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              <Reveal variant="up" delay={0}>
                <TopicCard title="Join us" text="Register as a member, parent, clinician or volunteer." href="/get-involved/join" tone="gold" image="hands" />
              </Reveal>
              <Reveal variant="up" delay={60}>
                <TopicCard title="Our community" text="Meet families and chapters across Nepal." href="/support/our-community" tone="sky" image="newsKathmandu" />
              </Reveal>
            </div>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
