//

import { Plugin as UnifiedPlugin } from "unified"
import { Handler as HastHandler } from "mdast-util-to-hast"
//
//
import {
    ComponentFromHast,
    PLUGIN_ALIES_CHECKBOX,
    toHastFromMdast,
} from "./handler"
//
//
//

//function記述形式でthisをPluginにバインド
export function micromarkPlugin(): UnifiedPlugin {
    return function () {}
}

export const toHastFromMdastPlugin: {
    [key: string]: HastHandler
} = {
    listItem: toHastFromMdast,
}

export const toReactFromHastPlugin = {
    [PLUGIN_ALIES_CHECKBOX]: ComponentFromHast,
}

export default {
    micromarkPlugin,
    toHastFromMdastPlugin,
    toReactFromHastPlugin,
}
