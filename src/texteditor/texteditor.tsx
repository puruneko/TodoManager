/**
 * 各種モジュールのインストール
 */
import React, {
    useState,
    useRef,
    useEffect,
    useContext,
    useMemo,
    memo,
} from "react"
//
import { renderToString } from "react-dom/server"

////
//https://github.com/suren-atoyan/monaco-react
import MonacoEditor from "@monaco-editor/react"

//https://microsoft.github.io/monaco-editor/docs.html
import monaco from "monaco-editor"

//
import { MdPropsContext, T_MdRange } from "../store/mdPropsStore"
import { __debugPrint__impl } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import {
    getMonacoPosition,
    getMonacoScrollTopPxByLineNumber,
    mdRange2monacoRange,
} from "./monacoUtils"
//
import "./texteditor.css"

//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<textditor>", ...args)
}
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
type T_SampleTextareaProps = { debug?: any }
const SampleTexteditor: React.FC<T_SampleTextareaProps> = (props) => {
    //
    const debugRef = useRef<any>("")
    const [debug, setDebug] = useState<any>("")
    //
    //
    const icChannel = useIcChannel("texteditor")
    //
    const { mdProps, mdPropsDispatch } = useContext(MdPropsContext)
    //
    const [previewComponent, setPreviewComponent] = useState("")

    ////////////////////////////////
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor>()
    //
    // component did mount
    //
    useEffect(function componentDidMount() {
        //
        //inter component event
        //
        icChannel.on("setSelection", (payload: { range: T_MdRange }) => {
            if (monacoRef.current) {
                const startpos = payload.range.start
                monacoRef.current.setSelection(
                    mdRange2monacoRange({ start: startpos, end: startpos })
                )
            }
            __debugPrint__("setSelection in texteditor", payload)
        })
        icChannel.on("focusTextarea", (payload: { range: T_MdRange }) => {
            const SCROLL_OFFSET_LINENO = 10
            if (monacoRef.current) {
                const startpos = payload.range.start
                monacoRef.current.setSelection(
                    mdRange2monacoRange({ start: startpos, end: startpos })
                )
                monacoRef.current.focus()
                const scrollToPx = getMonacoScrollTopPxByLineNumber(
                    monacoRef.current,
                    startpos.lineNumber - SCROLL_OFFSET_LINENO
                )
                monacoRef.current.setScrollTop(scrollToPx)
                monacoRef.current.focus()
            }
            __debugPrint__("focusTextarea in texteditor", payload)
        })
        icChannel.on("getPosition", (payload: {} | undefined) => {
            return getMonacoPosition(monacoRef.current)
        })
    }, [])
    //
    // monaco did mount
    //
    const handleMonacoDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor,
        monaco: any
    ) => {
        monacoRef.current = editor
        const model = monacoRef.current.getModel()
        if (model) {
            // CRLF->LF対応
            model.setEOL(monaco.editor.EndOfLineSequence.LF)
            model.setValue(mdProps.mdText)
        }
    }
    //
    // editor changed
    //
    const handleMonacoChanged = (mdText) => {
        __debugPrint__("handleMonacoChanged")
        mdPropsDispatch({ type: "setMdtext", payload: { mdText: mdText } })
    }
    //
    //
    const PreviewComponent = memo(({ Component }: any) => {
        __debugPrint__("PreviewComponent", Component)
        if (Component) {
            return <div>{Component}</div>
        }
        return <></>
    })
    ////////////////////////////////
    __debugPrint__("render", mdProps)
    return (
        <div style={{ maxWidth: "100%" }}>
            <h1 style={{ color: debug }}>TEXTEDITOR</h1>
            <hr />
            <div>
                <MonacoEditor
                    //絶対にroot要素にしない。divで囲む等する。
                    width={"100%"}
                    height={"50vh"}
                    value={mdProps.mdText}
                    defaultLanguage="plaintext"
                    options={{
                        wordWrap: "on",
                        minimap: { enabled: false },
                        dragAndDrop: true,
                        dropIntoEditor: {
                            enabled: true,
                            showDropSelector: "afterDrop",
                        },
                    }}
                    onMount={handleMonacoDidMount}
                    onChange={(value) => {
                        if (value) {
                            handleMonacoChanged(value)
                        }
                    }}
                />
            </div>
            <br />
            <hr />
            <h2>PREVIEW</h2>
            <PreviewComponent Component={mdProps.mdParsed.reactComponent} />
        </div>
    )
}

export default SampleTexteditor
