import { createFileRoute } from "@tanstack/react-router";

import { ContentPage } from "@/components/site/ContentPage";
import { getPage } from "@/data/pages";

const page = getPage("/support/day-day-living");

export const Route = createFileRoute("/support/day-day-living")({
  head: () => ({
    meta: [
      { title: `${page.title} | Nepal Hemophilia Society` },
      { name: "description", content: page.description },
      { property: "og:title", content: `${page.title} | Nepal Hemophilia Society` },
      { property: "og:description", content: page.description },
    ],
  }),
  component: function Page() {
    return <ContentPage page={page} />;
  },
});
