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
    dateHashtagValue2dateRange,
    MdRange,
    mdRange2cEventid,
    MdTaskType,
} from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"
import {
    CEventDepType,
    CEventPropsType,
    CEventsPropsType,
} from "../store/cEventsStore"

type UnistPositionWithOffset = {
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
const unistPosition2mdRange = (position: UnistPosition): MdRange => {
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
            lineNumber: position.start.line,
            column: position.start.column,
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
const getText = (tree): string => {
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
const getMdtextByPosition = (
    mdtext: string,
    position: UnistPositionWithOffset
) => {
    return mdtext.substring(position.start.offset, position.end.offset)
}

function nodeWithPosition<T extends UnistNode>(node: T): T & MdastMdNode {
    if (
        !node.position ||
        !node.position.start.offset ||
        !node.position.end.offset
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
                line: node.position.start.line,
                column: node.position.start.column,
                offset: node.position.end.offset,
            },
        },
    }
    //@ts-ignore(後で直す)
    return nodewithrange
}

const genTask = (
    mdtext,
    listitem: MdastListItem & MdastMdNode,
    headings: CEventDepType[]
): MdTaskType | null => {
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
    const hashtags = getHashtag(linetext)
    const dateHashtagValue = hashtags
        .filter((h) => h.replace("#", "").startsWith("scheduled"))
        .map((h) => {
            return dateHashtagValue2dateRange(h)
        }) //[NOTE]scheduledタグは１つしか付けられない想定の実装

    //descriptionの抽出
    const descriptionItems = listitem.children
        .slice(1)
        .map((n) => nodeWithPosition(n))
    let description: any = {
        items: listitem.children.slice(1),
        value: "",
    }
    description.value = getText({
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
        ? getMdtextByPosition(mdtext, descriptionRange)
        : ""

    //taskの作成
    if (unistpos) {
        const mdRange = unistPosition2mdRange(unistpos)
        return {
            id: mdRange2cEventid(mdRange),
            title: removeHashtag(linetext),
            range: mdRange,
            taskRange: unistPosition2mdRange(taskRange),
            checked: listitem.checked || false,
            tags: hashtags,
            start:
                dateHashtagValue.length != 0 ? dateHashtagValue[0].start : null,
            end: dateHashtagValue.length != 0 ? dateHashtagValue[0].end : null,
            allDay: !(dateHashtagValue.length != 0
                ? dateHashtagValue[0].end
                : null),
            deps: headings,
            description: descriptionValue, //"dummy text.".repeat(10),
            descriptionRange: unistPosition2mdRange(descriptionRange),
        }
    }
    return null
}

let headings: CEventDepType[] = []
export const getTasks = (mdtext: string, tree): MdTaskType[] => {
    let tasks: MdTaskType[] = []
    if (tree.type == "root") {
        headings = []
    }
    if (tree.children) {
        let listitems: MdastListItem[] = []
        for (let treeChild of tree.children) {
            if (treeChild.type == "heading") {
                const headingNode = treeChild
                const range = unistPosition2mdRange(headingNode.position)
                headings = headings.slice(0, headingNode.deps)
                headings[headingNode.deps] = {
                    id: mdRange2cEventid(range),
                    title: getText(headingNode.children),
                    range: range,
                }
            } else if (treeChild.type == "list") {
                listitems = treeChild.children
                for (let listitem of listitems) {
                    if (listitem.checked !== null) {
                        const task = genTask(
                            mdtext,
                            nodeWithPosition(listitem),
                            headings
                        )
                        //taskの登録
                        if (task) {
                            tasks.push(task)
                        } else {
                            throw Error(`pos is undefined(${listitem})`)
                        }
                    }
                }
            }
            getTasks(mdtext, treeChild).forEach((task) => {
                tasks.push(task)
            })
        }
    }
    return tasks
}
