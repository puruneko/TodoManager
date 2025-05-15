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

import type { CustomHashtag as MdastCustomHashtag } from "mdast"
import type {
    CompileContext,
    Token,
    Extension as FromMarkdownExtension,
} from "mdast-util-from-markdown"
import {
    TokenTypeMap as MicromarkTokenTypeMap,
    State,
    Effects,
} from "micromark-util-types"
import { Plugin } from "unified"
import { codePointAt } from "../utils/string"
import { __debugPrint__ } from "../debugtool/debugtool"

export function micromarkExtensionTag() {
    const TAG_PREFIX = "#"
    const TAG_PREFIX_CODE = codePointAt(TAG_PREFIX)
    //let valueCursor = 0

    return {
        text: {
            [TAG_PREFIX_CODE]: { tokenize: tagTokenizer }, // '#' のコードポイント
        },
    }

    function tagTokenizer(
        //this: TokenizeContext,
        effects: Effects,
        ok: State,
        nok: State
    ): State {
        return start

        function start(code) {
            if (code !== TAG_PREFIX_CODE) return nok(code)
            //
            effects.enter(HASHTAG_ALIES)
            //
            effects.consume(code)
            return insideTag
        }
        function insideTag(code) {
            // 終了条件: null（終わり）、空白、改行、キャリッジリターン
            if (code === null || code === 32 || code === 10 || code === 13) {
                /*
                if (buffer.trim() !== "") {
                    console.log("insideTag: buffer content", buffer)
                    // タグのテキストをノードに追加
                    //
                    //
                    for (let i = 0; i < buffer.length; i++) {
                        effects.consume(buffer.charCodeAt(i)) // テキストを消費
                        console.log(
                            "insideTag: consumed text char",
                            buffer.charCodeAt(i)
                        )
                    }
                    //
                    //
                }
                    */
                //
                effects.exit(HASHTAG_ALIES) // 'tag' ノードの終了
                //
                return ok(code) // 次の処理へ
            }
            //

            // 現在のコードポイントを消費
            effects.consume(code)
            return insideTag
        }
    }
    /*
        function start(code: Code) {
            if (!code || markdownLineEnding(code) || code === codes.eof) {
                return nok(code)
            }

            effects.enter("taggable")
            effects.enter("taggableMarker")
            return consumeMarker(code)
        }

        function consumeMarker(code: Code) {
            if (!code || code !== 35) {
                return nok(code)
            }

            effects.consume(code)

            effects.exit("taggableMarker")
            effects.enter("taggableValue")

            return consumeValue
        }

        function consumeValue(code: Code) {
            if (!code || markdownLineEnding(code) || code === codes.eof) {
                if (valueCursor < 1) {
                    return nok(code)
                } else {
                    effects.exit("taggableValue")
                    effects.exit("taggable")
                    return ok(code)
                }
            }

            valueCursor++
            effects.consume(code)
            return consumeValue
        }
    }*/
}

export function fromMarkdownTag(): FromMarkdownExtension {
    const enter = {
        [HASHTAG_ALIES]: function (this: CompileContext, token: Token) {
            this.enter({ type: HASHTAG_ALIES, value: "", data: {} }, token) // MDAST ノード作成
        },
    }
    const exit = {
        [HASHTAG_ALIES]: function (this: CompileContext, token: Token) {
            const node = this.stack[this.stack.length - 1] as MdastCustomHashtag
            node.value = this.sliceSerialize(token) // ここでタグの文字列が value に入る
            __debugPrint__("tag exit", node, node.value, token)
            this.exit(token)
        },
    }
    return {
        enter,
        exit,
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

        add("micromarkExtensions", micromarkExtensionTag())
        add("fromMarkdownExtensions", fromMarkdownTag())
    }
}
