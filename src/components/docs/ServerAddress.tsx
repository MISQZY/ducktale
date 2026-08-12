"use client";

import { useState } from "react";
import { SERVERS, NETWORK_HOST, NETWORK_BEDROCK_PORT } from "@/config/servers";
import CopyToClipboard from "@/components/ui/CopyToClipboard";
import { cn } from "@/lib/utils";

interface Props {
  server?: string;
  align?: "left" | "center";
}

export function ServerAddress({ server = "network", align = "left" }: Props) {
  const [edition, setEdition] = useState<"java" | "bedrock">("java");

  let baseHost = NETWORK_HOST;

  if (server !== "network") {
    const found = SERVERS.find((s) => s.id === server);
    if (!found) {
      if (process.env.NODE_ENV === "development") {
        throw new Error(
          `<ServerAddress server="${server}" /> — unknown id. ` +
            `Available: ${SERVERS.map((s) => s.id).join(", ")}, network.`
        );
      }
    } else {
      baseHost = found.host;
    }
  }

  // Extract base IP in case baseHost includes a Java port
  const [ip] = baseHost.split(":");
  
  const displayAddress = edition === "java" 
    ? baseHost 
    : `${ip}:${NETWORK_BEDROCK_PORT}`;

  return (
    <div className={cn("flex flex-col gap-3 w-full", align === "center" && "items-center")}>
      <div className="flex bg-card/40 rounded-lg p-1 border border-primary/20 w-fit">
        <button
          onClick={() => setEdition("java")}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
            edition === "java" 
              ? "bg-primary/20 text-primary shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Java
        </button>
        <button
          onClick={() => setEdition("bedrock")}
          className={cn(
            "px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
            edition === "bedrock" 
              ? "bg-primary/20 text-primary shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Bedrock
        </button>
      </div>
      <CopyToClipboard value={displayAddress} />
    </div>
  );
}
