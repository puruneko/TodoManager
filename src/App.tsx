import React, { useEffect, useRef, useState } from "react"

import SimpleMarkdown from "./simple-markdown/simple-markdown"
import type * as SMD from "./simple-markdown/simple-markdown"

type ParserAndOutputRule = SMD.ParserRule &
    SMD.ReactOutputRule &
    SMD.HtmlOutputRule
type ProcessRule = SMD.ParserRules | SMD.HtmlOutputRule | SMD.ReactOutputRule
type ParserAndOutputRule2 =
    | SMD.DefaultInOutRule
    | SMD.DefaultInRule
    | SMD.TextInOutRule

function App() {
    ///////////////0         1         2         3
    ///////////////0123456789012345678901234567890
    const text1 = "- de*af__u__la*t value +exTag"
    const text2 = `
# heading1

- aaaa
    - bbbbb31
    - cccccc
    > ddddd
        - eeeeeeee +mytag
    - ffffff
- gggggg
- hhhh
    - pppppp
    qqqqqqqq
    `
    //
    const [text, setText] = useState(text2)
    const [Preview, setPreview] = useState(<></>)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    let underlineRule: ParserAndOutputRule = {
        // Specify the order in which this rule is to be run
        order: SimpleMarkdown.defaultRules.em.order - 0.5,

        // First we check whether a string matches
        match: function (source) {
            return /^__([\s\S]+?)__(?!_)/.exec(source)
        },

        // Then parse this string into a syntax node
        parse: function (capture, parse, state) {
            const param = Object.assign({}, { capture, parse, state })
            console.log("----captured by underline----")
            console.log(param)
            return {
                type: "underline",
                content: parse(capture[1], state, capture),
            }
        },

        // Finally transform this syntax node into a
        // React element
        react: function (node, output) {
            return <u>{output(node.content)}</u>
        },

        // Or an html element:
        // (Note: you may only need to make one of `react:` or
        // `html:`, as long as you never ask for an outputter
        // for the other type.)
        html: function (node, output) {
            return "<u>" + output(node.content) + "</u>"
        },
    }
    //
    let tagRule: ParserAndOutputRule = {
        // Specify the order in which this rule is to be run
        order: SimpleMarkdown.defaultRules.em.order - 0.5,

        // First we check whether a string matches
        match: function (source, state, prevCaptureStr) {
            const param = { source, state, prevCaptureStr }
            return /(!=\s|^)[+]([\S]+?)(!=\s|$)/.exec(source)
        },

        // Then parse this string into a syntax node
        parse: function (capture, parse, state) {
            const param = Object.assign({}, { capture, parse, state })
            console.debug("----captured by tag ----", param)
            return {
                type: "tag",
                content: parse(capture[2], state, capture),
            }
        },

        // Finally transform this syntax node into a
        // React element
        react: function (node, output) {
            const tagFunc = () => {
                //setText("- tag clicked +tagArea")
            }
            return (
                <span style={{ color: "red" }} onClick={tagFunc}>
                    (@{node.pos}){output(node.content)}
                </span>
            )
        },

        // Or an html element:
        // (Note: you may only need to make one of `react:` or
        // `html:`, as long as you never ask for an outputter
        // for the other type.)
        html: function (node, output) {
            return "<u>" + output(node.content) + "</u>"
        },
    }
    let quateRule: ParserAndOutputRule2 = {
        order: SimpleMarkdown.defaultRules.paragraph,
        match: SimpleMarkdown.blockRegex(/^ *([>])([^\n]+?) */),
        parse: function (capture, nestedParse, state) {
            const param = Object.assign({}, { capture, nestedParse, state })
            console.debug("----captured by quate ----", param)
            return {
                content: SimpleMarkdown.parseInline(
                    nestedParse,
                    capture[2].trim(),
                    state,
                    capture
                ),
            }
        },
        react: function (node, output, state) {
            return SimpleMarkdown.reactElement("span" + node.level, state.key, {
                children: output(node.content, state),
                style: { color: "orange" },
            })
        },
        html: function (node, output, state) {
            return SimpleMarkdown.htmlTag(
                "span" + node.level,
                output(node.content, state)
            )
        },
    }
    //
    const rules: any = {
        ...SimpleMarkdown.defaultRules,
        underline: underlineRule,
        tag: tagRule,
    }
    var rawBuiltParser = SimpleMarkdown.parserFor(rules)
    //
    const parseRef = useRef(rawBuiltParser)
    parseRef.current = function (source, state) {
        var blockSource = source + "\n\n"
        return rawBuiltParser(blockSource, { inline: false })
    }
    // You probably only need one of these: choose depending on
    // whether you want react nodes or an html string:
    const outputAsReact = SimpleMarkdown.outputFor<SMD.ReactOutputRule>(
        rules,
        "react"
    )
    const outputAsReactRef = useRef(outputAsReact)
    outputAsReactRef.current = (syntaxTree) => {
        return outputAsReact(syntaxTree)
    }
    //
    useEffect(() => {
        const syntaxTree = parseRef.current(text, { inline: false })
        const rOutput = outputAsReactRef.current(syntaxTree)
        console.log("--------text changed-------")
        console.log(syntaxTree)
        setPreview(rOutput)
    }, [text])
    //
    useEffect(() => {
        const previewTextElements =
            document.getElementsByClassName("previewText")
        Array.from(previewTextElements).forEach((elem: Element) => {
            elem.addEventListener("click", (e: Event) => {
                const _elem = e.target as HTMLElement
                const pos_str = _elem.dataset.pos
                const pos = pos_str ? pos_str.split(",").map(Number) : null
                if (pos && textareaRef.current) {
                    textareaRef.current.setSelectionRange(pos[0], pos[1])
                    textareaRef.current.focus()
                }
                console.log("clicked:", _elem)
            })
        })
    }, [Preview])
    //
    return (
        <div>
            <textarea
                ref={textareaRef}
                value={text}
                aria-multiline={true}
                style={{ width: 300, height: 300 }}
                onChange={(e) => {
                    setText(e.target.value)
                }}
            />
            <hr />
            {Preview}
        </div>
    )
}

export default App
