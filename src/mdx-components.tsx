import defaultMdxComponents from "fumadocs-ui/mdx";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";
import { LinkIcon } from "lucide-react";
import Image from "next/image";
import * as DocsComponents from "@/components/docs";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
} from "@/components/ui/docs-table";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
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
    ...DocsComponents,
    ...components,
    h1: ({ id, children, ...props }) => (
      <h1
        id={id}
        {...props}
        className="group border-b border-border pb-3 mb-8 mt-2 scroll-m-20 text-3xl font-bold flex justify-between items-center gap-2"
      >
        <a href={`#${id}`} className="no-underline font-bold">
          {children}
        </a>
        <LinkIcon
          size={20}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-fd-muted-foreground"
        />
      </h1>
    ),
    img: ({ src, alt, width, height, ...rest }) => {
      const imageSrc =
        typeof src === "object" && src !== null
          ? (src as unknown as { src: string }).src
          : src;
      if (!imageSrc) return null;

      const imgWidth = typeof width === "number" ? width : typeof width === "string" ? parseInt(width, 10) || 1200 : 1200;
      const imgHeight = typeof height === "number" ? height : typeof height === "string" ? parseInt(height, 10) || 630 : 630;

      return (
        <span className="block w-full">
          <Image
            src={imageSrc}
            alt={alt || "image"}
            width={imgWidth}
            height={imgHeight}
            sizes="100vw"
            {...rest}
            className="rounded-lg w-fit h-auto my-2!"
          />
        </span>
      );
    },
  };
}
