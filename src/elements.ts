export const runButton = document.getElementById("run")
export const formatButton = document.getElementById("format")

export const isButton = (
  element: HTMLElement | null,
): element is HTMLButtonElement => element instanceof HTMLButtonElement

export const inputTextArea = document.getElementById("input")
export const stateP = document.getElementById("state")
export const outputTextArea = document.getElementById("output")
export const errorTextArea = document.getElementById("error")

export const isTextArea = (
  element: HTMLElement | null,
): element is HTMLTextAreaElement => element instanceof HTMLTextAreaElement

export const isP = (
  element: HTMLElement | null,
): element is HTMLParagraphElement => element instanceof HTMLParagraphElement
