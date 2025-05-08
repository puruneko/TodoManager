/**
 * 各種モジュールのインストール
 */
import React, { useState, useRef, useEffect } from "react"

////
//https://github.com/suren-atoyan/monaco-react
import MonacoEditor from "@monaco-editor/react"

//https://microsoft.github.io/monaco-editor/docs.html
import monaco from "monaco-editor"
import type monacoType from "monaco-editor"

////////////////////////////////
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
//import rehypeStringify from "rehype-stringify"
import production from "react/jsx-runtime"
import rehypeReact from "rehype-react"

//
import { customMdastToHastHandlers } from "./md2hHandlers"
import { useCEvents, useCEventsFunction } from "../store/cEventsStore"
import { MdRange, useMdProps, useMdPropsFunction } from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import { customComponentsFromHast } from "./h2reactHandler"
import { md2mdParserPlugin_message } from "./md2mdHandler"
import { getTasks } from "./mdtext2taskHandler"
import {
    getMonacoPosition,
    getMonacoScrollTopPxByLineNumber,
    mdRange2monacoRange,
} from "./monacoUtils"
import { initializeMdProcessor, parseMarkdown } from "./remarkProcessing"

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
type SampleTextareaPropsType = { debug?: any }
const SampleTexteditor: React.FC<SampleTextareaPropsType> = (props) => {
    //
    const debugRef = useRef<any>("")
    const [debug, setDebug] = useState<any>("")
    //
    //
    const icChannel = useIcChannel("texteditor")
    //
    const [mdProps, mdPropsDispatch] = useMdProps()
    const mdPropsFunc = useMdPropsFunction(mdPropsDispatch)
    //
    const [cEvents, cEventsDispatch] = useCEvents()
    const cEventsFunc = useCEventsFunction(cEventsDispatch)
    //
    const [previewComponent, setPreviewComponent] = useState("")
    const [mdast, setMdast] = useState("")

    ////////////////////////////////
    const mdProcessorRef = useRef<any>(null)
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor>()
    //
    // component did mount
    //
    useEffect(function componentDidMount() {
        __debugPrint__("process")
        //
        //md parse processor
        //
        initializeMdProcessor()
        /*
        mdProcessorRef.current = unified()
            //
            //parser(text->mdast)
            //
            .use(remarkParse, { fragment: true })
            .use(remarkGfm)
            //@ts-ignore(問題なし)
            .use(md2mdParserPlugin_message)
            //
            //transformer(mdast->hast)
            //
            .use(remarkRehype, { handlers: customMdastToHastHandlers })
            //
            //compiler(hast->react or html)
            //
            //@ts-ignore(OSSの型定義が古い)
            .use(rehypeReact, {
                ...production,
                components: customComponentsFromHast,
            })
            //.use(rehypeStringify)
        */
        //
        //inter component event
        //
        icChannel.on("setSelection", (payload: { range: MdRange }) => {
            if (monacoRef.current) {
                const startpos = payload.range.start
                monacoRef.current.setSelection(
                    mdRange2monacoRange({ start: startpos, end: startpos })
                )
            }
            __debugPrint__("setSelection in texteditor", payload)
        })
        icChannel.on("focusTextarea", (payload: { range: MdRange }) => {
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
        //
        //debug
        //
        icChannel.on("debug", (payload) => {
            __debugPrint__("debug in icChannel.on", payload)
            setDebug(() => {
                return payload.color
            })
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
            model.setValue(mdProps.mdtext)
            ;(async () => {
                //__debugPrint__("mdpropsChanged")
                await handleMdtextChanged(mdProps.mdtext)
            })()
        }
    }
    //
    // mdtext changed
    //
    const handleMdtextChanged = async (mdtext) => {
        __debugPrint__("handleMdtextChanged")
        const parsed = await parseMarkdown(mdtext)
        if (parsed) {
            __debugPrint__("parsed", parsed)
            setPreviewComponent(parsed.contents.result)
            setMdast(JSON.stringify(parsed, null, 2))
            //
            // generate tasks
            //
            const newTasks = getTasks(mdtext, parsed.parsed)
            cEventsFunc.set(newTasks)
            __debugPrint__("getTask", newTasks)
        }
    }
    useEffect(
        function mdpropsChanged() {
            ;(async () => {
                __debugPrint__("mdpropsChanged")
                await handleMdtextChanged(mdProps.mdtext)
            })()
        },
        [mdProps.mdtext]
    )
    /*
    useEffect(
        function mdParsedChanged() {
        },
        [mdProps.parsed]
    )
    */
    //
    // editor changed
    //
    const handleMonacoChanged = (mdtext) => {
        __debugPrint__("handleMonacoChanged")
        //mdPropsFunc.setText(mdtext)
        ;(async (mdtext) => {
            //__debugPrint__("mdpropsChanged")
            await handleMdtextChanged(mdtext)
        })(mdtext)
    }
    ////////////////////////////////
    return (
        <div>
            <h1 style={{ color: debug }}>TEXTEDITOR</h1>
            <hr />
            <div>
                <MonacoEditor
                    //絶対にroot要素にしない。divで囲む等する。
                    width={"100%"}
                    height={"50vh"}
                    value={mdProps.mdtext}
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
            {previewComponent}
        </div>
    )
}

export default SampleTexteditor
