import { SERVERS, NETWORK_HOST } from "@/config/servers";
import CopyToClipboard from "@/components/ui/CopyToClipboard";

interface Props {
  server?: string;
}

export function ServerAddress({ server = "network" }: Props) {
  // Упрощено: три ветки → одна строка
  const host =
    server === "network"
      ? NETWORK_HOST
      : SERVERS.find((s) => s.id === server)?.host ?? NETWORK_HOST;

  if (
    server !== "network" &&
    !SERVERS.find((s) => s.id === server) &&
    process.env.NODE_ENV === "development"
  ) {
    throw new Error(
      `<ServerAddress server="${server}" /> — unknown id. ` +
        `Available: ${SERVERS.map((s) => s.id).join(", ")}, network.`
    );
  }

  return <CopyToClipboard value={host} />;
}
