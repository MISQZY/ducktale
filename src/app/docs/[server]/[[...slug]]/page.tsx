import { getPageImage, getDocsSource } from "@/lib/source";
import { SERVERS } from "@/config/servers";
import { notFound } from "next/navigation";
import { execSync } from "child_process";
import { Authors } from "@/components/docs/Authors";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  PageLastUpdate,
} from "fumadocs-ui/layouts/docs/page";
import { getMDXComponents } from "@/mdx-components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";

interface Params {
  server: string;
  slug?: string[];
}

export default async function Page(props: {
  params: Promise<Params>;
}) {
  const { server, slug = [] } = await props.params;

  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const source = getDocsSource(server);
  if (!source) notFound();

  const page = source.getPage(slug);
  if (!page) notFound();

  const filePath = `src/content/${server}/${page.path}`;
  const lastModified = getGitLastModified(filePath);

  const MDX = page.data.body;
  const filteredToc = page.data.toc.filter((item) => item.depth <= 3);

  return (
    <DocsPage
      toc={filteredToc}
      tableOfContent={{
        footer: page.data.authors ? (
          <Authors ids={page.data.authors} />
        ) : null,
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
        <div className="flex justify-between items-center">
          {lastModified && <PageLastUpdate date={lastModified} />}
          <EditOnGitHub
            href={`https://github.com/your-org/ducktale/edit/master/${filePath}`}
          />
        </div>
      </DocsBody>
    </DocsPage>
  );
}

export function getGitLastModified(filePath: string): Date | null {
  try {
    const result = execSync(`git log -1 --format="%aI" -- "${filePath}"`, {
      encoding: "utf8",
    }).trim();
    return result ? new Date(result) : null;
  } catch {
    return null;
  }
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
  const { server, slug = [] } = await props.params;

  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const source = getDocsSource(server);
  if (!source) notFound();

  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title + " | DuckTale",
    description: page.data.description,
    openGraph: {
      images: getPageImage(server, page).url,
    },
  };
}
