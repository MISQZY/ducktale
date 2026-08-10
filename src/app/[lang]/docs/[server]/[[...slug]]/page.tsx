import { getPageImage, getDocsSource } from "@/lib/source";
import { SERVERS } from "@/config/servers";
import { REPO } from "@/config/site";
import { notFound } from "next/navigation";
import { Authors } from "@/components/docs/Authors";
import { GitHubLastModified } from "@/components/docs/GitHubLastModified";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from "fumadocs-ui/layouts/docs/page";
import { getMDXComponents } from "@/mdx-components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";

interface Params {
  lang: string;
  server: string;
  slug?: string[];
}

export default async function Page(props: {
  params: Promise<Params>;
}) {
  const { lang, server, slug = [] } = await props.params;

  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const source = getDocsSource(server);
  if (!source) notFound();

  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const filePath = `src/content/${server}/${page.path}`;

  const MDX = page.data.body;
  const filteredToc = page.data.toc.filter((item) => item.depth <= 3);

  return (
    <DocsPage
      toc={filteredToc}
      tableOfContent={{
        container: {
          className: "border-s border-border bg-fd-card ps-6",
        },
        header: <div className="docs-toc-container-marker" />,
        footer: (
          <div className="flex flex-col gap-4 mt-auto">
            {page.data.authors && <Authors ids={page.data.authors} />}
          </div>
        ),
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0!">
        {page.data.description}
      </DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <div className="mt-auto pt-4 border-t border-border flex justify-between items-center gap-4 text-xs">
        <GitHubLastModified filePath={filePath} />
        <EditOnGitHub href={REPO.editUrl(filePath)} />
      </div>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return SERVERS.flatMap((s) => {
    const source = getDocsSource(s.id);
    if (!source) return [];
    return source.generateParams().map((p) => ({ server: s.id, ...p }));
  });
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { lang, server, slug = [] } = await props.params;

  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const source = getDocsSource(server);
  if (!source) notFound();

  const page = source.getPage(slug, lang);
  if (!page) notFound();

  return {
    title: page.data.title + " | DuckTale",
    description: page.data.description,
    openGraph: {
      images: getPageImage(server, page).url,
    },
  };
}
