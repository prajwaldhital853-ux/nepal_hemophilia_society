import { BookOpen, Eye, Flag, Handshake, Phone, Sprout, Users } from "lucide-react";

import advocacyImage from "@/assets/nhs-advocacy.jpg";
import campImage from "@/assets/nhs-camp.jpg";
import { Reveal } from "@/components/site/Reveal";
import { SiteLink } from "@/components/site/SiteLink";
import { Button } from "@/components/ui/button";

const focus = [
  {
    title: "Awareness",
    icon: BookOpen,
    text: "Many people in Nepal still live with an undiagnosed bleeding disorder. NHS teaches families, teachers and health workers what a bleed looks like and where to get tested.",
  },
  {
    title: "Progress",
    icon: Sprout,
    text: "Since 1992 NHS has registered patients, opened a path to safer treatment products, and helped treatment centres learn how to care for hemophilia.",
  },
  {
    title: "Advocacy",
    icon: Handshake,
    text: "NHS asks the Ministry of Health and provincial governments to fund diagnosis, factor treatment and comprehensive care in every province.",
  },
];

export function FeatureSections() {
  return (
    <>
      <section className="relative overflow-hidden bg-neutral-900 py-20 text-white lg:py-24">
        <img src={advocacyImage} alt="" className="absolute inset-0 size-full object-cover opacity-40 grayscale" />
        <div className="relative site-container">
          <Reveal variant="up">
            <p className="mx-auto w-fit rounded-sm bg-primary px-4 py-1.5 text-sm font-black tracking-wide">WHAT WE DO</p>
            <h2 className="mt-5 text-center text-4xl font-black sm:text-5xl">Our areas of focus</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {focus.map((item, index) => (
              <Reveal key={item.title} variant="up" delay={index * 60}>
                <article className="focus-card flex min-h-80 flex-col items-center bg-white px-8 py-12 text-center text-foreground shadow-xl lg:min-h-[26rem]">
                  <item.icon className="size-16 text-primary lg:size-20" strokeWidth={1.6} />
                  <h3 className="mt-6 text-2xl font-black">{item.title}</h3>
                  <p className="mt-4 text-base leading-relaxed">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 lg:py-20">
        <div className="site-container">
          <Reveal variant="up">
            <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">
              OUR <span className="text-primary">VISION & MISSION</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-2">
            <Reveal variant="up" delay={0}>
              <article className="vision-card flex h-full min-h-[26rem] flex-col bg-white p-8 shadow-md lg:p-10">
                <Eye className="size-10 text-primary" />
                <h3 className="mt-5 text-2xl font-black">VISION</h3>
                <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-relaxed">
                  <li>Comprehensive care of hemophilia, so people can live with dignity.</li>
                  <li>A Nepal where a bleeding disorder does not decide a child’s future.</li>
                </ul>
                <div className="vision-bar mt-auto h-1.5 w-20 bg-primary" />
              </article>
            </Reveal>
            <Reveal variant="up" delay={70}>
              <article className="vision-card flex h-full min-h-[26rem] flex-col bg-white p-8 shadow-md lg:p-10">
                <Flag className="size-10 text-primary" />
                <h3 className="mt-5 text-2xl font-black">MISSION</h3>
                <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-relaxed">
                  <li>Find and register people with hemophilia and other bleeding disorders.</li>
                  <li>Give families and health workers clear information about care.</li>
                  <li>Help treatment reach patients, including through provincial centres.</li>
                  <li>Advocate with government so safe treatment is a right, not a favour.</li>
                </ul>
                <div className="vision-bar mt-auto h-1.5 w-20 bg-primary" />
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="site-container grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal variant="left">
            <div className="relative">
              <div className="absolute -bottom-3 -left-3 hidden h-full w-full rounded-2xl bg-primary sm:block" aria-hidden="true" />
              <img
                src={campImage}
                alt="A physiotherapist working with a child at a Nepal Hemophilia Society health camp"
                className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
              />
            </div>
          </Reveal>
          <Reveal variant="up" delay={60}>
            <div className="rounded-2xl bg-white p-8 shadow-lg lg:p-10">
              <p className="text-xs font-black tracking-[0.14em] text-primary">TOGETHER FOR LIFE</p>
              <h2 className="mt-3 text-4xl font-black leading-tight">You are not alone,</h2>
              <p className="mt-4 leading-relaxed">
                A bleeding disorder changes daily life, but it does not have to be faced on your own. Nepal Hemophilia Society connects patients, parents and clinicians so care, information and a community are within reach.
              </p>
              <ul className="mt-5 space-y-3 text-sm font-bold">
                <li className="flex items-center gap-2"><Users className="size-4 text-primary" /> Families who already know this path</li>
                <li className="flex items-center gap-2"><Handshake className="size-4 text-primary" /> Chapters and clinicians near you</li>
                <li className="flex items-center gap-2"><Phone className="size-4 text-primary" /> The Kathmandu office, Sunday to Friday</li>
              </ul>
              <Button variant="brand" className="mt-6 rounded-full px-6" asChild>
                <SiteLink href="/about">More about the Society</SiteLink>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

    </>
  );
}
