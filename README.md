---
title: "README"
author: "N_ha"
---

## Usage

### Run Python code

1. Write your Python code in the "Editor" section.
2. Enter any standard input in the "Input" section.
3. Click the "Run" button or use the shortcut `Ctrl + Shift + E` to execute the code.
4. Standard output will be displayed in the "Output" section, and standard error will be displayed in the "Error" section.

### Note

- To stop execution, click the "Interrupt" button to send a SIGINT signal to the process.
- The editor uses [Pyodide](https://pyodide.org/en/stable/) to run Python code in the browser, so its behavior may differ from running the same code in a local Python environment.

### Shortcuts

- `Ctrl + S`: Save to local storage. Changes are usually saved automatically after each edit, so you usually do not need to do this manually.
- `Ctrl + O`: Load from local storage.
- `Ctrl + Shift + S`: Download as a `.py` file.
- `Ctrl + Shift + O`: Upload a `.py` file.
- `Ctrl + M`: Create a new file (clear the editor).
- `Ctrl + Shift + E`: Execute the code.
- `Ctrl + Shift + F`: Format the code and copy it to the clipboard.

## Developer Setup

0. Clone

   ```powershell
   git clone https://github.com/N-ha-1050/python-code-editor.git
   ```

1. Install dependencies

   ```powershell
   pnpm i
   ```

2. Install git hooks

   ```powershell
   pnpm lefthook install
   ```

3. Run the project

   ```powershell
   pnpm dev
   ```
