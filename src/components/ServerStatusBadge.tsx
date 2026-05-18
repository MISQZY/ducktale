"use client";

import { useEffect, useState } from "react";
import StatusDot from "./ui/StatusBadge";

interface ServerStatus {
    online: boolean;
    players?: { online: number; max: number; list?: { name: string }[] };
    version?: string;
}

function useServerStatus(host: string) {
    const [status, setStatus] = useState<ServerStatus | null>(null);

    useEffect(() => {
        fetch(`/api/server-status/${encodeURIComponent(host)}`)
            .then((r) => r.json())
            .then(setStatus)
            .catch(() => setStatus({ online: false }));
    }, [host]);

    return status;
}

export default function ServerStatusBadge({ host }: { host: string }) {
    const status = useServerStatus(host);

    if (!status) {
        return (
            <div className="text-right text-xs text-amber-100/30 animate-pulse">
                <div>Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="text-right text-xs space-y-0.5">
            <div>
                <StatusDot online={status.online} variant="full" />
            </div>
            {status.online && status.players && (
                <div className="relative group/players inline-block text-amber-100/40 cursor-default">
                    {status.players.online}/{status.players.max} игроков
                    {status.players.list && status.players.list.length > 0 && (
                        <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover/players:block bg-stone-900 border border-amber-100/10 rounded px-2 py-1.5 min-w-max">
                            {status.players.list.map((p) => (
                                <div key={p.name} className="text-amber-100/70">{p.name}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {status.version && (
                <div className="text-amber-100/30">{status.version}</div>
            )}
        </div>
    );
}