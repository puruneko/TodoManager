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

import { customMdastToHastHandlers, listItemHandler } from "./md2hHandlers"
import { useCEvents, useCEventsFunction } from "../store/cEventsStore"
import {
    MdPosition,
    useMdProps,
    useMdPropsFunction,
} from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import { Draggable } from "@fullcalendar/interaction/index.js"
import { customComponentsFromHast } from "./h2reactHandler"
import { md2mdParserPlugin_message } from "./md2mdHandler"
import { getTasks } from "./mdtext2taskHandler"
import { getMonacoPosition } from "./monacoUtils"

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
    const processorRef = useRef<any>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor>()
    //
    // component did mount
    //
    useEffect(() => {
        __debugPrint__("process")
        processorRef.current = unified()
            .use(remarkParse, { fragment: true }) //parser(text->mdast)
            .use(remarkGfm)
            //@ts-ignore(問題なし)
            .use(md2mdParserPlugin_message)
            //
            .use(remarkRehype, { handlers: customMdastToHastHandlers }) //transformer(mdast->hast)
            //
            //.use(rehypeStringify) //compiler(hast->html)
            //@ts-ignore(OSSの型定義が古い)
            .use(rehypeReact, {
                ...production,
                components: customComponentsFromHast,
            }) //compiler(hast->react)
        //
        //inter component
        //
        icChannel.on("focusTextarea", (payload: { position: MdPosition }) => {
            if (monacoRef.current) {
                const startpos = payload.position.start || null
                monacoRef.current.setSelection({
                    startLineNumber: startpos.line,
                    startColumn: startpos.column,
                    endLineNumber: startpos.line,
                    endColumn: startpos.column,
                })
                monacoRef.current.focus()
            }
            __debugPrint__("textareaFocus in texteditor", payload)
        })
        icChannel.on("getPosition", (payload: {} | undefined) => {
            return getMonacoPosition(monacoRef.current)
        })
        //
        //
        //
        //debug
        //
        icChannel.on("debug", (payload) => {
            __debugPrint__("debug in icChannel.on", payload)
            setDebug(() => {
                return payload.color
            })
        })
        //
    }, [])
    //
    // mdtext changed
    //
    const handleMdtextChanged = async (mdtext) => {
        __debugPrint__("handleMdtextChanged")
        const processor = processorRef.current
        if (processor) {
            const parsed = processor.parse(mdtext)
            const transformed = processor.runSync(parsed)
            const contents = await processor.process(mdtext)
            console.log("parsed", {
                parsed,
                transformed,
                contents,
            })
            setPreviewComponent(contents.result)
            setMdast(JSON.stringify(parsed, null, 2))
            //
            // generate tasks
            //
            const newTasks = getTasks(mdtext, parsed)
            cEventsFunc.set(newTasks)
            __debugPrint__("getTask", newTasks)
        }
    }
    useEffect(() => {
        ;(async () => {
            __debugPrint__("handleMdtextChanged")
            await handleMdtextChanged(mdProps.mdtext)
        })()
    }, [mdProps])
    //
    // editor changed
    //
    const handleTextareaChanged = (e) => {
        __debugPrint__("handleTextareaChanged")
        const mdtext = e.target.value
        mdPropsFunc.setText(mdtext)
    }
    const handleMonacoChanged = (mdtext) => {
        __debugPrint__("handleMonacoChanged")
        mdPropsFunc.setText(mdtext)
    }
    const temporaryLinetextElementRef = useRef<any>()
    const draggableTextareaRef = useRef<Draggable>()
    const origPageRef = useRef<any>({ X: -1, Y: -1 })
    const createEventFromMouse = (ev: MouseEvent, isFirst?: boolean) => {
        //PointerDragging.ts
        //PointerDragEvent
        let deltaX = 0
        let deltaY = 0

        // TODO: repeat code
        if (isFirst) {
            origPageRef.current.X = ev.pageX
            origPageRef.current.Y = ev.pageY
        } else {
            deltaX = ev.pageX - origPageRef.current.X
            deltaY = ev.pageY - origPageRef.current.Y
        }

        return {
            origEvent: ev,
            isTouch: false,
            subjectEl: temporaryLinetextElementRef.current,
            pageX: ev.pageX,
            pageY: ev.pageY,
            deltaX,
            deltaY,
        }
    }
    const handleDragStart = (e) => {
        const textedior = e.target as HTMLTextAreaElement
        const selectionStart = textedior.selectionStart
        const selectionEnd = textedior.selectionEnd
        //
        temporaryLinetextElementRef.current = document.createElement("span")
        temporaryLinetextElementRef.current.visible = false
        temporaryLinetextElementRef.current.innerText =
            textedior.value.substring(selectionStart, selectionEnd)
        document.body.appendChild(temporaryLinetextElementRef.current)
        draggableTextareaRef.current = new Draggable(
            temporaryLinetextElementRef.current,
            {
                eventData: (el: HTMLTextAreaElement) => {
                    return {
                        selectionStart: el.selectionStart,
                    }
                },
            }
        )
        const ev = createEventFromMouse(e, true)
        draggableTextareaRef.current.handlePointerDown(ev)
        draggableTextareaRef.current.handleDragStart(ev)
        //
        __debugPrint__(
            "handleDragStart:",
            e,
            selectionStart,
            textedior,
            temporaryLinetextElementRef.current,
            temporaryLinetextElementRef.current.getBoundingClientRect(),
            draggableTextareaRef.current,
            ev
        )
        e.dataTransfer.setData("application/texteditor", selectionStart)
    }
    const handleDragging = (e) => {
        const d = draggableTextareaRef.current
        if (d) {
            //{hit: Hit | null, isFinal: boolean, ev: PointerDragEvent}
            //d.dragging.emitter.trigger("hitupdate", { hit, isFinal, ev })
            const ev = createEventFromMouse(e)
            __debugPrint__("handleDragging", e, d, ev)
            d.dragging.emitter.trigger("pointermove", ev)
            d.dragging.emitter.trigger("dragmove", ev)
        }
        __debugPrint__(d)
    }
    const handleDragEnd = (e) => {
        const d = draggableTextareaRef.current
        if (d) {
            const ev = createEventFromMouse(e)
            __debugPrint__("handleDragEnd", e, ev, d)
            draggableTextareaRef.current?.dragging.emitter.trigger(
                "pointerup",
                ev
            )
            draggableTextareaRef.current?.dragging.emitter.trigger(
                "dragend",
                ev
            )
        }
        draggableTextareaRef.current?.destroy()
        temporaryLinetextElementRef.current = undefined
    }
    //
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
            /*
            editor.onDidChangeCursorSelection((e) => {
                Array.from(document.querySelectorAll(".view-overlays div")).map(
                    (el, i) => {
                        el.draggable = true
                        el.addEventListener("dragstart", (ev) => {
                            __debugPrint__("dragstart!!!")
                            ev.dataTransfer.setData("text", el.innerHTML)
                        })
                    }
                )
            })
                */
            // エディタのDOM要素を取得
            const editorDomNode = editor.getDomNode()
            if (editorDomNode) {
                // マウスダウンで手動ドラッグを実装
                editor.onMouseDown((e) => {
                    const selection = editor.getSelection()
                    const model = editor.getModel()
                    if (editor && model && selection) {
                        const selectedText = model.getValueInRange(selection)

                        // 一時的にドキュメント全体にドラッグイベントを設定
                        const onDragStart = (dragEvent) => {
                            dragEvent.dataTransfer.setData(
                                "text/plain",
                                selectedText
                            )
                            dragEvent.dataTransfer.effectAllowed = "move"

                            // ドロップ処理を補完するため削除を予約
                            dragEvent.dataTransfer.dropEffect = "move"
                        }

                        // 非表示のダミー要素で強制 dragstart
                        const dummy = document.createElement("div")
                        dummy.textContent = selectedText
                        dummy.style.position = "absolute"
                        dummy.style.top = "-9999px"
                        dummy.style.userSelect = "none"
                        document.body.appendChild(dummy)

                        dummy.setAttribute("draggable", "true")
                        dummy.addEventListener("dragstart", onDragStart)
                        dummy.addEventListener("dragend", () => {
                            dummy.remove()
                        })

                        // 強制的にマウスイベントをダミーに送って drag 開始
                        const evt = new MouseEvent("mousedown", {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: e.event.posx,
                            clientY: e.event.posy,
                        })
                        dummy.dispatchEvent(evt)
                    }
                })
            }
        }
    }
    ////////////////////////////////
    return (
        <div>
            <h1 style={{ color: debug }}>TEXTEDITOR</h1>
            {/*
            <textarea
                ref={textareaRef}
                value={mdProps.mdtext}
                onChange={handleTextareaChanged}
                onDragStart={handleDragStart}
                onDrag={handleDragging}
                onDragEnd={handleDragEnd}
                style={{
                    minWidth: "100%",
                    minHeight: "20em",
                    //@ts-ignore(experimental prop)
                    fieldSizing: "content",
                }}
            />
            */}
            <hr />
            <div>
                <MonacoEditor
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
            <textarea />
            <pre style={{ display: "none" }}>{mdast}</pre>
            {/*<div dangerouslySetInnerHTML={{ __html: content }}></div>*/}
            <hr />
            {previewComponent}
        </div>
    )
}

export default SampleTexteditor
