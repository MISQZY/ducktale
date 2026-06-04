"use client";

import { useState, useEffect } from "react";
import type {
  ModrinthProject,
  ModrinthVersion,
  Dependency,
  ResourceImage,
} from "./types";

const MODRINTH_API = "https://api.modrinth.com/v2";

export interface ModrinthData {
  name: string;
  description: string;
  versions: ModrinthVersion[];
  dependencies: Dependency[];
  images: ResourceImage[];
  slug: string;
}

export type ModrinthStatus = "idle" | "loading" | "success" | "error";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ducktale-wiki/1.0" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useModrinth(projectId: string | undefined) {
  const [data, setData] = useState<ModrinthData | null>(null);
  const [status, setStatus] = useState<ModrinthStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    setStatus("loading");
    setError(null);
    setData(null);

    async function load() {
      try {
        const [project, allVersions] = await Promise.all([
          fetchJson<ModrinthProject>(`${MODRINTH_API}/project/${projectId}`),
          fetchJson<ModrinthVersion[]>(`${MODRINTH_API}/project/${projectId}/version`),
        ]);

        if (cancelled) return;

        let dependencies: Dependency[] = [];
        const latestVersion = allVersions[0] ?? null;

        if (latestVersion && latestVersion.dependencies.length > 0) {
          const required = latestVersion.dependencies.filter(
            (d) => d.dependency_type === "required" && d.project_id
          );
          if (required.length > 0) {
            const ids = required.map((d) => d.project_id!);
            try {
              const depProjects = await fetchJson<
                { id: string; title: string; slug: string }[]
              >(
                `${MODRINTH_API}/projects?ids=${encodeURIComponent(
                  JSON.stringify(ids)
                )}`
              );
              if (!cancelled) {
                dependencies = depProjects.map((p) => ({
                  name: p.title,
                  url: `https://modrinth.com/project/${p.slug}`,
                }));
              }
            } catch {
            }
          }
        }

        if (cancelled) return;

        const gallery = [...project.gallery].sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return a.ordering - b.ordering;
        });

        const images: ResourceImage[] = [
          ...(gallery.length === 0 && project.icon_url
            ? [
                {
                  src: project.icon_url,
                  alt: project.title,
                  unoptimized: true,
                },
              ]
            : []),
          ...gallery.map((g) => ({
            src: g.url,
            alt: g.title ?? project.title,
            title: g.title ?? undefined,
            unoptimized: true,
          })),
        ];

        setData({
          name: project.title,
          description: project.description,
          versions: allVersions,
          dependencies,
          images,
          slug: project.slug,
        });
        setStatus("success");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Неизвестная ошибка"
          );
          setStatus("error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { data, status, error };
}