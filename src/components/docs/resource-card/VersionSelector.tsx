"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModrinthVersion, ModrinthVersionFile } from "./types";
import { createPortal } from "react-dom";

interface VersionSelectorProps {
    versions: ModrinthVersion[];
    selectedVersionId: string;
    onSelectVersion: (id: string) => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const LOADER_LABELS: Record<string, string> = {
    fabric: "Fabric",
    forge: "Forge",
    neoforge: "NeoForge",
    quilt: "Quilt",
    liteloader: "LiteLoader",
    bukkit: "Bukkit",
    spigot: "Spigot",
    paper: "Paper",
    purpur: "Purpur",
    folia: "Folia",
    sponge: "Sponge",
    bungeecord: "BungeeCord",
    waterfall: "Waterfall",
    velocity: "Velocity",
    modloader: "ModLoader",
    rift: "Rift",
    iris: "Iris",
    optifine: "OptiFine",
    minecraft: "Minecraft",
    datapack: "Datapack",
};

function loaderLabel(loader: string): string {
    return LOADER_LABELS[loader.toLowerCase()] ?? loader;
}

export const VersionSelector = memo(({
    versions,
    selectedVersionId,
    onSelectVersion,
}: VersionSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? versions[0];
    const primaryFile: ModrinthVersionFile | undefined =
        selectedVersion?.files.find((f) => f.primary) ?? selectedVersion?.files[0];

    // Close on outside click (check both trigger and dropdown)
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    const handleOpen = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
        setOpen((o) => !o);
    }, []);

    const handleSelect = useCallback((id: string) => {
        onSelectVersion(id);
        setOpen(false);
    }, [onSelectVersion]);

    if (!selectedVersion) return null;

    return (
        <div className="space-y-2">
            <p className="text-xs text-amber-100/40 uppercase tracking-wider">Версия</p>

            <div className="flex gap-2">
                {/* Version picker */}
                <div className="relative flex-1 min-w-0">
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={handleOpen}
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm",
                            "border border-amber-900/30 bg-black/30 text-amber-200",
                            "hover:border-amber-700/50 hover:bg-black/40 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                            open && "border-amber-700/50 bg-black/40"
                        )}
                    >
                        <span className="flex flex-col items-start min-w-0 text-left">
                            <span className="font-medium truncate w-full">
                                {selectedVersion.version_number}
                            </span>
                            <span className="text-xs text-amber-100/40 truncate w-full">
                                {[
                                    selectedVersion.loaders.map(loaderLabel).join(", "),
                                    selectedVersion.game_versions.slice(-1)[0],
                                    selectedVersion.game_versions.length > 1
                                        ? `— ${selectedVersion.game_versions[0]}`
                                        : "",
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        </span>
                        <ChevronDown
                            size={15}
                            className={cn(
                                "shrink-0 text-amber-400/60 transition-transform duration-200",
                                open && "rotate-180"
                            )}
                            aria-hidden="true"
                        />
                    </button>

                    {open && createPortal(
                        <div
                            ref={dropdownRef}
                            role="listbox"
                            style={dropdownStyle}
                            className="rounded-xl border border-amber-900/30 bg-[#1a1208]/95 backdrop-blur-sm shadow-xl max-h-64 overflow-y-auto"
                        >
                            {versions.map((v) => {
                                const isSelected = v.id === selectedVersionId;
                                const label = [
                                    v.loaders.map(loaderLabel).join(", "),
                                    v.game_versions.length === 1
                                        ? v.game_versions[0]
                                        : `${v.game_versions[v.game_versions.length - 1]}–${v.game_versions[0]}`,
                                ]
                                    .filter(Boolean)
                                    .join(" · ");

                                return (
                                    <button
                                        key={v.id}
                                        role="option"
                                        aria-selected={isSelected}
                                        type="button"
                                        onClick={() => handleSelect(v.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left",
                                            "transition-colors first:rounded-t-xl last:rounded-b-xl",
                                            isSelected
                                                ? "bg-amber-900/30 text-amber-200"
                                                : "text-amber-100/70 hover:bg-amber-900/20 hover:text-amber-200"
                                        )}
                                    >
                                        <span className="flex flex-col min-w-0">
                                            <span className="font-medium truncate">{v.version_number}</span>
                                            <span className="text-xs text-amber-100/40 truncate">{label}</span>
                                        </span>
                                        {isSelected && (
                                            <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>,
                        document.body
                    )}
                </div>

                {/* Download button */}
                {primaryFile && (
                    <a
                        href={primaryFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Скачать ${selectedVersion.version_number} (${formatSize(primaryFile.size)})`}
                        title={`${primaryFile.filename} · ${formatSize(primaryFile.size)}`}
                        className={cn(
                            "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm",
                            "border border-amber-900/30 bg-amber-950/30 text-amber-200",
                            "hover:bg-amber-900/40 hover:border-amber-700/50 hover:text-amber-100 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        )}
                    >
                        <Download size={15} aria-hidden="true" />
                        <span className="text-xs text-amber-400/70">{formatSize(primaryFile.size)}</span>
                    </a>
                )}
            </div>
        </div>
    );
});
VersionSelector.displayName = "VersionSelector";