import { SERVERS, NETWORK_HOST } from "@/config/servers";
import CopyToClipboard from "@/components/ui/CopyToClipboard";

interface Props {
  server?: string;
}

export function ServerAddress({ server = "network" }: Props) {
  const host =
    server === "network"
      ? NETWORK_HOST
      : (SERVERS.find((s) => s.id === server)?.host ?? NETWORK_HOST);

  return <CopyToClipboard value={host} />;
}