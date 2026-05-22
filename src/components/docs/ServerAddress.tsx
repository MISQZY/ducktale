import { SERVERS, NETWORK_HOST } from "@/config/servers";
import CopyToClipboard from "@/components/ui/CopyToClipboard";

interface Props {
  server?: string;
}

export function ServerAddress({ server = "network" }: Props) {
  if (server === "network") {
    return <CopyToClipboard value={NETWORK_HOST} />;
  }

  const found = SERVERS.find((s) => s.id === server);

  if (!found) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `<ServerAddress server="${server}" /> — unknown id. ` +
          `Available: ${SERVERS.map((s) => s.id).join(", ")}, network.`
      );
    }
    return <CopyToClipboard value={NETWORK_HOST} />;
  }

  return <CopyToClipboard value={found.host} />;
}
