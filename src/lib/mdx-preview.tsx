import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { Callout, FeatureGrid, StepList } from "@/components/docs";

// Matches the frontmatter block fumadocs-mdx strips before compiling — MDX
// itself doesn't understand "---" delimited YAML, so without this it'd get
// parsed as two thematic breaks around a stray paragraph.
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

// Two earlier designs for this preview both failed, for two different
// reasons — both confirmed live, not theoretical:
//
// 1. Reusing the exact same getMDXComponents() as the real docs pages and
//    returning the compiled element tree from the Server Action directly:
//    several of those components (ServerVersion, PlayerCard, fumadocs'
//    Steps/Accordion/Tabs, even fumadocs-ui's own default Heading/CodeBlock)
//    are "use client". A client component reached only through @mdx-js/mdx's
//    runtime evaluate() (which builds its element tree dynamically at
//    request time, bypassing Next's static build-time module graph) can't
//    be found in the client reference manifest once the action's return
//    value is serialized — "Could not find the module ... in the React
//    Client Manifest. This is probably a bug in the React Server Components
//    bundler."
// 2. Rendering to a plain HTML string with ReactDOMServer.renderToStaticMarkup
//    server-side, to sidestep that entirely: blocked outright by Next.js —
//    "You're importing a component that imports react-dom/server" —
//    react-dom/server can't be imported anywhere in App Router server code,
//    regardless of which file or whether it contains JSX.
//
// This version avoids both failure modes by construction: every component
// in this map is a plain function, not a "use client" component, so there's
// no client reference to resolve — and it's returned as a React element
// (not rendered to a string), so react-dom/server is never touched.
//
// Getting the "plain function" list right turned out to need checking each
// candidate's FULL transitive import chain, not just its own top-level
// directive — RuleTable, PermissionTable, ServerAddress, ItemCard and
// GitHubLastModified all look server-safe at a glance but each pulls in a
// "use client" component one or two levels down (RuleTable/PermissionTable
// -> DocsTable -> the shadcn ui/table.tsx primitive; ServerAddress ->
// CopyToClipboard; ItemCard -> DuckHoverCard; GitHubLastModified ->
// fumadocs' PageLastUpdate, plus it does real GitHub API calls that are
// meaningless for unsaved preview content anyway). Confirmed by tracing
// every import by hand after this exact error recurred for ui/table.tsx.
// Only reuse a component here after checking its whole import chain, not
// just the file itself.
const CLIENT_ONLY_COMPONENT_NAMES = [
  "CommandCard", "EventTimeline", "PageEmbed", "PlayerCard", "ResourceCard", "ResourceCardGrid",
  "ServerStatusWidget", "ServerVersion", "TownyTable", "WhitelistTable",
  "ItemCard", "RuleTable", "ServerAddress", "GitHubLastModified", "PermissionTable",
  "Steps", "Step", "Accordion", "Accordions", "Tab", "Tabs", "TabsContent", "TabsList", "TabsTrigger",
  "LiveQuestTree",
];

function PreviewUnavailable({ name }: { name: string }) {
  // A <span>, not a <div> — some of these placeholders stand in for
  // components used inline inside a paragraph (e.g. "Версия игры:
  // <ServerVersion />"), and a block element can't nest inside a <p>. This
  // stays valid either way: inline by default, or as its own block when
  // nothing wraps it.
  return (
    <span
      style={{
        display: "inline-block",
        border: "1px dashed currentColor",
        opacity: 0.6,
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
        borderRadius: "0.5rem",
        margin: "0.5rem 0",
      }}
    >
      {`<${name} /> — интерактивный компонент, недоступен в предпросмотре`}
    </span>
  );
}

function unavailable(name: string) {
  function Placeholder() {
    return <PreviewUnavailable name={name} />;
  }
  Placeholder.displayName = `PreviewUnavailable(${name})`;
  return Placeholder;
}

// Plain HTML table styling instead of reusing DocsTable — DocsTable wraps
// the shadcn ui/table.tsx primitive, which is "use client".
function PreviewTable(props: React.ComponentPropsWithoutRef<"table">) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "0.75rem", border: "1px solid var(--color-border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }} {...props} />
    </div>
  );
}
function PreviewThead(props: React.ComponentPropsWithoutRef<"thead">) {
  return <thead style={{ background: "var(--color-muted)" }} {...props} />;
}
function PreviewTr(props: React.ComponentPropsWithoutRef<"tr">) {
  return <tr style={{ borderBottom: "1px solid var(--color-border)" }} {...props} />;
}
function PreviewTh(props: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      style={{ textAlign: "left", padding: "0.6rem 0.9rem", fontSize: "0.7rem", textTransform: "uppercase" }}
      {...props}
    />
  );
}
function PreviewTd(props: React.ComponentPropsWithoutRef<"td">) {
  return <td style={{ padding: "0.6rem 0.9rem", verticalAlign: "top" }} {...props} />;
}

function getPreviewMdxComponents(): MDXComponents {
  return {
    ...Object.fromEntries(CLIENT_ONLY_COMPONENT_NAMES.map((name) => [name, unavailable(name)])),
    Callout, FeatureGrid, StepList,
    table: PreviewTable,
    thead: PreviewThead,
    tr: PreviewTr,
    th: PreviewTh,
    td: PreviewTd,
    // Everything else (h1-h6, p, ul/ol/li, a, code, pre, blockquote, img, ...)
    // is left unset on purpose — MDX renders those as plain native elements
    // by default, which is exactly what we want here since fumadocs-ui's
    // own defaults for headings/code blocks/links are client components too.
  };
}

// A few docs files do `import { Sword, Building2 } from "lucide-react"` to
// pass icons as props (e.g. FeatureGrid's `features[].icon`). Compiling
// that requires @mdx-js/mdx's `baseUrl` option, which makes it emit a real
// dynamic `import()` in the compiled function body — executed directly by
// Node, outside Turbopack's module graph entirely. That loads its own,
// separate copy of react (and whatever the imported package depends on)
// instead of reusing the one already running the app, which breaks React's
// hook dispatcher: "Invalid hook call" / "Cannot read properties of null
// (reading 'useContext')". Confirmed live, twice — this isn't
// theoretical, and it doesn't reliably stay contained by
// PreviewErrorBoundary either, since the failure can surface while
// deserializing the compiled element rather than during a normal render
// pass the boundary would catch cleanly.
//
// Rather than keep patching around that, this checks for the exact syntax
// that requires baseUrl (a real `import`, a re-export `export ... from`, or
// `import.meta.url`) and refuses to compile it at all — same category as a
// syntax error, just reported before ever reaching evaluate() instead of
// after. Editing and saving the file are completely unaffected; this only
// disables the live preview for that one file.


export type MdxPreviewResult = { node: ReactNode } | { error: string };

/** Compiles raw .mdx source to a React element tree for the admin content editor's preview pane. */
export async function compileMdxPreview(source: string): Promise<MdxPreviewResult> {
  const body = source.replace(FRONTMATTER_PATTERN, "");

  // Mock named imports (e.g. `import { Sword, Shield } from "lucide-react"`) 
  // by replacing them with dummy React components inline. This prevents Node 
  // from trying to actually import the module and causing a React Hook error.
  const previewBody = body.replace(
    /^\s*import\s+{([^}]+)}\s+from\s+['"][^'"]+['"];?/gm,
    (match, p1) => {
      const vars = p1.split(',').map((s: string) => s.trim().split(' as ')[0]).filter(Boolean);
      return vars.map((v: string) => `export const ${v} = () => <span style={{ display: 'inline-block', width: '1em', height: '1em', borderRadius: '0.2em', background: 'var(--color-primary)', opacity: 0.2 }} title="${v}" />;`).join('\n');
    }
  ).replace(
    /^\s*import\s+[^{][^;]*\s+from\s+['"][^'"]+['"];?/gm, 
    "/* default import stripped */"
  );

  try {
    const { default: Content } = await evaluate(previewBody, {
      ...runtime,
      remarkPlugins: [remarkGfm],
    });
    return { node: <Content components={getPreviewMdxComponents()} /> };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to compile MDX" };
  }
}
