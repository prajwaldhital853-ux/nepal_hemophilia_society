import { useState, type FormEvent, type ReactNode } from "react";

import advocacyImage from "@/assets/nhs-advocacy.jpg";
import birImage from "@/assets/nhs-bir-hospital.jpg";
import campImage from "@/assets/nhs-camp.jpg";
import groupImage from "@/assets/nhs-group.jpg";
import membersImage from "@/assets/nhs-members.jpg";
import presidentImage from "@/assets/nhs-president.jpg";
import rallyImage from "@/assets/nhs-whd-rally.jpg";
import speakerImage from "@/assets/nhs-speaker.jpg";
import tableImage from "@/assets/nhs-table.jpg";
import { Reveal } from "@/components/site/Reveal";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SiteLink } from "@/components/site/SiteLink";
import { TopicCard } from "@/components/site/TopicCard";
import { Button } from "@/components/ui/button";
import { articleHref } from "@/data/articles";
import type { PageDoc, Photo } from "@/data/pages";

const photos: Record<Photo, string> = {
  advocacy: advocacyImage,
  president: presidentImage,
  members: membersImage,
  speaker: speakerImage,
  camp: campImage,
  table: tableImage,
  group: groupImage,
  rally: rallyImage,
  bir: birImage,
};

function revealDelay(index: number, step = 35, max = 175) {
  return Math.min(index * step, max);
}

function AnimatedBlock({
  index,
  variant = "up",
  children,
  className = "",
}: {
  index: number;
  variant?: "up" | "left";
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal variant={variant} delay={revealDelay(index)} className={className}>
      {children}
    </Reveal>
  );
}

function MessageForm({ intent }: { intent: "join" | "message" }) {
  const [sentHint, setSentHint] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const district = String(data.get("district") ?? "").trim();
    const role = String(data.get("role") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = intent === "join" ? "Membership request" : "Support request";
    const body = [`Name: ${name}`, `Phone: ${phone}`, `District: ${district}`, `I am: ${role}`, "", message].join("\n");
    const href = `mailto:nepalhemo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSentHint("Your email app should open with this message addressed to nepalhemo@gmail.com. If it does not, call 01-5172729.");
    window.location.href = href;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-xl gap-4 rounded-md border border-border bg-white p-6">
      <label className="grid gap-1 text-sm font-extrabold">
        Name
        <input required name="name" autoComplete="name" className="h-10 rounded-md border border-input px-3 font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-extrabold">
        Phone
        <input required name="phone" autoComplete="tel" inputMode="tel" className="h-10 rounded-md border border-input px-3 font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-extrabold">
        District
        <input required name="district" className="h-10 rounded-md border border-input px-3 font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-extrabold">
        I am
        <select name="role" required className="h-10 rounded-md border border-input bg-white px-3 font-semibold" defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          <option>A person with a bleeding disorder</option>
          <option>A parent or family member</option>
          <option>A clinician</option>
          <option>A volunteer or supporter</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-extrabold">
        Message
        <textarea required name="message" rows={5} className="rounded-md border border-input px-3 py-2 font-semibold" placeholder={intent === "join" ? "Tell us how you would like to be involved." : "Say what you need. Leave out ID numbers and full medical files."} />
      </label>
      <Button type="submit" variant="brand" className="w-fit">
        {intent === "join" ? "Send membership request" : "Email the office"}
      </Button>
      {sentHint ? <p className="text-sm font-semibold text-primary">{sentHint}</p> : null}
    </form>
  );
}

export function ContentPage({ page }: { page: PageDoc }) {
  return (
    <SiteFrame>
      <main className="page-main page-enter">
        <article className="site-container py-10 lg:py-12">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-primary">
            {page.crumbs.map((crumb, index) => (
              <span key={crumb.label} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {crumb.href ? <SiteLink href={crumb.href} className="hover:underline">{crumb.label}</SiteLink> : <span className="text-foreground">{crumb.label}</span>}
              </span>
            ))}
          </nav>
          <div className="page-prose mt-4">
            <AnimatedBlock index={0}>
              <h1 className="text-4xl font-black leading-tight text-primary sm:text-5xl">{page.title}</h1>
              <p className="mt-6 text-lg font-semibold leading-relaxed">{page.lead}</p>
            </AnimatedBlock>
            {page.blocks.map((block, index) => {
              const blockIndex = index + 1;
              if (block.kind === "p") {
                return (
                  <AnimatedBlock key={index} index={blockIndex}>
                    <p className="mt-4 leading-relaxed">{block.text}</p>
                  </AnimatedBlock>
                );
              }
              if (block.kind === "h2") {
                return (
                  <AnimatedBlock key={index} index={blockIndex}>
                    <h2 id={block.id} className="mt-10 scroll-mt-24 text-2xl font-black text-primary">{block.text}</h2>
                  </AnimatedBlock>
                );
              }
              if (block.kind === "ul") {
                return (
                  <AnimatedBlock key={index} index={blockIndex}>
                    <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
                      {block.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </AnimatedBlock>
                );
              }
              if (block.kind === "note") {
                return (
                  <AnimatedBlock key={index} index={blockIndex}>
                    <p className="mt-8 rounded-md border border-primary/30 bg-secondary p-4 text-sm leading-relaxed">{block.text}</p>
                  </AnimatedBlock>
                );
              }
              if (block.kind === "cards") {
                const grid =
                  block.items.length === 2
                    ? "sm:grid-cols-2"
                    : block.items.length >= 4
                      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                      : "sm:grid-cols-2 lg:grid-cols-3";
                return (
                  <div key={index} className={`topic-card-grid mt-10 grid w-full items-stretch gap-5 ${grid}`}>
                    {block.items.map((card, cardIndex) => (
                      <Reveal key={card.title} variant="up" delay={cardIndex * 60} className="h-full">
                        <TopicCard title={card.title} text={card.text} href={card.href} tone={card.tone} image={card.image} />
                      </Reveal>
                    ))}
                  </div>
                );
              }
              if (block.kind === "links") {
                return (
                  <div key={index} className="mt-6 grid gap-3">
                    {block.items.map((item, linkIndex) => (
                      <Reveal key={item.title} variant="left" delay={linkIndex * 50}>
                        <SiteLink href={item.href} className="block rounded-md border border-border bg-white p-5 hover:border-primary">
                          <span className="block font-black text-primary">{item.title}</span>
                          <span className="mt-1 block text-sm leading-relaxed">{item.text}</span>
                          {!item.href.startsWith("http") && !item.href.startsWith("mailto:") ? (
                            <span className="mt-3 inline-flex text-sm font-black text-primary">Read more →</span>
                          ) : null}
                        </SiteLink>
                      </Reveal>
                    ))}
                  </div>
                );
              }
              if (block.kind === "faq") {
                return (
                  <AnimatedBlock key={index} index={blockIndex}>
                    <div className="mt-6 divide-y divide-border border-y border-border">
                      {block.items.map((item, faqIndex) => (
                        <Reveal key={item.q} variant="up" delay={faqIndex * 40}>
                          <details className="faq py-1">
                            <summary className="cursor-pointer py-3 font-black">{item.q}</summary>
                            <p className="pb-4 leading-relaxed">{item.a}</p>
                          </details>
                        </Reveal>
                      ))}
                    </div>
                  </AnimatedBlock>
                );
              }
              if (block.kind === "articles") {
                return (
                  <div key={index} className="mt-8 grid gap-6">
                    {block.items.map((article, articleIndex) => (
                      <Reveal key={article.id} variant="up" delay={articleIndex * 70}>
                        <article id={article.id} className="scroll-mt-24 overflow-hidden rounded-md border border-border bg-white">
                          <img src={photos[article.photo]} alt="" className="aspect-[16/7] w-full object-cover" />
                          <div className="p-6">
                            <time className="text-xs font-extrabold text-primary">{article.date}</time>
                            <h2 className="mt-2 text-2xl font-black">{article.title}</h2>
                            {article.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 leading-relaxed">{paragraph}</p>)}
                            <SiteLink href={articleHref(article.id)} className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-black text-primary-foreground">
                              Read more
                            </SiteLink>
                          </div>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                );
              }
              return (
                <AnimatedBlock key={index} index={blockIndex}>
                  <MessageForm intent={block.intent} />
                </AnimatedBlock>
              );
            })}
          </div>
        </article>
      </main>
    </SiteFrame>
  );
}
