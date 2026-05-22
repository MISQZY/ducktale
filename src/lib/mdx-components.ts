import defaultMdxComponents from "fumadocs-ui/mdx";
import { PageEmbed } from "@/components/docs/PageEmbed";
import { ServerAddress } from "@/components/docs/ServerAddress";
import { CommandCard } from "@/components/docs/CommandCard";
import { RuleTable } from "@/components/docs/RuleTable";
import { Callout } from "@/components/docs/Callout";
import { StepList } from "@/components/docs/StepList";
import { FeatureGrid } from "@/components/docs/FeatureGrid";
import { ItemCard } from "@/components/docs/ItemCard";
import { ServerStatusWidget } from "@/components/docs/ServerStatusWidget";

export const docsComponents = {
  ...defaultMdxComponents,

  PageEmbed,
  ServerAddress,

  Callout,
  StepList,

  CommandCard,
  RuleTable,
  FeatureGrid,
  ItemCard,
  ServerStatusWidget,
};