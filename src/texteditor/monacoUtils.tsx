//https://microsoft.github.io/monaco-editor/docs.html
import monaco from "monaco-editor"
import { Position } from "unist"

//
export const getMonacoSelection = (
    editor: monaco.editor.IStandaloneCodeEditor | undefined
) => {
    const model = editor?.getModel()
    if (editor && model) {
        return editor.getSelection()
    }
}
export const getMonacoPosition = (
    editor: monaco.editor.IStandaloneCodeEditor | undefined
) => {
    const model = editor?.getModel()
    if (editor && model) {
        const selection = editor.getSelection()
        if (selection) {
            return {
                start: {
                    line: selection.startLineNumber,
                    column: selection.startColumn,
                    offset: model.getOffsetAt({
                        lineNumber: selection.startLineNumber,
                        column: selection.startColumn,
                    }),
                },
                end: {
                    line: selection.positionLineNumber,
                    column: selection.positionColumn,
                    offset: model.getOffsetAt({
                        lineNumber: selection.positionLineNumber,
                        column: selection.positionColumn,
                    }),
                },
            } as Position
        }
    }
    return null
}
