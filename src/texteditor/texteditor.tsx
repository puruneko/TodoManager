/**
 * 各種モジュールのインストール
 */
import React, {
    useState,
    useRef,
    useMemo,
    useCallback,
    SetStateAction,
    useEffect,
    useReducer,
} from "react"

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
import rehypeStringify from "rehype-stringify"
import production from "react/jsx-runtime"
import rehypeReact from "rehype-react"

import { inspect } from "unist-util-inspect"
import { visit, Visitor } from "unist-util-visit"
import { VFileCompatible } from "vfile"
import {
    Node as UnistNode,
    Parent as UnistParent,
    Literal as UnistLiteral,
    Position,
} from "unist"
import {
    Node as MdastNode,
    Nodes as MdastNodes,
    Parents as MdastParents,
    ListItem as MdastListItem,
    Paragraph as MdastParagraph,
    Text as MdastText,
} from "mdast"
import { Element as HastElement } from "hast"
import { State } from "mdast-util-to-hast"

import { listItemHandler } from "./md2hHandlers"
import { useCEvents, useCEventsFunction } from "../store/cEventsStore"
import {
    dateHashtagValue2dateRange,
    mdpos2cEventid,
    useMdProps,
    useMdPropsFunction,
} from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import { Draggable } from "@fullcalendar/interaction/index.js"

////////////////////////////////
function isObject(target: unknown): target is { [key: string]: unknown } {
    return typeof target === "object" && target !== null
}

// https://github.com/syntax-tree/unist#node
export function isNode(node: unknown): node is Node {
    return isObject(node) && "type" in node
}

// https://github.com/syntax-tree/unist#parent
export function isParent(node: unknown): node is UnistParent {
    return isObject(node) && Array.isArray(node.children)
}

// https://github.com/syntax-tree/unist#literal
export function isLiteral(node: unknown): node is UnistLiteral {
    return isObject(node) && "value" in node
}

// https://github.com/syntax-tree/mdast#paragraph
export function isParagraph(node: UnistNode): node is MdastParagraph {
    return isNode(node) && node.type === "paragraph"
}

// https://github.com/syntax-tree/mdast#text
export function isText(node: unknown): node is Text {
    return (
        isLiteral(node) &&
        node.type === "text" &&
        typeof node.value === "string"
    )
}

const MESSAGE_BEGGINING = ":::message\n"
const MESSAGE_ENDING = "\n:::"

function processFirstChild(children: Array<UnistNode>, identifier: string) {
    const firstChild = children[0] as UnistLiteral
    const firstValue = firstChild.value as string
    if (firstValue === identifier) {
        children.shift()
    } else {
        children[0] = {
            ...firstChild,
            value: firstValue.slice(identifier.length),
        } as UnistLiteral
    }
}

function processLastChild(children: Array<UnistNode>, identifier: string) {
    const lastIndex = children.length - 1
    const lastChild = children[lastIndex] as UnistLiteral
    const lastValue = lastChild.value as string
    if (lastValue === identifier) {
        children.pop()
    } else {
        children[lastIndex] = {
            ...lastChild,
            value: lastValue.slice(0, lastValue.length - identifier.length),
        } as UnistLiteral
    }
}

function md2mdParserTester_message(node: MdastNode): node is MdastParagraph {
    //console.log("in isMessagePattern", structuredClone({ node }))
    if (!isParagraph(node)) {
        return false
    }

    const { children } = node

    const firstChild = children[0]
    if (
        //@ts-ignore
        !(isText(firstChild) && firstChild.value.startsWith(MESSAGE_BEGGINING))
    ) {
        return false
    }

    const lastChild = children[children.length - 1]
    //@ts-ignore
    if (!(isText(lastChild) && lastChild.value.endsWith(MESSAGE_ENDING))) {
        return false
    }

    return true
}
/**
 * visitのtest関数がtrueなら呼ばれる
 * 引数のnodeはtest関数で検査されたブロック単位のnode
 * @param node      test関数でマッチしたnode
 * @param index     引数parentから見た引数nodeのインデックス
 * @param parent    引数nodeの親要素
 * @returns undefined
 */
const md2mdParserVisitor_message: Visitor<MdastParagraph, UnistParent> = (
    node: MdastParagraph,
    index: number | undefined,
    parent: UnistParent | undefined
) => {
    if (!isParent(parent) || index === undefined) {
        return
    }
    console.log("in visitor", structuredClone({ node, index, parent }))

    const children = [...node.children]
    processFirstChild(children, MESSAGE_BEGGINING)
    processLastChild(children, MESSAGE_ENDING)

    //
    parent.children[index] = {
        type: "message",
        children,
    } as UnistParent
}
const md2mdParserPlugin_message = () => {
    return (tree: Node, _file: VFileCompatible) => {
        console.log("--->myParserPlugin", structuredClone({ tree, _file }))
        //@ts-ignore
        visit(tree, md2mdParserTester_message, md2mdParserVisitor_message)
        console.log("<---myParserPlugin")
    }
}
const md2hHandler_message: MdastToHastHandlerType = (state, node, parent) => {
    return {
        type: "element",
        tagName: "div",
        properties: {
            className: ["msg"],
        },
        children: state.all(node),
    }
}

////////////////////////////////

type MdastToHastHandlerType = (
    state: State,
    node: MdastNodes,
    parent: MdastParents
) => HastElement
const customMdastToHastHandlers: { [key: string]: MdastToHastHandlerType } = {
    message: md2hHandler_message,
    listItem: listItemHandler,
}

const component_message = (props) => {
    console.log("props", props)
    return (
        <div>
            {props.children.map((c) => {
                console.log("type", typeof c)
                if (typeof c === "string") {
                    return c
                }
                return c
            })}
        </div>
    )
}
const component_dev = (props) => {
    return (
        <>
            <input type="checkbox" />
            {props.children}
        </>
    )
}
const customComponentsFromHast = {
    //message: component_message,
    mycheckbox: component_dev,
}

////////////////////////////////
const regexpHashtag = new RegExp("(?<=^|[ 　]+?)#(\\S+)(?<=[ 　]*)", "g")
const getHashtag = (linetext: string) => {
    return Array.from(linetext.matchAll(regexpHashtag), (m) => m[1])
}
const removeHashtag = (linetext: string) => {
    return linetext.replace(regexpHashtag, "").trim()
}
const getText = (tree) => {
    let text = ""
    if (tree.type == "text") {
        return tree.value
    }
    for (let child of tree.children || []) {
        if (child.type == "text") {
            text += child.value
        } else {
            text += getText(child)
        }
        if (child.type == "paragraph") {
            text += "\n"
        }
    }
    return text
}
const getTasks = (tree) => {
    let tasks: any[] = []
    if (tree.children) {
        let listitems: MdastListItem[] = []
        for (let treeChild of tree.children) {
            if (treeChild.type == "list") {
                listitems = treeChild.children
                for (let listitem of listitems) {
                    if (listitem.checked !== null) {
                        //descriptionの抽出
                        let description: any = {
                            items: listitem.children.slice(1),
                            value: "",
                        }
                        description.value = getText({
                            type: "listitem",
                            children: description.items,
                        }).trim()
                        description.pos =
                            description.items.length > 0
                                ? {
                                      start: description.items[0].position
                                          ?.start,
                                      end: description.items[
                                          description.items.length - 1
                                      ].position?.end,
                                  }
                                : undefined
                        //task本文の処理
                        const paragraphItem = listitem
                            .children[0] as MdastParagraph
                        const textItem = paragraphItem.children[0] as MdastText
                        const linetext = textItem.value
                        const pos = listitem.position
                        const taskPos = {
                            start: pos?.start,
                            end: paragraphItem.position?.end,
                        }
                        const hashtags = getHashtag(linetext)
                        const dateHashtagValue = hashtags
                            .filter((h) =>
                                h.replace("#", "").startsWith("scheduled")
                            )
                            .map((h) => {
                                return dateHashtagValue2dateRange(h)
                            }) //[NOTE]scheduledタグは１つしか付けられない想定の実装
                        __debugPrint__(textItem)
                        //taskの登録
                        if (pos) {
                            tasks.push({
                                id: mdpos2cEventid(pos),
                                title: removeHashtag(linetext),
                                position: pos,
                                taskPosition: taskPos,
                                checked: listitem.checked,
                                tags: hashtags,
                                start:
                                    dateHashtagValue.length != 0
                                        ? dateHashtagValue[0].start
                                        : null,
                                end:
                                    dateHashtagValue.length != 0
                                        ? dateHashtagValue[0].end
                                        : null,
                                allDay: !(dateHashtagValue.length != 0
                                    ? dateHashtagValue[0].end
                                    : null),
                                description: description.value, //"dummy text.".repeat(10),
                                descriptionPosition: description.pos,
                            })
                        } else {
                            throw Error(`pos is undefined(${linetext})`)
                        }
                    }
                    /*
                    if (listitem.children.some((c) => c.type == "list")) {
                        getTask(listitem).forEach((task) => {
                            tasks.push(task)
                        })
                    }
                        */
                }
            }
            getTasks(treeChild).forEach((task) => {
                tasks.push(task)
            })
        }
    }
    return tasks
}

//
//monaco
//
const getMonacoSelection = (
    editor: monaco.editor.IStandaloneCodeEditor | undefined
) => {
    const model = editor?.getModel()
    if (editor && model) {
        return editor.getSelection()
    }
}
const getMonacoPosition = (
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
    const icChannel = useIcChannel("texteditor")
    const debugRef = useRef<any>("")
    const [debug, setDebug] = useState<any>("")
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
        icChannel.on("focusTextarea", (payload: { position: Position }) => {
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
            const newTasks = getTasks(parsed)
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
