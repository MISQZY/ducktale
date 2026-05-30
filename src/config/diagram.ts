/**
 * Network topology data for the interactive infrastructure diagram.
 * Add/remove nodes and edges here — the diagram renders them automatically.
 */
import { Shield, Globe, Server, Cpu, Users, Lock, Zap, RefreshCw, Home, Mic } from "lucide-react";
import type { NodeDef, EdgeDef, Vec2 } from "@/components/node-diagram/types";

export const DIAGRAM_INIT_OFFSETS: Record<string, Vec2> = {
  client:   { x: -366, y: -220 },
  proxy:    { x: -228, y: -100 },
  auth:     { x: -84,  y: 0    },
  hub:      { x: 68,   y: 100  },
  duckburg: { x: 134,  y: 255  },
  duckhood: { x: 274,  y: 188  },
  backup:   { x: 326,  y: -73  },
  voice:    { x: -244, y: 125  },
};

export const DIAGRAM_NODES: NodeDef[] = [
  { id: "client",   label: "Игрок",      sublabel: "Minecraft клиент",     icon: Users,     color: "gold",    tooltip: "Клиент подключается с Minecraft Java Edition ≥ 1.21.x" },
  { id: "proxy",    label: "Velocity",   sublabel: "Единая точка входа",   icon: Globe,     color: "violet",  tooltip: "Proxy-сервер Velocity — точка входа в сеть DuckTale. Маршрутизирует трафик между всеми серверами." },
  { id: "auth",     label: "Auth",       sublabel: "Авторизация",          icon: Shield,    dashed: true, color: "rose",    tooltip: "Система авторизации игроков перед допуском на серверы." },
  { id: "hub",      label: "Hub",        sublabel: "Лобби серверов",       icon: Home,      color: "amber",   tooltip: "Сервер-лобби для выбора игрового сервера." },
  { id: "duckburg", label: "DuckBurg",   sublabel: "Выживание",            icon: Server,    color: "emerald", tooltip: "Игровой сервер выживания" },
  { id: "duckhood", label: "DuckHood",   sublabel: "Креатив",              icon: Server,    color: "sky",     tooltip: "Игровой творческий сервер" },
  { id: "backup",   label: "Бэкапы",     sublabel: "Ежедневно",            icon: RefreshCw, dashed: true, color: "gold",    tooltip: "Ежедневные резервные копии всех игровых данных." },
  { id: "voice",    label: "Voice-Chat", sublabel: "Голосовой чат сервера",icon: Mic,       dashed: true, color: "gold",    tooltip: "Голосовой внутриигровой чат." },
];

export const DIAGRAM_EDGES: EdgeDef[] = [
  { from: "client",   to: "proxy",    color: "white",  tooltip: "Подключение игрока к точке входа сети" },
  { from: "proxy",    to: "auth",     color: "gold",   tooltip: "Velocity направляет на сервис авторизации" },
  { from: "auth",     to: "hub",      color: "gold",   tooltip: "При успешной авторизации перенаправляет на HUB" },
  { from: "hub",      to: "duckhood", color: "gold",   direction: "both", tooltip: "Перенаправление между HUB и DuckHood" },
  { from: "hub",      to: "duckburg", color: "gold",   direction: "both", tooltip: "Перенаправление между HUB и DuckBurg" },
  { from: "duckhood", to: "duckburg", color: "gold",   direction: "both", tooltip: "Перенаправление между DuckHood и DuckBurg" },
  { from: "backup",   to: "duckburg", color: "violet", dashed: true, tooltip: "Автоматическое резервное копирование DuckBurg" },
  { from: "backup",   to: "duckhood", color: "violet", dashed: true, tooltip: "Автоматическое резервное копирование DuckHood" },
  { from: "voice",    to: "duckburg", color: "violet", dashed: true, tooltip: "Предоставление голосового чата для сервера DuckBurg" },
  { from: "voice",    to: "duckhood", color: "violet", dashed: true, tooltip: "Предоставление голосового чата для сервера DuckHood" },
  { from: "voice",    to: "hub",      color: "violet", dashed: true, tooltip: "Предоставление голосового чата для сервера HUB" },
];

export const DIAGRAM_LEGEND_LINES = [
  { color: "white",  label: "Общий трафик",       dashed: false },
  { color: "gold",   label: "Защищенный трафик",  dashed: false },
  { color: "violet", label: "Сервисы",            dashed: true  },
] as const;

export const DIAGRAM_LEGEND_NODES = [
  { dashed: false, label: "Основная инфраструктура" },
  { dashed: true,  label: "Вспомогательный сервис"  },
] as const;
