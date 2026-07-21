import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import type { MDXComponents } from 'mdx/types';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { LinkIcon } from 'lucide-react';
import Image from 'next/image';
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
  GitHubLastModified,
} from '@/components/docs';
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
} from '@/components/ui/docs-table';
import { EventTimeline } from '@/components/docs/EventTimeLine';
import { PermissionTable } from '@/components/docs/PermissionTable';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    ...TabsComponents,
    Steps,
    Step,
    Accordion,
    Accordions,
    table: DocsTable,
    thead: DocsTableHeader,
    tbody: DocsTableBody,
    tr: DocsTableRow,
    th: DocsTableHead,
    td: DocsTableCell,
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
    EventTimeline,
    PermissionTable,
    GitHubLastModified,
    h1: ({ id, children, ...props }) => (
      <h1
        id={id}
        {...props}
        className="group border-b border-fd-border pb-3 mb-8 mt-2 scroll-m-20 text-3xl font-bold flex justify-between items-center gap-2"
      >
        <a
          href={`#${id}`}
          className="no-underline font-bold"
        >
          {children}
        </a>

        <LinkIcon
          size={20}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-fd-muted-foreground"
        />
      </h1>
    ),
    img: (props) => {
      const { src, alt, width: _width, height: _height, ...rest } = props;
      const imageSrc = typeof src === 'object' && src !== null
          ? (src as unknown as { src: string }).src
          : src;
      if (!imageSrc) return null;

      return (
        <span className="block w-full">
          <Image
            src={imageSrc}
            alt={alt || 'image'}
            width={1200}
            height={630}
            sizes="100vw"
            {...rest}
            className="rounded-lg w-fit h-auto my-2!"
          />
        </span>
      );
    },
  };
}
