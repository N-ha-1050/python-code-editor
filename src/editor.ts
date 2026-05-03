import ace from "ace-builds"
import "ace-builds/src-noconflict/mode-python"
import "ace-builds/src-noconflict/theme-github"
import "ace-builds/src-noconflict/theme-github_dark"
import "ace-builds/src-noconflict/keybinding-vscode"
import "ace-builds/src-noconflict/ext-language_tools"
import { CODE_LOCALSTORAGE_KEY } from "./config"
import template_python_code from "./main.py?raw"
import { formatAndCopy, run } from "./python"

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

const code = localStorage.getItem(CODE_LOCALSTORAGE_KEY) ?? template_python_code
editor.setValue(code, -1)

editor.on("change", () => {
  const code = editor.getValue()
  localStorage.setItem(CODE_LOCALSTORAGE_KEY, code)
})

editor.commands.addCommands([
  {
    name: "saveLocalStorage",
    bindKey: { win: "Ctrl-S", mac: "Command-S" },
    exec: () => {
      const code = editor.getValue()
      localStorage.setItem(CODE_LOCALSTORAGE_KEY, code)
    },
  },
  {
    name: "loadLocalStorage",
    bindKey: { win: "Ctrl-O", mac: "Command-O" },
    exec: () => {
      const code = localStorage.getItem(CODE_LOCALSTORAGE_KEY)
      if (code === null) {
        console.warn("No code found in localStorage")
        return
      }
      editor.setValue(code, -1)
    },
  },
  {
    name: "newFile",
    bindKey: { win: "Ctrl-M", mac: "Command-M" },
    exec: () => {
      editor.setValue(template_python_code, -1)
    },
  },
  {
    name: "saveAsFile",
    bindKey: { win: "Ctrl-Shift-S", mac: "Command-Shift-S" },
    exec: () => {
      const code = editor.getValue()
      const blob = new Blob([code], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "main.py"
      a.click()
      URL.revokeObjectURL(url)
    },
  },
  {
    name: "loadFromFile",
    bindKey: { win: "Ctrl-Shift-O", mac: "Command-Shift-O" },
    exec: () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".py"
      input.onchange = (e) => {
        if (
          !e.target ||
          !(e.target instanceof HTMLInputElement) ||
          !e.target.files ||
          e.target.files.length === 0
        )
          return
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (e) => {
          if (!e.target) return
          const code = e.target.result
          if (typeof code !== "string") return
          editor.setValue(code, -1)
        }
        reader.readAsText(file)
        input.remove()
      }
      input.click()
    },
  },
  {
    name: "runCode",
    bindKey: { win: "Ctrl-Shift-E", mac: "Command-Shift-E" },
    exec: run,
  },
  {
    name: "runCodeCtrlShiftF5",
    bindKey: { win: "Ctrl-Shift-F5", mac: "Command-Shift-F5" },
    exec: run,
  },
  {
    name: "formatCode",
    bindKey: { win: "Ctrl-Shift-F", mac: "Command-Shift-F" },
    exec: formatAndCopy,
  },
])

const onMediaChange = () => {
  editor.setTheme(getTheme())
}

media.addEventListener("change", onMediaChange)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    media.removeEventListener("change", onMediaChange)
  })
}
