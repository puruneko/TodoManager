//@tds-nocheck

export const HASHTAG_ALIES = "customHashtag"

declare module "mdast" {
    /**
     * Markdown emphasis.
     */
    export interface CustomHashtag extends Node {
        /**
         * Node type of mdast emphasis.
         */
        type: "customHashtag"
        value: string
        /**
         * Children of emphasis.
         */
        children?: PhrasingContent[]
        /**
         * Data associated with the mdast emphasis.
         */
        data?: EmphasisData | undefined
    }
    export interface RootContentMap {
        customHashtag: CustomHashtag
    }
}

declare module "micromark-util-types" {
    export interface TokenTypeMap {
        customHashtag: "customHashtag"
    }
}

////////////////
////////////////
////////////////

import type { CustomHashtag as MdastCustomHashtag } from "mdast"
import type {
    CompileContext,
    Token,
    Extension as FromMarkdownExtension,
} from "mdast-util-from-markdown"
import { markdownLineEnding } from "micromark-util-character"
import {
    TokenTypeMap as MMTokenTypeMap,
    Extension as MMExtension,
    ConstructRecord as MMConstructRecord,
    Construct as MMConstruct,
    Tokenizer as MMTokenizer,
    TokenizeContext as MMTokenizeContext,
    Resolver as MMResolver,
    Event as MMEvent,
    State,
    Effects,
} from "micromark-util-types"
import {
    codes as mmCodes,
    constants,
    types as mmTypes,
} from "micromark-util-symbol"
import { Plugin } from "unified"
import { codePointAt } from "../../utils/string"
import { __debugPrint__ } from "../../debugtool/debugtool"
import { startOfDay } from "date-fns"

////////////////
////////////////
////////////////

type T_HashtagSetting = {
    name: string
    prefix: string
    nodeName: string
}
const HASHTAG_SETTINGS: T_HashtagSetting[] = [
    {
        name: "hashtag_sharp",
        prefix: "#",
        nodeName: HASHTAG_ALIES,
    },
    {
        name: "hashtag_slash",
        prefix: "//",
        nodeName: HASHTAG_ALIES,
    },
    {
        name: "hashtag_plus",
        prefix: "+",
        nodeName: HASHTAG_ALIES,
    },
]

////////
////////
////////
function micromarkExtensionHashtag() {
    //TODO(TO FIX): prefixの１文字目が被ると後勝ちで上書きされる
    return {
        text: {
            // 独自の tokenizer を追加
            // `name` は任意の識別子
            // `tokenize` で検出ロジックを書く
            ...HASHTAG_SETTINGS.reduce((dict, setting) => {
                dict[codePointAt(setting.prefix[0])] = {
                    name: setting.name,
                    tokenize: tokenizeHashtagFactory(setting),
                    //resolveTo: "text",
                    //resolveAll: false,
                }
                return dict
            }, {}),
        },
    }
    function tokenizeHashtagFactory(setting: T_HashtagSetting) {
        return function tokenizeHashtag(effects, ok, nok) {
            const hashtagPrefix = setting.prefix
            let hashtagPrefixIndex = 0
            return startStateFunc

            /**
             * ステートマシン関数。関数内で必ず1回はconsumeする必要がある
             * @param code
             * @returns
             */
            function startStateFunc(code) {
                if (code === codePointAt(hashtagPrefix[0])) {
                    effects.enter(setting.name)
                    effects.consume(code)
                    if (hashtagPrefix.length > 1) {
                        hashtagPrefixIndex += 1
                        return checkHashtagPrefixStateFunc
                    } else {
                        return insideStateFunc
                    }
                }

                return nok(code)
            }

            function checkHashtagPrefixStateFunc(code) {
                if (code === codePointAt(hashtagPrefix[hashtagPrefixIndex])) {
                    effects.consume(code)
                    hashtagPrefixIndex += 1
                    if (hashtagPrefixIndex === hashtagPrefix.length) {
                        return insideStateFunc
                    }
                    return checkHashtagPrefixStateFunc
                }

                return nok(code)
            }

            function insideStateFunc(code) {
                // スペースまたは終了文字でトークン終わり
                if (
                    code === null ||
                    code === 32 ||
                    code === 10 ||
                    markdownLineEnding(code)
                ) {
                    effects.exit(setting.name)
                    return ok(code)
                }

                effects.consume(code)
                return insideStateFunc
            }
        }
    }
}
////////
////////
////////

/**
 * to mdast from MMToken
 * Change how markdown tokens from micromark are turned into mdast.
 * effects.enter/exitの時に呼ばれる
 * @returns
 */
export function fromMarkdownExtensionHashtag(): FromMarkdownExtension {
    //
    const implStandard = (setting: T_HashtagSetting) => {
        const res: { enter: any; exit: any } = {
            enter: function (this: CompileContext, token: Token) {
                const node = {
                    type: setting.nodeName,
                    value: "",
                    data: {},
                } as MdastCustomHashtag
                this.enter(node, token) // MDAST ノード作成
            },
            exit: function (this: CompileContext, token: Token, debug: any) {
                //stackで最後にenterしたnodeを取得
                const node = this.stack[
                    this.stack.length - 1
                ] as MdastCustomHashtag
                // exitが呼ばれたタイミングでconsumeしてきたすべての文字列を連結して取得
                node.value = this.sliceSerialize(token)
                // 付属情報をdataに格納
                if (node.data?.hProperties) {
                    node.data.hProperties = { className: setting.name }
                }
                //
                __debugPrint__("tag exit", node, node.value, token)
                //儀式
                this.exit(token)
            },
        }
        return res
    }
    //
    const impl: { [tagAlies: string]: { enter: any; exit: any } } = {
        ...HASHTAG_SETTINGS.reduce((dict, setting) => {
            dict[setting.name] = implStandard(setting)
            return dict
        }, {}),
    }
    //
    return {
        enter: Object.keys(impl).reduce((dict, key) => {
            dict[key] = impl[key].enter
            return dict
        }, {}),
        exit: Object.keys(impl).reduce((dict, key) => {
            dict[key] = impl[key].exit
            return dict
        }, {}),
    }
}

//function記述形式でthisをPluginにバインド
export function customTagMMPlugin(): Plugin {
    return function () {
        // remark プラグイン形式で micromark/mdast 拡張を登録
        const data = this.data()

        function add(field, value) {
            if (!data[field]) data[field] = []
            data[field].push(value)
        }

        add("micromarkExtensions", micromarkExtensionHashtag())
        add("fromMarkdownExtensions", fromMarkdownExtensionHashtag())
    }
}
