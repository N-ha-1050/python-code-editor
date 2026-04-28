import { loadPyodide, version } from "pyodide"
import { editor } from "./editor"
import {
  errorTextArea,
  formatButton,
  inputTextArea,
  isButton,
  isInput,
  isP,
  isTextArea,
  outputTextArea,
  packagesInput,
  runButton,
  stateP,
} from "./elements"

const PACKAGE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`

const createStdin = () => {
  if (!isTextArea(inputTextArea)) return () => null

  let input: string | null = inputTextArea.value
  return () => {
    const value = input
    input = null
    return value
  }
}

const createStdout = (formatter = (msg: string) => `${msg}`) => {
  return (msg: string) => {
    if (!isTextArea(outputTextArea)) return

    outputTextArea.value += `${formatter(msg)}\n`
  }
}

const createStderr = (formatter = (msg: string) => `${msg}`) => {
  return (msg: string) => {
    if (!isTextArea(errorTextArea)) return

    errorTextArea.value += `${formatter(msg)}\n`
  }
}

export async function run() {
  if (!isButton(runButton)) return
  if (!isTextArea(inputTextArea)) return
  if (!isTextArea(outputTextArea)) return
  if (!isTextArea(errorTextArea)) return
  if (!isInput(packagesInput)) return
  if (!isP(stateP)) return

  runButton.disabled = true
  stateP.textContent = "Running..."

  inputTextArea.disabled = true
  outputTextArea.value = ""
  errorTextArea.value = ""

  const packageNames = packagesInput.value
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const pyodide = await loadPyodide({
    packageBaseUrl: PACKAGE_BASE_URL,
    stdin: createStdin(),
    stdout: createStdout(),
    stderr: createStderr(),
  })

  try {
    for (const packageName of packageNames) {
      await pyodide.loadPackage(packageName, {
        messageCallback: createStderr((msg) => `[Editor Info] ${msg}`),
      })
    }
    const st = Date.now()
    await pyodide.runPythonAsync(editor.getValue())
    const en = Date.now()
    stateP.textContent = `Success (${en - st} ms)`
  } catch (error) {
    errorTextArea.value += `${error}\n`
    stateP.textContent = "Error"
  } finally {
    inputTextArea.disabled = false
    runButton.disabled = false
  }
}

export async function formatAndCopy() {
  if (!isButton(formatButton)) return
  if (!isTextArea(errorTextArea)) return
  if (!isP(stateP)) return

  formatButton.disabled = true
  stateP.textContent = "Formatting..."

  errorTextArea.value = ""

  const pyodide = await loadPyodide({
    packageBaseUrl: PACKAGE_BASE_URL,
  })
  await pyodide.loadPackage("micropip")
  const micropip = pyodide.pyimport("micropip")
  await micropip.install("black")
  await micropip.install("isort")

  try {
    pyodide.globals.set("code", editor.getValue())
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
    editor.setValue(formattedCode, -1)
    navigator.clipboard.writeText(formattedCode)
  } catch (error) {
    errorTextArea.value += `${error}\n`
  } finally {
    stateP.textContent = "Copied formatted code to clipboard!"
    formatButton.disabled = false
  }
}
