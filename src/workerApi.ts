import FormatWorker from "./formatWorker?worker"
import RunWorker from "./runWorker?worker"

export type WithId<T> = T & { id: string }

function requestResponse<WorkerRequest, WorkerResponse>(
  worker: Worker,
  message: WorkerRequest,
) {
  const { promise, resolve } = Promise.withResolvers<WorkerResponse>()
  const workerId = crypto.randomUUID()

  const listener = (event: MessageEvent<WithId<WorkerResponse>>) => {
    const { id, ...data } = event.data

    if (id !== workerId) return

    worker.removeEventListener("message", listener)
    resolve(data as WorkerResponse)
  }

  worker.addEventListener("message", listener)
  worker.postMessage({ ...message, id: workerId })
  return promise
}

export type RunWorkerRequest = {
  code: string
  input: string | null
}

export type RunWorkerResponse = {
  out: string
  err: string
} & (
  | {
      success: true
      executionTime: number
    }
  | {
      success: false
      executionTime: null
    }
)

const runWorker = new RunWorker()

export function runAsync(code: string, input: string | null) {
  return requestResponse<RunWorkerRequest, RunWorkerResponse>(runWorker, {
    code,
    input,
  })
}

export type FormatWorkerRequest = {
  code: string
}

export type FormatWorkerResponse =
  | { success: true; formattedCode: string; error: null }
  | { success: false; formattedCode: null; error: string }

const formatWorker = new FormatWorker()

export function formatAsync(code: string) {
  return requestResponse<FormatWorkerRequest, FormatWorkerResponse>(
    formatWorker,
    {
      code,
    },
  )
}
