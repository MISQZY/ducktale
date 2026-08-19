import { notFound } from "next/navigation";

export default function CatchAllFallback() {
  notFound();
}
