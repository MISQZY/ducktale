import defaultMdxComponents from "fumadocs-ui/mdx";
import { PageEmbed } from "@/components/docs/PageEmbed";
import { ServerAddress } from "@/components/docs/ServerAddress";

export const docsComponents = {
  ...defaultMdxComponents,
  PageEmbed,
  ServerAddress,
};