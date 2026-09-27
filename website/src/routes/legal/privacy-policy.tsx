import { createFileRoute } from "@tanstack/react-router";

import { ContentPage } from "@/components/site/ContentPage";
import { getLegalPage } from "@/data/legal-pages";

const page = getLegalPage("/legal/privacy-policy");

export const Route = createFileRoute("/legal/privacy-policy")({
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
