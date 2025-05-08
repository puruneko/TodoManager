////////////////////////////////
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

export const md2mdParserPlugin_message = () => {
    return (tree: Node, _file: VFileCompatible) => {
        console.log("--->myParserPlugin", structuredClone({ tree, _file }))
        //@ts-ignore
        visit(tree, md2mdParserTester_message, md2mdParserVisitor_message)
        console.log("<---myParserPlugin")
    }
}
