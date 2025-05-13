import {
    Node as MdastNode,
    Nodes as MdastNodes,
    Parents as MdastParents,
    ListItem as MdastListItem,
    Paragraph as MdastParagraph,
    Text as MdastText,
    Parent as MdastParent,
} from "mdast"
import { Node as UnistNode, Position as UnistPosition } from "unist"

import {
    T_CEventDep,
    T_MdRange,
    T_MdTask,
    toTaskIdFromMdRange,
} from "../store/mdPropsStore"
import { __debugPrint__impl } from "../debugtool/debugtool"
import { filterDateHashtag, T_Hashtag, splitHashtag } from "./hashtag"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<mdTextstore>", ...args)
}
//
//
export type UnistPositionWithOffset = {
    start: {
        line: number
        column: number
        offset: number
    }
    end: {
        line: number
        column: number
        offset: number
    }
}
interface MdastMdNode extends UnistNode {
    position: UnistPositionWithOffset
}

//
const unistPosition2mdRange = (position: UnistPosition): T_MdRange => {
    if (
        position.start.offset === undefined ||
        position.end.offset === undefined
    ) {
        throw Error(`this node must have property 'position'.(${position})`)
    }
    return {
        start: {
            lineNumber: position.start.line,
            column: position.start.column,
            offset: position.start.offset,
        },
        end: {
            lineNumber: position.end.line,
            column: position.end.column,
            offset: position.end.offset,
        },
    }
}
//

const regexpHashtag = new RegExp("(?<=^|[ 　]+?)#(\\S+)(?<=[ 　]*)", "g")
const getHashtag = (linetext: string) => {
    return Array.from(linetext.matchAll(regexpHashtag), (m) => m[1])
}
const removeHashtag = (linetext: string) => {
    return linetext.replace(regexpHashtag, "").trim()
}
export const getNodeChildrenText = (tree): string => {
    let text = ""
    const _tree = "type" in tree ? tree : { type: "", children: tree }
    if (tree.type == "text") {
        return tree.value
    }
    for (let child of tree.children || []) {
        if (child.type == "text") {
            text += child.value
        } else {
            text += getNodeChildrenText(child)
        }
        if (child.type == "paragraph") {
            text += "\n"
        }
    }
    return text
}
const getMdtextByPosition = (
    mdText: string,
    position: UnistPositionWithOffset
) => {
    return mdText.substring(position.start.offset, position.end.offset)
}

export function nodeWithPosition<T extends UnistNode>(
    node: T
): T & MdastMdNode {
    if (
        node.position === undefined ||
        node.position?.start.offset === undefined ||
        node.position?.end.offset === undefined
    ) {
        throw Error(`this node must have property 'position'.(${node})`)
    }
    const nodewithrange = {
        ...node,
        position: {
            start: {
                line: node.position.start.line,
                column: node.position.start.column,
                offset: node.position.start.offset,
            },
            end: {
                line: node.position.end.line,
                column: node.position.end.column,
                offset: node.position.end.offset,
            },
        },
    }
    //@ts-ignore(後で直す)
    return nodewithrange
}

export const genLinetext = (mdObjType: string, task: T_MdTask): string => {
    let linetext = ""
    switch (mdObjType) {
        case "task":
            const tagText = task.tags
                .map((tag) => {
                    return `#${tag.name}${tag.value ? ":" + tag.value : ""}`
                })
                .join(" ")
            const descriptionText =
                task.description.value == ""
                    ? ""
                    : "\n    " + task.description.value //.replace("\n", "\n    ")
            linetext = `- [${task.checked ? "x" : " "}] ${
                task.task.value
            } ${tagText}${descriptionText}`
    }
    return linetext
}

const genTask = (
    mdText,
    listitem: MdastListItem & MdastMdNode,
    headings: T_CEventDep[]
): T_MdTask | null => {
    __debugPrint__("genTask", listitem)
    //task本文の処理
    const paragraphItem = nodeWithPosition(
        listitem.children[0] as MdastParagraph
    )
    const textItem = nodeWithPosition(paragraphItem.children[0] as MdastText)
    const linetext = textItem.value
    const unistpos = listitem.position
    const taskRange: UnistPositionWithOffset = {
        start: unistpos.start,
        end: paragraphItem.position.end,
    }

    //descriptionの抽出
    const descriptionItems = listitem.children
        .slice(1)
        .map((n) => nodeWithPosition(n))
    let description: any = {
        items: listitem.children.slice(1),
        value: "",
    }
    description.value = getNodeChildrenText({
        type: "listitem",
        children: description.items,
    }).trim()
    const descriptionRange: UnistPositionWithOffset =
        descriptionItems.length > 0
            ? {
                  start: descriptionItems[0].position.start,
                  end: descriptionItems[descriptionItems.length - 1].position
                      .end,
              }
            : { start: taskRange.start, end: taskRange.start }
    const descriptionValue = descriptionRange
        ? getMdtextByPosition(mdText, descriptionRange)
        : ""

    //taskの作成
    if (unistpos) {
        const mdRange = unistPosition2mdRange(unistpos)

        const hashtags = splitHashtag(linetext).map((hashtag) => {
            return {
                ...hashtag,
                range: hashtag.range
                    ? {
                          start: {
                              lineNumber: unistpos.start.line,
                              column:
                                  unistpos.start.column +
                                  hashtag.range.start.offset,
                              offset:
                                  unistpos.start.offset +
                                  hashtag.range.start.offset,
                          },
                          end: {
                              lineNumber: unistpos.start.line,
                              column:
                                  unistpos.start.column +
                                  hashtag.range.end.offset,
                              offset:
                                  unistpos.start.offset +
                                  hashtag.range.end.offset,
                          },
                      }
                    : undefined,
            } as T_Hashtag
        })
        let dateHashtags = filterDateHashtag(hashtags)
        /*
            .filter((h) => h.replace("#", "").startsWith("scheduled"))
            .map((h) => {
                return toDateRangeFromDateHashtagValue(h)
            }) //[NOTE]scheduledタグは１つしか付けられない想定の実装
        */
        if (dateHashtags.length == 0) {
            //@ts-ignore(後で型の整合性をとる)
            dateHashtags = [{ name: "", value: { start: null, end: null } }]
        }
        return {
            id: toTaskIdFromMdRange(mdRange),
            value: linetext,
            deps: headings,
            tags: hashtags,
            range: mdRange,
            //
            task: {
                value: removeHashtag(linetext),
                range: unistPosition2mdRange(taskRange),
            },
            description: {
                value: descriptionValue,
                range: unistPosition2mdRange(descriptionRange),
            },
            checked: listitem.checked || false,
        } as T_MdTask
    }
    return null
}

let headings: T_CEventDep[] = []
export const getTasks = (mdText: string, tree): T_MdTask[] => {
    let mdTasks: T_MdTask[] = []
    if (tree.type == "root") {
        headings = []
    }
    if (tree.children) {
        for (let treeChild of tree.children) {
            //headingの場合
            if (treeChild.type == "heading") {
                const headingNode = treeChild
                const range = unistPosition2mdRange(headingNode.position)
                const newHeading = {
                    id: toTaskIdFromMdRange(range),
                    title: getNodeChildrenText(headingNode),
                    range: range,
                    depth: headingNode.depth,
                } as T_CEventDep
                headings = headings.slice(0, newHeading.depth - 1)
                headings.push(newHeading)
                __debugPrint__("newHeadings:", headings)
            }
            //listの場合
            else if (treeChild.type == "list") {
                const listitems: MdastListItem[] = treeChild.children
                for (let listitem of listitems) {
                    //taskの場合
                    if (listitem.checked !== null) {
                        const task = genTask(
                            mdText,
                            nodeWithPosition(listitem),
                            headings
                        )
                        //taskの登録
                        if (task) {
                            mdTasks.push(task)
                        } else {
                            throw Error(
                                `invalid mdAstListItem of task(${listitem})`
                            )
                        }
                    }
                }
            }
            getTasks(mdText, treeChild).forEach((task) => {
                mdTasks.push(task)
            })
        }
    }
    return mdTasks
}
