'use client';

import Image from "next/image";
import { EXTERNAL_APIS } from "@/config/external-apis";

export function Authors({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 pt-4 border-t mt-4">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Авторы
      </p>
      <div className="flex flex-col gap-2">
        {ids.map((username) => (
          <a
            key={username}
            href={EXTERNAL_APIS.github.profileUrl(username)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 group p-1 -ml-1 rounded-md hover:bg-accent transition-colors"
          >
            <Image
              width={32}
              height={32}
              src={EXTERNAL_APIS.github.avatarUrl(username)}
              alt={username}
              className="w-8 h-8 rounded-full border border-border group-hover:border-primary/50 transition-colors"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = EXTERNAL_APIS.uiAvatars.fallbackUrl(username);
              }}
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {username}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
