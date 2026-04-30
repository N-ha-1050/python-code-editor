import { editor } from "./editor"
import {
  errorTextArea,
  formatButton,
  inputTextArea,
  isButton,
  isP,
  isTextArea,
  outputTextArea,
  runButton,
  stateP,
} from "./elements"
import { formatAsync, runAsync } from "./workerApi"

export async function run() {
  if (!isButton(runButton)) return
  if (!isTextArea(inputTextArea)) return
  if (!isTextArea(outputTextArea)) return
  if (!isTextArea(errorTextArea)) return
  if (!isP(stateP)) return

  runButton.disabled = true
  stateP.textContent = "Running..."
  inputTextArea.disabled = true

  outputTextArea.value = ""
  errorTextArea.value = ""

  const code = editor.getValue()

  const { success, out, err, executionTime } = await runAsync(
    code,
    inputTextArea.value,
  )

  outputTextArea.value = out
  errorTextArea.value = err

  inputTextArea.disabled = false
  stateP.textContent = success ? `Success (${executionTime} ms)` : "Error"
  runButton.disabled = false
}

export async function formatAndCopy() {
  if (!isButton(formatButton)) return
  if (!isTextArea(errorTextArea)) return
  if (!isP(stateP)) return

  formatButton.disabled = true
  stateP.textContent = "Formatting..."

  errorTextArea.value = ""

  const response = await formatAsync(editor.getValue())

  if (!response.success) {
    errorTextArea.value = response.error
    stateP.textContent = "Error formatting code"
    formatButton.disabled = false
    return
  }

  editor.setValue(response.formattedCode, -1)
  navigator.clipboard.writeText(response.formattedCode)
  stateP.textContent = "Copied formatted code to clipboard!"
  formatButton.disabled = false
}
