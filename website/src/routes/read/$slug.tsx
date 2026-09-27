import { createFileRoute, notFound } from "@tanstack/react-router";

import { ContentPage } from "@/components/site/ContentPage";
import { getArticle, tryGetArticle } from "@/data/articles";

export const Route = createFileRoute("/read/$slug")({
  head: ({ params }) => {
    const page = tryGetArticle(params.slug);
    if (!page) return { meta: [{ title: "Not found | Nepal Hemophilia Society" }] };
    return {
      meta: [
        { title: `${page.title} | Nepal Hemophilia Society` },
        { name: "description", content: page.description },
        { property: "og:title", content: `${page.title} | Nepal Hemophilia Society` },
        { property: "og:description", content: page.description },
      ],
    };
  },
  component: function ReadPage() {
    const { slug } = Route.useParams();
    let page;
    try {
      page = getArticle(slug);
    } catch {
      throw notFound();
    }
    return <ContentPage page={page} />;
  },
});
