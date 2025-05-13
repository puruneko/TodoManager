////////////////////////////////
import { visit, Visitor } from "unist-util-visit"
import { is } from "unist-util-is"
import { VFileCompatible } from "vfile"
import {
    Node as UnistNode,
    Parent as UnistParent,
    Literal as UnistLiteral,
    Position as UnistPosition,
} from "unist"
import {
    Node as MdastNode,
    Nodes as MdastNodes,
    Parents as MdastParents,
    ListItem as MdastListItem,
    Paragraph as MdastParagraph,
    Text as MdastText,
    PhrasingContent,
} from "mdast"
import {
    getNodeChildrenText,
    nodeWithPosition,
    UnistPositionWithOffset,
} from "./mdText2taskHandler"
import { Processor } from "unified"
import {
    fromMarkdown,
    Options as FromMarkdownOptions,
} from "mdast-util-from-markdown"

////////////////////////////////
function isObject(target: unknown): target is { [key: string]: unknown } {
    return typeof target === "object" && target !== null
}

// https://github.com/syntax-tree/unist#node
export function isNode(node: unknown): node is MdastNode {
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
export function isText(node: unknown): node is MdastText {
    return (
        isLiteral(node) &&
        node.type === "text" &&
        typeof node.value === "string"
    )
}

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

//
//debug (dev sample)
//
const MESSAGE_BEGGINING = ":::message\n"
const MESSAGE_ENDING = "\n:::"

const isTaskItem = (node) => {
    return node.type == "listItem" && node.checked !== undefined
}

function md2mdParserTester_debug(node: MdastNode): node is MdastParagraph {
    //console.log("in isMessagePattern", structuredClone({ node }))
    return isParagraph(node)
    /*
    if (!isParagraph(node)) {
        return false
    }

    const {     children } = node

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
    */
}
const getTextPosition = (targetText: string): UnistPositionWithOffset => {
    const lines = targetText.split("\n")
    const lineNumberInText = lines.length - 1
    const column = lines[lineNumberInText].length
    return {
        start: {
            line: 1,
            column: 1,
            offset: 0,
        },
        end: {
            line: 1 + lineNumberInText,
            column: column + 1,
            offset: targetText.length,
        },
    }
}
/*
const operatePosition = (x: UnistPositionWithOffset, y: UnistPositionWithOffset, f:(a:number,b:number)=>number): UnistPositionWithOffset => {
    return {
        start: {
            line: f(x.start.line, y.start.line),
            column: f(x.start.column, y.start.column),
            offset: f(x.start.offset, y.start.offset),
        },
        end: {
            line: f(x.end.line, y.end.line),
            column: f(x.end.column, y.end.column),
            offset: f(x.end.offset, y.end.offset),
        },
    }
}
const operateAddPosition = (x: UnistPositionWithOffset, y: UnistPositionWithOffset): UnistPositionWithOffset => {
    const f = (a,b)=>a+b
    return operatePosition(x,y,f)
}
*/
const getTextInlinePosition = (
    baseText: string,
    basePosition: UnistPositionWithOffset,
    startOffset: number,
    targetText: string
) => {
    //
    const preText = baseText.slice(0, startOffset)
    const prePosition = getTextPosition(preText)
    //
    const targetRelPosition = getTextPosition(targetText)
    const shiftPosition = {
        start: {
            line:
                targetRelPosition.start.line - 1 + (prePosition.start.line - 1),
            column:
                targetRelPosition.start.column -
                1 +
                (prePosition.start.column - 1),
            offset: targetRelPosition.start.offset + prePosition.start.offset,
        },
        end: {
            line: targetRelPosition.end.line - 1 + (prePosition.end.line - 1),
            column:
                targetRelPosition.end.column - 1 + (prePosition.end.column - 1),
            offset: targetRelPosition.end.offset + prePosition.end.offset,
        },
    }
    const res = {
        start: {
            line: basePosition.start.line + shiftPosition.start.line,
            column: shiftPosition.start.column,
            offset: basePosition.start.offset + shiftPosition.start.offset,
        },
        end: {
            line: basePosition.start.line + shiftPosition.end.line,
            column: shiftPosition.end.column,
            offset: basePosition.start.offset + shiftPosition.end.offset,
        },
    }
    return res
}
/**
 * visitのtest関数がtrueなら呼ばれる
 * 引数のnodeはtest関数で検査されたブロック単位のnode
 * @param node      test関数でマッチしたnode
 * @param index     引数parentから見た引数nodeのインデックス
 * @param parent    引数nodeの親要素
 * @returns undefined
 */
const md2mdParserVisitor_debug: Visitor<MdastParagraph, UnistParent> = (
    node: MdastParagraph,
    index: number | undefined,
    parent: UnistParent | undefined
) => {
    const PRE_SYMBOL = "#"
    //const OLD_regstrHashtag = new RegExp(`(${PRE_SYMBOL}(\\w)+)`, "gi")
    const regstrHashtag = new RegExp(`${PRE_SYMBOL}(\\S+)`, "gi")
    const children = [...node.children]
    node.children = []

    children.forEach((_child: PhrasingContent) => {
        if (!isText(_child)) {
            node.children.push(_child)
            return
        }
        const paragraphChild = nodeWithPosition(_child)

        const matches = Array.from(
            paragraphChild.value.matchAll(regstrHashtag),
            (x) => x
        )

        if (matches.length === 0) {
            node.children.push(paragraphChild)
            return true
        }

        if (matches[0].index > 0) {
            const beforeHashtagText = paragraphChild.value.slice(
                0,
                matches[0].index
            )
            const pos_before = getTextInlinePosition(
                paragraphChild.value,
                paragraphChild.position,
                0,
                beforeHashtagText
            )
            node.children.push({
                type: "text",
                value: beforeHashtagText,
                position: pos_before,
            })
        }

        matches.forEach((match: any, index) => {
            const hashtagText = match[0] as string
            const hashtagName = match[1] as string
            const hashtagOffset = match.index
            //
            /*
            const startOffsetInPhrasingContent = match.index
            const beforeHashtagText = paragraphChild.value.slice(
                0,
                startOffsetInPhrasingContent
            )
            const startColumnInPhrasingContent = beforeHashtagText
                .split("\n")
                .reverse()[0].length
            const startLineNumberInPhrasingContent =
                beforeHashtagText.split("\n").length - 1
            //
            const endOffsetInPhrasingContent =
                startOffsetInPhrasingContent + hashtagText.length
            const endColumnInPhrasingContent = hashtagText
                .split("\n")
                .reverse()[0].length
            const endLineNumberInPhrasingContent =
                startLineNumberInPhrasingContent +
                hashtagText.split("\n").length -
                1
            const positionShift: UnistPositionWithOffset = {
                start: {
                    line: startLineNumberInPhrasingContent,
                    column: startColumnInPhrasingContent,
                    offset: startOffsetInPhrasingContent,
                },
                end: {
                    line: endLineNumberInPhrasingContent,
                    column: endColumnInPhrasingContent,
                    offset: endOffsetInPhrasingContent,
                },
            }
            const p_dev = paragraphChild.position
                ? ({
                      start: {
                          line:
                              paragraphChild.position.start.line +
                              positionShift.start.line,
                          column:
                              paragraphChild.position.start.column +
                              positionShift.start.column,
                          offset:
                              paragraphChild.position.start.offset +
                              positionShift.start.offset,
                      },
                      end: {
                          line:
                              paragraphChild.position.start.line +
                              positionShift.end.line,
                          column:
                              paragraphChild.position.start.column +
                              positionShift.end.column,
                          offset:
                              paragraphChild.position.start.offset +
                              positionShift.end.offset,
                      },
                  } as UnistPositionWithOffset)
                : undefined
            */
            const pos_hashtag = getTextInlinePosition(
                paragraphChild.value,
                paragraphChild.position,
                hashtagOffset,
                hashtagText
            )
            const pos_text = getTextInlinePosition(
                paragraphChild.value,
                paragraphChild.position,
                hashtagOffset + PRE_SYMBOL.length,
                hashtagText
            )
            node.children.push({
                //@tes-ignore(typeの追加のためOK)
                type: "strong", //"hashtag",
                children: [
                    { type: "text", value: hashtagText, position: pos_text },
                ],
                position: pos_hashtag,
            })

            //途中の要素
            if (matches.length > index + 1) {
                const startAt = hashtagOffset + hashtagText.length
                const subtext = paragraphChild.value.slice(
                    startAt,
                    matches[index + 1].index - startAt
                )
                const pos = getTextInlinePosition(
                    paragraphChild.value,
                    paragraphChild.position,
                    startAt,
                    subtext
                )
                node.children.push({
                    type: "text",
                    value: subtext,
                    position: pos,
                })
            }
        })

        const lastMatch = matches[matches.length - 1]
        const lastMatchAt = lastMatch.index + lastMatch[0].length

        //@ts-ignore
        if (lastMatchAt < paragraphChild.value.length) {
            const lastText = paragraphChild.value.slice(lastMatchAt)
            const pos = getTextInlinePosition(
                paragraphChild.value,
                paragraphChild.position,
                lastMatchAt,
                lastText
            )
            node.children.push({
                type: "text",
                value: lastText,
                position: pos,
            })
        }
    })
}

export const md2mdParserPlugin_debug = (preset) => {
    return (tree: MdastNode, _file: VFileCompatible) => {
        //@ts-ignore
        visit(tree, md2mdParserTester_debug, md2mdParserVisitor_debug)
    }
}

//
//tag
//

const TAG_BEGGINING = ":::message\n"
const TAG_ENDING = "\n:::"

function md2mdParserTester_tag(node: MdastNode): node is MdastParagraph {
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
const md2mdParserVisitor_tag: Visitor<MdastParagraph, UnistParent> = (
    node: MdastParagraph,
    index: number | undefined,
    parent: UnistParent | undefined
) => {
    if (!isParent(parent) || index === undefined) {
        return
    }

    const children = [...node.children]
    processFirstChild(children, MESSAGE_BEGGINING)
    processLastChild(children, MESSAGE_ENDING)

    //
    parent.children[index] = {
        type: "message",
        children,
    } as UnistParent
}

export const md2mdParserPlugin_tag = () => {
    return (tree: Node, _file: VFileCompatible) => {
        //@ts-ignore
        visit(tree, md2mdParserTester_message, md2mdParserVisitor_message)
    }
}

//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////
function rubyLocator(value, fromIndex) {
    return value.indexOf("｜", fromIndex)
}
function rubyTokenizer(eat, value, silent) {
    if (value.charAt(0) !== "｜") {
        return
    }
    const rtStartIndex = value.indexOf("《")
    const rtEndIndex = value.indexOf("》", rtStartIndex)
    if (rtStartIndex <= 0 || rtEndIndex <= 0) {
        return
    }
    //ルビの対象となるテキスト rubyRef
    const rubyRef = value.slice(1, rtStartIndex)
    //ルビの内容 rubyText
    const rubyText = value.slice(rtStartIndex + 1, rtEndIndex)
    if (silent) {
        return true // Silentモードはconsumeせずtrueを返す
    }
    //読み進める文字数だけ column と offset の値を更新した上で tokenizeInline に与えることで、再帰的に実行される tokenizer の位置情報を更新しています。
    const now = eat.now() // テキスト中の現在の位置を取得
    now.column += 1
    now.offset += 1
    //eat という関数は tokenizer を読みすすめるための関数で、引数にルビとして consume（消費）する文字列を与えることでその分だけ字句解析を進めます。
    //eat の返値は関数になっており、消費した文字列に対応する mdast のノードを与えることで AST の構文木に追加できます。
    return eat(value.slice(0, rtEndIndex + 1))({
        type: "ruby",
        rubyText,
        //@ts-ignore
        children: this.tokenizeInline(rubyRef, now),
        data: { hName: "ruby" },
    })
}
export function rubyAttacher(this: Processor) {
    //定義した locator と tokenizer を利用するよう rubyAttacher を定義。
    // inlineMethod には適用する tokenizer の名前が配列で示されており、配列内の順番がそのまま tokenizer を実行する順番（=優先順位）になります。
    const self = this

    /**
     * @param {string} document
     * @returns {Root}
     */
    self.parser = function (document) {
        return fromMarkdown(document, {
            ...self.data("settings"),
            // Note: these options are not in the readme.
            // The goal is for them to be set by plugins on `data` instead of being
            // passed by users.
            extensions: self.data("micromarkExtensions") || [],
            mdastExtensions: self.data("fromMarkdownExtensions") || [],
        })
    }
    /*
    //@ts-ignore
    this.Parser = parse
    const { Parser } = this
    if (!Parser) {
        return
    }
    const { inlineTokenizers, inlineMethods } = Parser.prototype

    //@ts-ignore
    rubyTokenizer.locator = rubyLocator
    inlineTokenizers.ruby = rubyTokenizer
    inlineMethods.splice(inlineMethods.indexOf("text"), 0, "ruby")
    */
}

export function myFromMarkdown(options: Partial<FromMarkdownOptions>) {
    //@ts-ignore
    const self = this

    /**
     * @param {string} document
     * @returns {Root}
     */
    self.parser = function (document) {
        const encoding = {
            ...self.data("settings"),
            ...options,
            // Note: these options are not in the readme.
            // The goal is for them to be set by plugins on `data` instead of being
            // passed by users.
            extensions: [
                ...(self.data("micromarkExtensions") || []),
                ...(options.extensions || []),
            ],
            mdastExtensions: [
                ...(self.data("fromMarkdownExtensions") || []),
                ...(options.mdastExtensions || []),
            ],
        }
        const parser = fromMarkdown(document, encoding)
        return parser
    }
}
