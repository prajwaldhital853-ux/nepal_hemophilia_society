import type { ReactNode } from "react";

import { cardImages, type CardImage } from "@/assets/cards";
import { SiteLink } from "@/components/site/SiteLink";
import type { Tone } from "@/data/pages";

const tones: Record<Tone, string> = {
  primary: "bg-primary",
  magenta: "bg-magenta",
  sky: "bg-sky",
  orange: "bg-orange",
  gold: "bg-gold",
};

function CardLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <SiteLink href={href} className={className}>
      {children}
    </SiteLink>
  );
}

export function TopicCard({
  title,
  text,
  href,
  tone,
  image,
  kicker,
}: {
  title: string;
  text: string;
  href: string;
  tone: Tone;
  image: CardImage;
  kicker?: string;
}) {
  return (
    <article className="topic-card flex h-full flex-col overflow-hidden bg-white shadow-md">
      <CardLink href={href} className="flex flex-1 flex-col text-left no-underline">
        <img src={cardImages[image]} alt="" className="aspect-[16/10] w-full object-cover" />
        <div className={`${tones[tone]} flex flex-1 flex-col items-center px-6 pb-8 pt-7 text-center ${tone === "gold" ? "text-neutral-900" : "text-white"}`}>
          {kicker ? <p className="text-xs font-extrabold uppercase tracking-wide opacity-90">{kicker}</p> : null}
          <h3 className={`text-2xl font-black leading-tight ${kicker ? "mt-3" : ""}`}>{title}</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed">{text}</p>
          <span className="mt-6 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-black text-primary shadow-sm">
            Read more
          </span>
        </div>
      </CardLink>
    </article>
  );
}
