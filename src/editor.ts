import ace from "ace-builds"
import "ace-builds/src-noconflict/mode-python"
import "ace-builds/src-noconflict/theme-github"
import "ace-builds/src-noconflict/theme-github_dark"
import "ace-builds/src-noconflict/keybinding-vscode"
import template_python_code from "./main.py?raw"

const media = window.matchMedia("(prefers-color-scheme: dark)")
const getTheme = () =>
  media.matches ? "ace/theme/github_dark" : "ace/theme/github"

export const editor = ace.edit("editor", {
  theme: getTheme(),
  mode: "ace/mode/python",
  autoScrollEditorIntoView: true,
  minLines: 5,
  maxLines: 30,
  showPrintMargin: false,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  useSoftTabs: true,
  tabSize: 4,
})
editor.setKeyboardHandler("ace/keyboard/vscode")
editor.setValue(template_python_code, -1)

const onMediaChange = () => {
  editor.setTheme(getTheme())
}

media.addEventListener("change", onMediaChange)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    media.removeEventListener("change", onMediaChange)
  })
}
