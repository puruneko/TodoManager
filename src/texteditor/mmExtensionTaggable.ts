/*
import { codes } from "micromark-util-symbol"
import { markdownLineEnding } from "micromark-util-character"
import {
    TokenizeContext,
    Effects,
    State,
    Code,
    Extension,
    Construct,
} from "micromark-util-types"

import { Literal } from "unist"
import * as unist from "unist"
import { Data } from "mdast"

//////////
//////////
//////////
//////////

const defaultOptions: Options = {
    classes: ["micromark-taggable"],
    rules: [
        {
            marker: "#",
            type: "tag",
            toUrl: (val) => `/tags/${val}`,
            classes: ["tag"],
        },
        {
            marker: "@",
            type: "mention",
            toUrl: (val) => `/users/${val}`,
            classes: ["mention"],
        },
    ],
    allowEmail: false,
}

export interface Rules {
    marker: string
    type: string
    toUrl: (arg: string) => string
    classes?: Array<string>
}
export interface Taggable extends Literal {
    type: "taggable"
    ctx: string
    marker: string
    value: string
    url: string | undefined
}

export interface Options {
    classes: Array<string>
    rules: Array<Rules>
    allowEmail?: boolean
}

export interface InlineTaggableData {
    marker: string
    type: string
    url: string
}

export interface InlineTaggableNode extends unist.Literal {
    type: "taggable"
    value: string
    data: Data & InlineTaggableData
}

declare module "mdast" {
    interface PhrasingContentMap {
        inlineTaggableNode: InlineTaggableNode
    }

    interface RootContentMap {
        inlineTaggableNode: InlineTaggableNode
    }
}

//////////
//////////
//////////
//////////
//////////
//////////

declare module "micromark-util-types" {
    interface TokenTypeMap {
        taggable: "taggable"
        taggableMarker: "taggableMarker"
        taggableValue: "taggableValue"
    }
}

export function syntax(opts: Options = defaultOptions): Extension {
    if (opts.allowEmail == undefined) opts.allowEmail = false
    const rules = opts.rules
    let valueCursor = 0
    const markers = []
    const typeMap = new Map()
    const allowEmail = opts.allowEmail

    for (const i of rules) {
        //@ts-ignore
        markers.push(i.marker)
        typeMap.set(i.marker, i.type)
    }

    function tokenize(
        this: TokenizeContext,
        effects: Effects,
        ok: State,
        nok: State
    ): State {
        return start

        function start(code: Code) {
            if (!code || markdownLineEnding(code) || code === codes.eof) {
                return nok(code)
            }

            effects.enter("taggable")
            effects.enter("taggableMarker")
            return consumeMarker(code)
        }

        function consumeMarker(code: Code) {
            if (!code || !typeMap.has(String.fromCodePoint(code))) {
                return nok(code)
            }

            effects.consume(code)

            effects.exit("taggableMarker")
            effects.enter("taggableValue")

            return consumeValue
        }

        function consumeValue(code: Code) {
            if (
                !code ||
                markdownLineEnding(code) ||
                code === codes.eof ||
                !(allowEmail
                    ? /[\p{L}\p{M}@.]/u.test(String.fromCodePoint(code))
                    : /[\p{L}\p{M}]/u.test(String.fromCodePoint(code)))
            ) {
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
    }

    // Marker-hooks
    const text: { [c: number]: Construct } = {}

    for (const i of markers) {
        //@ts-ignore
        text[i.codePointAt(0)!] = { name: `tag_${i}`, tokenize: tokenize }
    }

    return { text }
}
*/
