import { State } from "mdast-util-to-hast"

import {
    Node as MdastNode,
    Nodes as MdastNodes,
    Parents as MdastParents,
    ListItem as MdastListItem,
    Paragraph as MdastParagraph,
    Text as MdastText,
} from "mdast"
import { Element as HastElement } from "hast"

/**
 * Turn an mdast `listItem` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {ListItem} node
 *   mdast node.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {Element}
 *   hast node.
 */
export function listItemHandler(state, node, parent) {
    const results = state.all(node)
    const loose = parent ? listLoose(parent) : listItemLoose(node)
    /** @type {Properties} */
    const properties: { [key: string]: any } = {}
    /** @type {Array<ElementContent>} */
    const children: any[] = []

    if (typeof node.checked === "boolean") {
        const head = results[0]
        /** @type {Element} */
        let paragraph

        if (head && head.type === "element" && head.tagName === "p") {
            paragraph = head
        } else {
            paragraph = {
                type: "element",
                tagName: "p",
                properties: {},
                children: [],
            }
            results.unshift(paragraph)
        }

        if (paragraph.children.length > 0) {
            paragraph.children.unshift({ type: "text", value: " " })
        }
        /*
        paragraph.children.unshift({
            type: 'element',
            tagName: 'input',
            properties: {type: 'checkbox', checked: node.checked, disabled: true},
            children: []
          })
        */
        paragraph.children.unshift({
            type: "element",
            tagName: "mycheckbox", //"input", //
            properties: {
                type: "checkbox",
                checked: node.checked,
                "data-pos": node.position,
            },
            children: [],
        })

        // According to github-markdown-css, this class hides bullet.
        // See: <https://github.com/sindresorhus/github-markdown-css>.
        properties.className = ["task-list-item"]
    }

    let index = -1

    while (++index < results.length) {
        const child = results[index]

        // Add eols before nodes, except if this is a loose, first paragraph.
        if (
            loose ||
            index !== 0 ||
            child.type !== "element" ||
            child.tagName !== "p"
        ) {
            children.push({ type: "text", value: "\n" })
        }

        if (child.type === "element" && child.tagName === "p" && !loose) {
            children.push(...child.children)
        } else {
            children.push(child)
        }
    }

    const tail = results[results.length - 1]

    // Add a final eol.
    if (tail && (loose || tail.type !== "element" || tail.tagName !== "p")) {
        children.push({ type: "text", value: "\n" })
    }

    /** @type {Element} */
    const result = { type: "element", tagName: "li", properties, children }
    state.patch(node, result)
    return state.applyData(node, result)
}

/**
 * @param {Parents} node
 * @return {Boolean}
 */
function listLoose(node) {
    let loose = false
    if (node.type === "list") {
        loose = node.spread || false
        const children = node.children
        let index = -1

        while (!loose && ++index < children.length) {
            loose = listItemLoose(children[index])
        }
    }

    return loose
}

/**
 * @param {ListItem} node
 * @return {Boolean}
 */
function listItemLoose(node) {
    const spread = node.spread

    return spread === null || spread === undefined
        ? node.children.length > 1
        : spread
}

////////////////////////////////

const md2hHandler_message: T_MdastToHastHandler = (state, node, parent) => {
    return {
        type: "element",
        tagName: "div",
        properties: {
            className: ["msg"],
        },
        children: state.all(node),
    }
}

const md2hHandler_hashtag: T_MdastToHastHandler = (state, node, parent) => {
    return {
        type: "element",
        tagName: "span",
        properties: {
            className: ["myhashtag"],
        },
        children: state.all(node),
    }
}

type T_MdastToHastHandler = (
    state: State,
    node: MdastNodes,
    parent: MdastParents
) => HastElement

export const customMdastToHastHandlers: {
    [key: string]: T_MdastToHastHandler
} = {
    message: md2hHandler_message,
    listItem: listItemHandler,
    hashtag: md2hHandler_hashtag,
}
