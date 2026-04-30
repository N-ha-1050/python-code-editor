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
import { formatAsync, interrupt, runAsync } from "./workerApi"

export async function run() {
  if (!isButton(runButton)) return
  if (!isTextArea(inputTextArea)) return
  if (!isTextArea(outputTextArea)) return
  if (!isTextArea(errorTextArea)) return
  if (!isP(stateP)) return

  // 復帰必須の要素
  runButton.textContent = "Interrupt"
  runButton.removeEventListener("click", run)
  runButton.addEventListener("click", interrupt)
  stateP.textContent = "Running..."
  inputTextArea.disabled = true

  // 出力の初期化
  outputTextArea.value = ""
  errorTextArea.value = ""

  try {
    const { success, out, err, executionTime } = await runAsync(
      editor.getValue(),
      inputTextArea.value,
    )

    outputTextArea.value = out
    errorTextArea.value = err

    stateP.textContent = success ? `Success (${executionTime} ms)` : "Error"
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    errorTextArea.value = errorMessage
    stateP.textContent = `Internal Editor Error: ${errorMessage}`
  } finally {
    inputTextArea.disabled = false
    runButton.removeEventListener("click", interrupt)
    runButton.addEventListener("click", run)
    runButton.textContent = "Run"
  }
}

export async function formatAndCopy() {
  if (!isButton(formatButton)) return
  if (!isTextArea(errorTextArea)) return
  if (!isP(stateP)) return

  // 復帰必須の要素
  formatButton.disabled = true
  stateP.textContent = "Formatting..."

  // 出力の初期化
  errorTextArea.value = ""

  try {
    const response = await formatAsync(editor.getValue())

    if (!response.success) {
      errorTextArea.value = response.error
      stateP.textContent = "Error formatting code"
    } else {
      editor.setValue(response.formattedCode, -1)
      navigator.clipboard.writeText(response.formattedCode)
      stateP.textContent = "Copied formatted code to clipboard!"
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    errorTextArea.value = errorMessage
    stateP.textContent = `Internal Editor Error: ${errorMessage}`
  } finally {
    formatButton.disabled = false
  }
}
