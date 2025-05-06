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
const getTasks = (tree) => {
    let tasks: any[] = []
    if (tree.children) {
        let listitems: MdastListItem[] = []
        for (let treeChild of tree.children) {
            if (treeChild.type == "list") {
                listitems = treeChild.children
                for (let listitem of listitems) {
                    if (listitem.checked !== null) {
                        const paragraphItem = listitem
                            .children[0] as MdastParagraph
                        const textItem = paragraphItem.children[0] as MdastText
                        const linetext = textItem.value
                        const pos = listitem.position
                        const hashtags = getHashtag(linetext)
                        const dateHashtags = hashtags
                            .filter((h) =>
                                h.replace("#", "").startsWith("scheduled")
                            )
                            .map((h) => {
                                return dateHashtagValue2dateRange(h)
                            }) //[NOTE]scheduledタグは１つしか付けられない想定の実装
                        __debugPrint__(textItem)
                        if (pos) {
                            tasks.push({
                                id: mdpos2cEventid(pos),
                                title: removeHashtag(linetext),
                                position: pos,
                                checked: listitem.checked,
                                tags: hashtags,
                                start:
                                    dateHashtags.length != 0
                                        ? dateHashtags[0].start
                                        : undefined,
                                end:
                                    dateHashtags.length != 0
                                        ? dateHashtags[0].end
                                        : undefined,
                                description: "dummy text.".repeat(10),
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

////////////////////////////////
function SampleTexteditor() {
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
    ////////////////////////////////
    return (
        <>
            <h1>TEXTEDITOR</h1>
            <textarea
                value={mdProps.mdtext}
                onChange={handleTextareaChanged}
                style={{
                    minWidth: "100%",
                    minHeight: "20em",
                    //@ts-ignore(experimental prop)
                    fieldSizing: "content",
                }}
            />
            <br />
            <pre style={{ display: "none" }}>{mdast}</pre>
            {/*<div dangerouslySetInnerHTML={{ __html: content }}></div>*/}
            <hr />
            {previewComponent}
        </>
    )
}

export default SampleTexteditor
