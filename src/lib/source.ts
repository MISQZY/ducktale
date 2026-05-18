import { loader } from "fumadocs-core/source";
import { duckburg, duckhood } from "@/.source";

export const duckburgSource = loader({
  baseUrl: "/docs/duckburg",
  source: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files: (duckburg.toFumadocsSource().files as any)(),
  },
});

export const duckhoodSource = loader({
  baseUrl: "/docs/duckhood",
  source: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files: (duckhood.toFumadocsSource().files as any)(),
  },
});