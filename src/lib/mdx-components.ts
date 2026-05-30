import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  Callout,
  CommandCard,
  FeatureGrid,
  ItemCard,
  PageEmbed,
  ResourceCard,
  ResourceCardGrid,
  RuleTable,
  ServerAddress,
  ServerStatusWidget,
  StepList,
  WhitelistTable,
} from "@/components/docs";

import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
} from "@/components/ui/docs-table";
import { EventTimeline } from "@/components/docs/EventTimeLine";

export const docsComponents = {
  ...defaultMdxComponents,
  table:  DocsTable,
  thead:  DocsTableHeader,
  tbody:  DocsTableBody,
  tr:     DocsTableRow,
  th:     DocsTableHead,
  td:     DocsTableCell,
  Callout,
  CommandCard,
  FeatureGrid,
  ItemCard,
  PageEmbed,
  ResourceCard,
  ResourceCardGrid,
  RuleTable,
  ServerAddress,
  ServerStatusWidget,
  StepList,
  WhitelistTable,
  EventTimeline
};
