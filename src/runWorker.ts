import { loadPyodide } from "pyodide"
import { PYODIDE_INDEX_URL } from "./config"
import type {
  RunInterruptRequest,
  RunInterruptResponse,
  RunWorkerRequest,
  RunWorkerResponse,
  WithId,
} from "./workerApi"

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
  indexURL: PYODIDE_INDEX_URL,
})

self.onmessage = async (
  event: MessageEvent<WithId<RunWorkerRequest | RunInterruptRequest>>,
) => {
  const { type } = event.data

  switch (type) {
    case "interrupt": {
      const { interruptBuffer } = event.data
      const pyodide = await pyodideReadyPromise
      pyodide.setInterruptBuffer(interruptBuffer)
      const response: WithId<RunInterruptResponse> = {
        id: event.data.id,
        type: "interrupt",
        success: true,
      }
      self.postMessage(response)
      return
    }
    case "run": {
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
          type: "run",
          success: true,
          ...output,
          executionTime: en - st,
        }

        self.postMessage(response)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        stdio.stderr(errorMessage)

        const response: WithId<RunWorkerResponse> = {
          id,
          type: "run",
          success: false,
          ...output,
          executionTime: null,
        }

        self.postMessage(response)
      }
      return
    }
  }
}
