import React, { useEffect, useRef, useState } from "react"

import SimpleMarkdown from "./simple-markdown/simple-markdown"
import type * as SMD from "./simple-markdown/simple-markdown"

type ParserAndOutputRule = SMD.ParserRule &
    SMD.ReactOutputRule &
    SMD.HtmlOutputRule
type ProcessRule = SMD.ParserRules | SMD.HtmlOutputRule | SMD.ReactOutputRule

function App() {
    const [text, setText] = useState("- de*af__u__la*t value +exTag")
    const [Preview, setPreview] = useState(<></>)

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
                content: parse(capture[1], state),
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
                content: parse(capture[2], state),
                pos: capture[0].indexOf(capture[1]),
            }
        },

        // Finally transform this syntax node into a
        // React element
        react: function (node, output) {
            const tagFunc = () => {
                setText("- tag clicked +tagArea")
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
    //
    const rules: any = {
        ...SimpleMarkdown.defaultRules,
        underline: underlineRule,
        tag: tagRule,
    }
    var rawBuiltParser = SimpleMarkdown.parserFor(rules)
    //
    const parseRef = useRef(rawBuiltParser)
    parseRef.current = function (source) {
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
        const syntaxTree = parseRef.current(text)
        const rOutput = outputAsReactRef.current(syntaxTree)
        console.log("--------text changed-------")
        console.log(syntaxTree)
        setPreview(rOutput)
    }, [text])
    //
    return (
        <div>
            <textarea
                value={text}
                aria-multiline={true}
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
