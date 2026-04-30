import { loadPyodide } from "pyodide"
import { PACKAGE_BASE_URL } from "./config"
import type { RunWorkerRequest, RunWorkerResponse, WithId } from "./workerApi"

const createStdio = (input: string | null) => {
  const output = { out: "", err: "" }

  return {
    output,
    stdin: () => {
      const value = input
      input = null
      return value
    },
    stdout: (msg: string) => {
      output.out += `${msg}\n`
    },
    stderr: (msg: string) => {
      output.err += `${msg}\n`
    },
  }
}

const pyodideReadyPromise = loadPyodide({
  packageBaseUrl: PACKAGE_BASE_URL,
})

self.onmessage = async (event: MessageEvent<WithId<RunWorkerRequest>>) => {
  const { id, code, input } = event.data

  const { output, ...stdio } = createStdio(input)

  const pyodide = await pyodideReadyPromise
  pyodide.setStdin({ stdin: stdio.stdin })
  pyodide.setStdout({ batched: stdio.stdout })
  pyodide.setStderr({ batched: stdio.stderr })

  try {
    await pyodide.loadPackagesFromImports(code, {
      messageCallback: (msg: string) => {
        stdio.stderr(`[Editor Info] ${msg}`)
      },
    })

    const st = Date.now()
    await pyodide.runPythonAsync(code)
    const en = Date.now()

    const response: WithId<RunWorkerResponse> = {
      id,
      success: true,
      ...output,
      executionTime: en - st,
    }

    self.postMessage(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    stdio.stderr(errorMessage)

    const response: WithId<RunWorkerResponse> = {
      id,
      success: false,
      ...output,
      executionTime: null,
    }

    self.postMessage(response)
  }
}
