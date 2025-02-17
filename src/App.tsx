import React, { useEffect, useRef, useState } from "react"

import SimpleMarkdown from "./simple-markdown/simple-markdown"
import type * as SMD from "./simple-markdown/simple-markdown"

//https://github.com/suren-atoyan/monaco-react
import MonacoEditor from "@monaco-editor/react"

//https://microsoft.github.io/monaco-editor/docs.html
import * as monaco from "monaco-editor"

//https://www.measurethat.net/Benchmarks/Show/25816/0/markdown-performance-comparison-2023-06-23-2
import { textBench } from "./sampleText"

//
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
    1. 123456789
    - ffffff
        - FFFFFFFF
            - f111FfFfFfF
            - f222FfFfFfF
        - GGGGG
    1. 987654321
        1. uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu
        1. vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        1. wwwwwww*WW*wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
    1. asdfghjk
- [ ] gggggg
- [x] g2ggggg
- hhhh
    - pppppp
    qqqqqqqq
    `
    //
    const defaultValue = textBench
    const [text, setText] = useState(defaultValue)
    const [Preview, setPreview] = useState(<></>)
    const textareaRef = useRef<monaco.editor.IStandaloneCodeEditor>(null)

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
            console.debug("----captured by underline----")
            console.debug(param)
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
    let quateRule: ParserAndOutputRule = {
        order: SimpleMarkdown.defaultRules.paragraph.order,
        match: function (source, state, prevCaptureStr) {
            const res = /^ *([>]) *([^\n]+) */.exec(source)
            console.debug("quateRule.match:", res)
            return res
        },
        parse: function (capture, nestedParse, state) {
            const param = Object.assign({}, { capture, nestedParse, state })
            console.debug("----captured by quate ----", param)
            return {
                content: SimpleMarkdown.parseBlock(
                    nestedParse,
                    capture[2].trim(),
                    state,
                    capture
                ),
            }
        },
        react: function (node, output, state) {
            return SimpleMarkdown.reactElement("span", state.key, {
                children: output(node.content, state),
                style: { color: "orange" },
            })
        },
        html: function (node, output, state) {
            return SimpleMarkdown.htmlTag("span", output(node.content, state))
        },
    }
    //
    const rules: any = {
        ...SimpleMarkdown.defaultRules,
        underline: underlineRule,
        tag: tagRule,
        quate: quateRule,
    }
    var rawBuiltParser = SimpleMarkdown.defaultBlockParse //SimpleMarkdown.parserFor(rules)
    //
    const parseRef = useRef(rawBuiltParser)
    parseRef.current = function (source, state) {
        var blockSource = source + "\n\n"
        return rawBuiltParser(blockSource, { inline: false }, null)
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
        console.log("--------text changed-------")
        console.log("  >>>parsing...")
        const syntaxTree = parseRef.current(text, { inline: false }, null)
        console.log("  <<<parsing END")
        console.log("  >>>outputting...")
        const rOutput = outputAsReactRef.current(syntaxTree)
        console.log("  <<<outputting END")
        console.log("--------text changed result:-------")
        console.log(text)
        console.log(syntaxTree)
        console.log(rOutput)
        setPreview(rOutput)
        console.log("--------text changed END-------")
    }, [text])
    //
    const handleMonacoDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor,
        monaco: any
    ) => {
        textareaRef.current = editor
    }
    //
    const focusSelectedMDText = (e: Event) => {
        const _elem = e.target as HTMLElement
        const pos_str = _elem.dataset.pos
        const pos = pos_str ? pos_str.split(",").map(Number) : null
        if (pos && textareaRef.current) {
            /*
            //以下４行はカーソル行にスクロール移動するための儀式
            textareaRef.current.selectionStart = pos[0]
            textareaRef.current.selectionEnd = pos[0]
            textareaRef.current.blur()
            textareaRef.current.focus()
            //
            textareaRef.current.setSelectionRange(pos[0], pos[1])
            */
            const stringPositionToMonacoPosition = (posPoint: number) => {
                let res = null
                if (textareaRef.current) {
                    res = textareaRef.current
                        .getModel()
                        ?.getPositionAt(posPoint)
                }
                return res
            }
            const monacoPosition = stringPositionToMonacoPosition(pos[0])
            if (monacoPosition) {
                textareaRef.current.setPosition(monacoPosition)
                textareaRef.current.setScrollTop(
                    textareaRef.current.getTopForPosition(
                        monacoPosition.lineNumber - 3,
                        monacoPosition.column
                    )
                )
                textareaRef.current.focus()
            }
            console.log("position", monacoPosition)
        }
    }
    const toggleTaskItemState = (e: Event) => {
        const _elem = e.target as HTMLElement
        const pos_str = _elem.dataset.pos
        const pos = pos_str ? pos_str.split(",").map(Number) : null
        if (pos && textareaRef.current) {
            //不要//_elem.classList.toggle("checked")
            let newValue = textareaRef.current.value
            let newSentence = newValue.substring(pos[0], pos[1])
            if (_elem.classList.contains("checked")) {
                newSentence = newSentence.replace("[x]", "[ ]")
            } else {
                newSentence = newSentence.replace("[ ]", "[x]")
            }
            newValue =
                newValue.substring(0, pos[0]) +
                newSentence +
                newValue.substring(pos[1])
            console.log(
                "task clicked",
                _elem.dataset,
                "==========\n",
                textareaRef.current.value,
                "==========\n",
                newValue,
                "==========\n",
                newSentence
            )
            setText(newValue)
        }
    }
    useEffect(() => {
        console.log("--------preview changed-------")
        //DEV//
        Array.from(document.getElementsByClassName("previewText")).forEach(
            (elem: Element) => {
                elem.addEventListener("click", (e: Event) => {
                    e.preventDefault()
                    focusSelectedMDText(e)
                    console.log("clicked:", e)
                    e.stopPropagation()
                })
            }
        )

        //
        // task-list-item-checkboxにチェックのオンオフ機能を外付けする
        //
        Array.from(
            document.getElementsByClassName("task-list-item-checkbox")
        ).forEach((elem: Element) => {
            elem.addEventListener("click", (e: Event) => {
                e.preventDefault()
                toggleTaskItemState(e)
                console.log("clicked:", e)
                e.stopPropagation()
            })
        })
        console.log("--------preview changed END-------")
    }, [Preview])
    //
    return (
        <div style={{ maxWidth: "100vw", maxHeight: "50vh" }}>
            <div style={{ display: "flex", width: "100vw", height: "50vh" }}>
                <div
                    style={{
                        flexBasis: "50%",
                        flexGrow: 1,
                        fontFamily: "inherit",
                        fontSize: "1rem",
                    }}
                >
                    <MonacoEditor
                        defaultValue={defaultValue}
                        defaultLanguage="markdown"
                        onMount={handleMonacoDidMount}
                        onChange={(value) => {
                            if (value) {
                                setText(value)
                            }
                        }}
                    />
                    {/*
                    <textarea
                        ref={textareaRef}
                        value={text}
                        style={{
                            fontFamily: "inherit",
                            fontSize: "1rem",
                            overflow: "scroll",
                            resize: "none",
                            border: "none",
                            outline: "none",
                        }}
                        onChange={(e) => {
                            setText(e.target.value)
                        }}
                    />
                    */}
                </div>
                <div
                    style={{
                        flexBasis: "50%",
                        flexGrow: 1,
                        fontFamily: "inherit",
                        fontSize: "1rem",
                        overflowY: "scroll",
                    }}
                >
                    {Preview}
                </div>
            </div>
        </div>
    )
}

export default App
