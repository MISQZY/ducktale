import { NextResponse } from "next/server";
import { SERVERS } from "@/config/servers";

// Увеличен таймаут: mcsrvstat.us бывает медленным, 5с не хватает
const FETCH_TIMEOUT_MS = 8000;

async function fetchServerStatus(host: string): Promise<{ online: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      signal: controller.signal,
      // cache: "no-store" вместо next.revalidate —
      // revalidate внутри Route Handler не работает как задумано и
      // может конфликтовать с AbortController в некоторых версиях Next.js
      cache: "no-store",
    });
    if (!res.ok) return { online: false };
    return await res.json();
  } catch {
    // Таймаут, DNS-ошибка или любой сетевой сбой → сервер офлайн,
    // не бросаем 500 наружу
    return { online: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      SERVERS.map((s) => fetchServerStatus(s.host))
    );

    const statuses = Object.fromEntries(
      SERVERS.map((s, i) => {
        const result = results[i];
        return [
          s.host,
          result.status === "fulfilled" ? result.value : { online: false },
        ];
      })
    );

    return NextResponse.json(statuses, {
      headers: {
        // Браузер/CDN кешируют на 60с, но при ошибке не кешируют
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    // Последний рубеж: если что-то совсем пошло не так — возвращаем
    // пустой объект вместо 500, чтобы клиент не падал
    return NextResponse.json(
      Object.fromEntries(SERVERS.map((s) => [s.host, { online: false }])),
      { status: 200 }
    );
  }
}
