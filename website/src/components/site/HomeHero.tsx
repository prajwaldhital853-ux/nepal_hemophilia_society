import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import presidentImage from "@/assets/nhs-president.jpg";
import rallyImage from "@/assets/nhs-whd-rally.jpg";
import speakerImage from "@/assets/nhs-speaker.jpg";
import { Button } from "@/components/ui/button";

const heroSlides = [
  {
    src: rallyImage,
    alt: "Nepal Hemophilia Society members marking World Hemophilia Day in Kathmandu",
    title: "Together for life",
    text: "Families and volunteers mark World Hemophilia Day and ask for care in every province.",
  },
  {
    src: presidentImage,
    alt: "Nepal Hemophilia Society president speaking at a Kathmandu meeting",
    title: "A voice for patients",
    text: "Members and clinicians working together so people with hemophilia can live with dignity.",
  },
  {
    src: speakerImage,
    alt: "A clinician explaining hemophilia at a Nepal Hemophilia Society programme",
    title: "Learning and care",
    text: "Training and clear information so treatment reaches more people.",
  },
];

export function HomeHero() {
  const [heroIndex, setHeroIndex] = useState(0);
  const hero = heroSlides[heroIndex] ?? heroSlides[0];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  function showHero(next: number) {
    setHeroIndex((next + heroSlides.length) % heroSlides.length);
  }

  return (
    <section className="site-container">
      <div className="hero-shell relative w-full overflow-hidden bg-neutral-900">
        <div className="hero-media relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-[480px]">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.src}
              src={slide.src}
              width={1600}
              height={900}
              alt={index === heroIndex ? slide.alt : ""}
              fetchPriority={index === 0 ? "high" : "low"}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              sizes="(max-width: 1024px) 100vw, 1180px"
              className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${index === heroIndex ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="hero-gradient pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/5 lg:to-black/45" aria-hidden="true" />

          <div className="hero-copy-mobile absolute inset-x-0 bottom-0 z-10 bg-primary/92 px-5 py-6 text-primary-foreground sm:px-7 sm:py-7 lg:hidden">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{hero.title}</h1>
            <p className="mt-3 text-base font-semibold leading-relaxed sm:text-lg">{hero.text}</p>
          </div>

          <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between px-3 lg:hidden">
            <Button variant="paper" size="icon" aria-label="Previous slide" onClick={() => showHero(heroIndex - 1)}>
              <ChevronLeft />
            </Button>
            <Button variant="paper" size="icon" aria-label="Next slide" onClick={() => showHero(heroIndex + 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="hero-copy hidden lg:absolute lg:inset-y-0 lg:right-0 lg:z-10 lg:flex lg:w-[min(100%,440px)] lg:flex-col lg:justify-center lg:bg-primary/82 lg:px-10 lg:py-14 lg:text-primary-foreground lg:backdrop-blur-sm lg:clip-angle">
          <h1 className="text-4xl font-black leading-tight lg:text-5xl">{hero.title}</h1>
          <p className="mt-4 text-lg font-semibold leading-relaxed">{hero.text}</p>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[calc(100%-440px)] lg:block">
          <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2">
            <Button variant="paper" size="icon" aria-label="Previous slide" onClick={() => showHero(heroIndex - 1)}>
              <ChevronLeft />
            </Button>
          </div>
          <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
            <Button variant="paper" size="icon" aria-label="Next slide" onClick={() => showHero(heroIndex + 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
