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
    CEventDepType,
    dateHashtagValue2dateRange,
    MdRange,
    mdRange2cEventid,
    MdTaskType,
} from "../store/mdPropsStore"
import { __debugPrint__impl } from "../debugtool/debugtool"
import {
    filterDateHashtag,
    getCEventTypeByDateHashtagName,
    splitHashtag,
} from "./hashtag"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<mdtextstore>", ...args)
}
//
//

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
const getText = (tree): string => {
    let text = ""
    const _tree = "type" in tree ? tree : { type: "", children: tree }
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
                line: node.position.end.line,
                column: node.position.end.column,
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
): MdTaskType[] => {
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

        const hashtags = splitHashtag(linetext)
        let dateHashtags = filterDateHashtag(hashtags)
        /*
            .filter((h) => h.replace("#", "").startsWith("scheduled"))
            .map((h) => {
                return dateHashtagValue2dateRange(h)
            }) //[NOTE]scheduledタグは１つしか付けられない想定の実装
        */
        if (dateHashtags.length == 0) {
            //@ts-ignore(後で型の整合性をとる)
            dateHashtags = [{ name: "", value: { start: null, end: null } }]
        }
        return dateHashtags.map((dateHashtag) => {
            return {
                id: mdRange2cEventid(mdRange),
                title: removeHashtag(linetext),
                range: mdRange,
                taskRange: unistPosition2mdRange(taskRange),
                checked: listitem.checked || false,
                tags: hashtags,
                start: dateHashtag.value.start,
                end: dateHashtag.value.end,
                allDay: !dateHashtag.value.end,
                deps: headings,
                description: descriptionValue,
                descriptionRange: unistPosition2mdRange(descriptionRange),
            }
        })
    }
    return []
}

let headings: CEventDepType[] = []
export const getTasks = (mdtext: string, tree): MdTaskType[] => {
    let tasks: MdTaskType[] = []
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
                    id: mdRange2cEventid(range),
                    title: getText(headingNode),
                    range: range,
                    depth: headingNode.depth,
                }
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
                        const taskList = genTask(
                            mdtext,
                            nodeWithPosition(listitem),
                            headings
                        )
                        //taskの登録
                        if (taskList.length > 0) {
                            taskList.forEach((task) => {
                                tasks.push(task)
                            })
                        } else {
                            throw Error(
                                `invalid mdAstListItem of task(${listitem})`
                            )
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
