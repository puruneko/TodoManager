import {
    Node as MdastNode,
    Nodes as MdastNodes,
    Parents as MdastParents,
    ListItem as MdastListItem,
    Paragraph as MdastParagraph,
    Text as MdastText,
} from "mdast"

import {
    dateHashtagValue2dateRange,
    mdpos2cEventid,
    MdPosition,
    useMdProps,
    useMdPropsFunction,
} from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"

//
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
const getMdtextByPosition = (mdtext: string, position: MdPosition) => {
    return mdtext.substring(position.start.offset, position.end.offset)
}

const genTask = (mdtext, listitem) => {
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
                  start: description.items[0].position?.start,
                  end: description.items[description.items.length - 1].position
                      ?.end,
              }
            : undefined
    //task本文の処理
    const paragraphItem = listitem.children[0] as MdastParagraph
    const textItem = paragraphItem.children[0] as MdastText
    const linetext = textItem.value
    const pos = listitem.position
    const taskPos = {
        start: pos?.start,
        end: paragraphItem.position?.end,
    }
    const hashtags = getHashtag(linetext)
    const dateHashtagValue = hashtags
        .filter((h) => h.replace("#", "").startsWith("scheduled"))
        .map((h) => {
            return dateHashtagValue2dateRange(h)
        }) //[NOTE]scheduledタグは１つしか付けられない想定の実装
    __debugPrint__(textItem)
    //taskの作成
    if (pos) {
        return {
            id: mdpos2cEventid(pos),
            title: removeHashtag(linetext),
            position: pos,
            taskPosition: taskPos,
            checked: listitem.checked,
            tags: hashtags,
            start:
                dateHashtagValue.length != 0 ? dateHashtagValue[0].start : null,
            end: dateHashtagValue.length != 0 ? dateHashtagValue[0].end : null,
            allDay: !(dateHashtagValue.length != 0
                ? dateHashtagValue[0].end
                : null),
            description: description.value, //"dummy text.".repeat(10),
            descriptionPosition: description.pos,
        }
    }
    return null
}

export const getTasks = (mdtext: string, tree) => {
    let tasks: any[] = []
    if (tree.children) {
        let listitems: MdastListItem[] = []
        for (let treeChild of tree.children) {
            if (treeChild.type == "list") {
                listitems = treeChild.children
                for (let listitem of listitems) {
                    if (listitem.checked !== null) {
                        const task = genTask(mdtext, listitem)
                        //taskの登録
                        if (task) {
                            tasks.push(task)
                        } else {
                            throw Error(`pos is undefined(${listitem})`)
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
            getTasks(mdtext, treeChild).forEach((task) => {
                tasks.push(task)
            })
        }
    }
    return tasks
}
