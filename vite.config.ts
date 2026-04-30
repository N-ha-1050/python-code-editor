import type { UserConfig } from "vite"

export default {
  base: "/",
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
} satisfies UserConfig
