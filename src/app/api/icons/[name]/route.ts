import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function renderSvgTree(node: any, isRoot = false): string {
  if (!node) return "";
  const attrs = Object.entries(node.attr || {});
  if (isRoot && !attrs.find(([k]) => k === "xmlns")) {
    attrs.push(["xmlns", "http://www.w3.org/2000/svg"]);
  }
  
  const attrString = attrs.map(([k, v]) => `${k}="${v}"`).join(" ");
  const children = (node.child || []).map((c: any) => renderSvgTree(c, false)).join("");
  return `<${node.tag} ${attrString}>${children}</${node.tag}>`;
}

// Simple in-memory cache so we don't re-read the 7MB file for the same icon
const cache = new Map<string, string | null>();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> | { name: string } }
) {
  // Await params as required in Next 15+
  const resolvedParams = await params;
  const name = resolvedParams.name;

  if (!name.startsWith("Gi")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (cache.has(name)) {
    const cachedSvg = cache.get(name);
    if (!cachedSvg) return new NextResponse("Not Found", { status: 404 });
    return new NextResponse(cachedSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  try {
    const filepath = path.join(process.cwd(), "node_modules", "react-icons", "gi", "index.js");
    const content = await fs.readFile(filepath, "utf-8");

    const searchStr = `module.exports.${name} = function ${name}`;
    const startIndex = content.indexOf(searchStr);

    if (startIndex === -1) {
      cache.set(name, null);
      return new NextResponse("Not Found", { status: 404 });
    }

    const genIconIndex = content.indexOf("GenIcon(", startIndex);
    const jsonEndIndex = content.indexOf(")(props);", genIconIndex);

    if (genIconIndex === -1 || jsonEndIndex === -1) {
      cache.set(name, null);
      return new NextResponse("Not Found", { status: 404 });
    }

    const jsonString = content.substring(genIconIndex + 8, jsonEndIndex);
    const tree = JSON.parse(jsonString);

    const svgString = renderSvgTree(tree, true);
    cache.set(name, svgString);

    return new NextResponse(svgString, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`Failed to load icon ${name}:`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
