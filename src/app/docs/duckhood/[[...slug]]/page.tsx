import { duckhoodSource } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";

export default async function DuckHoodPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = duckhoodSource.getPage(slug);

  if (!page) notFound();

  const MDX = (page.data as any).body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return duckhoodSource.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = duckhoodSource.getPage(slug);
  if (!page) notFound();
  return {
    title: "DuckHood | " + page.data.title,
    description: page.data.description,
  };
}
