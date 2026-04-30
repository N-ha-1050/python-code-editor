import { formatButton, isButton, runButton } from "./elements"
import { formatAndCopy, run } from "./python"
import "./style.css"

function main() {
  if (!isButton(runButton)) return
  if (!isButton(formatButton)) return

  runButton.addEventListener("click", run)
  formatButton.addEventListener("click", formatAndCopy)
}

main()
