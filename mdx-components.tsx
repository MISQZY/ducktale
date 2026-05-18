import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ServerAddress } from "@/components/docs/ServerAddress";
import { PageEmbed } from "@/components/docs/PageEmbed"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    PageEmbed,
    ServerAddress,
    ...components,
  };
}
