import { loadPyodide } from "pyodide"
import { PACKAGE_BASE_URL } from "./config"
import type {
  FormatWorkerRequest,
  FormatWorkerResponse,
  WithId,
} from "./workerApi"

const pyodideReadyPromise = loadPyodide({
  packageBaseUrl: PACKAGE_BASE_URL,
})

self.onmessage = async (event: MessageEvent<WithId<FormatWorkerRequest>>) => {
  const { id, code } = event.data
  const pyodide = await pyodideReadyPromise

  try {
    await pyodide.loadPackage("micropip")
    const micropip = pyodide.pyimport("micropip")
    await micropip.install("black")
    await micropip.install("isort")

    pyodide.globals.set("code", code)
    const formattedCode = pyodide.runPython(`
import black
import isort
from black import FileMode

try:
    formatted_code = black.format_str(code, mode=FileMode())
    formatted_code = isort.code(formatted_code, profile="black")
except black.NothingChanged:
    formatted_code = code
formatted_code
      `)

    const response: WithId<FormatWorkerResponse> = {
      id,
      success: true,
      formattedCode,
      error: null,
    }
    self.postMessage(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    const response: WithId<FormatWorkerResponse> = {
      id,
      success: false,
      formattedCode: null,
      error: errorMessage,
    }
    self.postMessage(response)
  }
}
