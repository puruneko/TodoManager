//https://microsoft.github.io/monaco-editor/docs.html
import monaco from "monaco-editor"
import { Position } from "unist"
import { MdPosition, MdRange } from "../store/mdtextStore"

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

export const getMonacoScrollTopPxByLineNumber = (
    editor: monaco.editor.IStandaloneCodeEditor,
    lineNumber: number
) => {
    const scrollTopPx = editor.getTopForLineNumber(lineNumber)
    return scrollTopPx
}

export const mdPosition2monacoPosition = (
    mdposition: MdPosition
): monaco.IPosition => {
    return {
        lineNumber: mdposition.lineNumber,
        column: mdposition.column,
    }
}

export const mdRange2monacoRange = (mdrange: MdRange): monaco.IRange => {
    return {
        startLineNumber: mdrange.start.lineNumber,
        startColumn: mdrange.start.column,
        endLineNumber: mdrange.end.lineNumber,
        endColumn: mdrange.end.column,
    }
}
