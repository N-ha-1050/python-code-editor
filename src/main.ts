import {
  formatButton,
  inputTextArea,
  isButton,
  isTextArea,
  runButton,
} from "./elements"
import { formatAndCopy, run } from "./python"
import "./style.css"

function main() {
  if (!isButton(runButton)) return
  if (!isButton(formatButton)) return
  if (!isTextArea(inputTextArea)) return

  runButton.addEventListener("click", run)
  formatButton.addEventListener("click", formatAndCopy)
  inputTextArea.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      run()
    }
  })
}

main()
