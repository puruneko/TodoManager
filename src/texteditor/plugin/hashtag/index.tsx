//

import { Plugin as UnifiedPlugin } from "unified"
import { Handler as HastHandler } from "mdast-util-to-hast"
//
import {
    ComponentFromHast,
    fromMarkdownExtension,
    HASHTAG_ALIES,
    micromarkExtension,
    toHastFromMdast,
} from "./handler"

//function記述形式でthisをPluginにバインド
export function micromarkPlugin(): UnifiedPlugin {
    return function () {
        // remark プラグイン形式で micromark/mdast 拡張を登録
        const data = this.data()

        function add(field, value) {
            if (!data[field]) data[field] = []
            data[field].push(value)
        }

        add("micromarkExtensions", micromarkExtension())
        add("fromMarkdownExtensions", fromMarkdownExtension())
    }
}

export const toHastFromMdastPlugin: {
    [key: string]: HastHandler
} = {
    [HASHTAG_ALIES]: toHastFromMdast,
}

export const toReactFromHastPlugin = {
    [HASHTAG_ALIES]: ComponentFromHast,
}

export default {
    micromarkPlugin,
    toHastFromMdastPlugin,
    toReactFromHastPlugin,
}
