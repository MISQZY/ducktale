import { getDocsSource } from "@/lib/source";
import { SERVERS } from "@/config/servers";
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { docsComponents } from "@/lib/mdx-components";
import type { ExtendedPage } from "@/lib/source";
import type { TOCItemType } from 'fumadocs-core/toc';
import { GitHubLastModified } from "@/components/docs/GitHubLastModified";

export default async function DocsServerPage({
  params,
}: {
  params: Promise<{ server: string; slug?: string[] }>;
}) {
  const { server, slug } = await params;

  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const source = getDocsSource(server);

  const page = await source.getPage(slug || []);
  if (!page) notFound();

  const { body: MDX, toc, full, title, description } =
    page.data as ExtendedPage;

  if (!MDX) notFound();

  const filePath = `content/${server}/${page.path}`;

  return (
    <DocsPage toc={(toc as TOCItemType[]) || []} full={full ?? false}>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <MDX components={docsComponents} />
      </DocsBody>
      <GitHubLastModified filePath={filePath} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return SERVERS.flatMap((s) =>
    getDocsSource(s.id)
      .generateParams()
      .map((p) => ({ server: s.id, ...p }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ server: string; slug?: string[] }>;
}) {
  const { server, slug } = await params;
  const config = SERVERS.find((s) => s.id === server);
  const source = getDocsSource(server);
  const page = await source.getPage(slug || []);
  if (!page) notFound();

  return {
    title: `${config?.name ?? server} | ${page.data.title}`,
    description: page.data.description,
  };
}