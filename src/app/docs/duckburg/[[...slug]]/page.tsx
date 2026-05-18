import { duckburgSource } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { PageEmbed } from "@/components/ui/PageEmbed";

export default async function DuckBurgPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = duckburgSource.getPage(slug);

  if (!page) notFound();

  const MDX = (page.data as any).body;
  const data = page.data as any;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, PageEmbed }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return duckburgSource.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = duckburgSource.getPage(slug);
  if (!page) notFound();
  return {
    title: "DuckBurg | " + page.data.title,
    description: page.data.description,
  };
}
