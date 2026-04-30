import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { UserConfig } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"

const PYODIDE_EXCLUDE = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/pyodide/node_modules",
] as const

export function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")))
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDir, "*").replace(/\\/g, "/")].concat(
          PYODIDE_EXCLUDE,
        ),
        dest: "assets",
      },
    ],
  })
}

export default {
  optimizeDeps: { exclude: ["pyodide"] },
  plugins: [viteStaticCopyPyodide()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
} satisfies UserConfig
