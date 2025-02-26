import React, { useEffect, useRef, useState } from "react"

import SimpleMarkdown from "./simple-markdown/simple-markdown"
import type * as SimpleMarkdownType from "./simple-markdown/simple-markdown"

//https://github.com/suren-atoyan/monaco-react
import MonacoEditor from "@monaco-editor/react"

//https://microsoft.github.io/monaco-editor/docs.html
import * as monaco from "monaco-editor"

//https://www.measurethat.net/Benchmarks/Show/25816/0/markdown-performance-comparison-2023-06-23-2
import { textBench } from "./_dev/sampleText"
import { textTask } from "./_dev/sampleText2"

import { getHier, Hier } from "./hier"

//
type ParserAndOutputRule = SimpleMarkdownType.ParserRule &
    SimpleMarkdownType.ReactOutputRule &
    SimpleMarkdownType.HtmlOutputRule
type ProcessRule =
    | SimpleMarkdownType.ParserRules
    | SimpleMarkdownType.HtmlOutputRule
    | SimpleMarkdownType.ReactOutputRule
type ParserAndOutputRule2 =
    | SimpleMarkdownType.DefaultInOutRule
    | SimpleMarkdownType.DefaultInRule
    | SimpleMarkdownType.TextInOutRule

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
    const defaultValue = textTask
    const [text, setText] = useState(defaultValue)
    const [Preview, setPreview] = useState(<></>)
    const [hier, setHier] = useState<Hier[]>([])
    const textareaRef = useRef<any>()
    const previewWrapperRef = useRef<any>()

    let underlineRule: SimpleMarkdownType.DefaultRules["em"] = {
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
            return SimpleMarkdown.genParseRuleResult({
                type: "underline",
                children: parse(capture[1], state, capture),
            })
        },

        // Finally transform this syntax node into a
        // React element
        react: function (node, output) {
            return <u>{output(node.children)}</u>
        },

        // Or an html element:
        // (Note: you may only need to make one of `react:` or
        // `html:`, as long as you never ask for an outputter
        // for the other type.)
        html: function (node, output) {
            return "<u>" + output(node.children) + "</u>"
        },
    }
    //
    let tagRule: SimpleMarkdownType.DefaultRules["em"] = {
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
            return SimpleMarkdown.genParseRuleResult({
                type: "tag",
                children: parse(capture[2], state, capture),
            })
        },

        // Finally transform this syntax node into a
        // React element
        react: function (node, output) {
            const tagFunc = () => {
                //setText("- tag clicked +tagArea")
            }
            return (
                <span style={{ color: "red" }} onClick={tagFunc}>
                    (@{node.pos}){output(node.children)}
                </span>
            )
        },

        // Or an html element:
        // (Note: you may only need to make one of `react:` or
        // `html:`, as long as you never ask for an outputter
        // for the other type.)
        html: function (node, output) {
            return "<u>" + output(node.children) + "</u>"
        },
    }
    let lineQuoteRule: SimpleMarkdownType.DefaultRules["em"] = {
        order: SimpleMarkdown.defaultRules.paragraph.order,
        match: function (source, state, prevCaptureStr) {
            const res = /^aaa( *?)[>] *?([^\n]+) */.exec(source)
            return res
        },
        parse: function (capture, nestedParse, state) {
            const param = Object.assign({}, { capture, nestedParse, state })
            console.debug("----captured by quate ----", param)
            return SimpleMarkdown.genParseRuleResult({
                type: "quote",
                children: nestedParse(
                    `${capture[1]}${capture[2].trim()}`,
                    state,
                    capture
                ),
            })
        },
        react: function (node, output, state) {
            return SimpleMarkdown.reactElement("span", "", {
                children: output(node.children, state),
                style: { color: "orange" },
            })
        },
        html: function (node, output, state) {
            return SimpleMarkdown.htmlTag("span", output(node.children, state))
        },
    }
    //
    const rules: any = {
        ...SimpleMarkdown.defaultRules,
        underline: underlineRule,
        tag: tagRule,
        lineQuote: lineQuoteRule,
    }
    var rawBuiltParser = (source: string, state: any) => {
        return SimpleMarkdown.parserFor(rules)(source, state, null)
        //return SimpleMarkdown.defaultBlockParse(source, state)
    }
    //
    const parseRef = useRef(rawBuiltParser)
    parseRef.current = function (source, state) {
        var blockSource = source + "\n\n"
        return rawBuiltParser(blockSource, { inline: false })
    }
    // You probably only need one of these: choose depending on
    // whether you want react nodes or an html string:
    const outputAsReact =
        SimpleMarkdown.outputFor<SimpleMarkdownType.ReactOutputRule>(
            rules,
            "react"
        )
    const outputAsReactRef = useRef(outputAsReact)
    outputAsReactRef.current = (syntaxTree) => {
        return outputAsReact(syntaxTree)
    }
    //
    //
    useEffect(
        function textChangedEffect() {
            console.log("--------text changed-------")
            console.log("  >>>parsing...")
            const syntaxTree = parseRef.current(text, { inline: false })
            //
            const _hier = getHier(
                syntaxTree,
                [{ type: "li", liBullet: "-" }],
                [
                    {
                        type: "heading",
                    },
                ]
            )
            setHier(_hier)
            console.log(_hier)
            console.log("  <<<parsing END")
            console.log("  >>>outputting...")
            const rOutput = outputAsReactRef.current(syntaxTree)
            console.log("  <<<outputting END")
            console.log("--------text changed result:-------")
            //console.log(text)
            console.log(syntaxTree)
            //console.log(rOutput)
            setPreview(rOutput)
            console.log("--------text changed END-------")
        },
        [text]
    )
    //
    const handlePreviewDidScrollChange = (e: any) => {
        const _elem = e.target as HTMLElement
        console.debug(
            "handlePreviewDidScrollChange",
            _elem.scrollTop,
            _elem.offsetTop,
            _elem.clientTop
        )
    }
    //
    const handleMonacoDidScrollChange = (e: monaco.IScrollEvent) => {
        console.log("handleMonacaDidScrollChange:", e)
    }
    const handleMonacoDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor,
        monaco: any
    ) => {
        textareaRef.current = editor
        textareaRef.current.onDidScrollChange(handleMonacoDidScrollChange)
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
            if (previewWrapperRef.current) {
                console.debug(
                    "clicked element:",
                    _elem,
                    "\nscroll elem:soc",
                    _elem.scrollTop,
                    _elem.offsetTop, //_elemの絶対Y座標
                    _elem.clientTop,
                    "\nscroll_div:soc\n",
                    previewWrapperRef.current.scrollTop, //スクロール量
                    previewWrapperRef.current.offsetTop, //previewWrapperの絶対Y座標
                    previewWrapperRef.current.clientTop,
                    "\nelem rel offsetTop:",
                    _elem.offsetTop - previewWrapperRef.current.offsetTop
                )
            }
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
            let newValue = textareaRef.current.getValue()
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
            textareaRef.current.setValue(newValue)
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
    useEffect(
        function previewChangedEffect() {
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
            // preview-list-taskにチェックのオンオフ機能を外付けする
            //
            Array.from(
                document.getElementsByClassName(
                    `${SimpleMarkdown.LIST_CLASSNAME_PREFIX}-task`
                )
            ).forEach((elem: Element) => {
                elem.addEventListener("click", (e: Event) => {
                    e.preventDefault()
                    toggleTaskItemState(e)
                    console.log("clicked:", e)
                    e.stopPropagation()
                })
            })
            console.log("--------preview changed END-------")
        },
        [Preview]
    )
    //
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
                        width={"100%"}
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
                    ref={previewWrapperRef}
                    style={{
                        flexBasis: "50%",
                        flexGrow: 1,
                        fontFamily: "inherit",
                        fontSize: "1rem",
                        overflowY: "scroll",
                    }}
                    onScroll={handlePreviewDidScrollChange}
                >
                    {Preview}
                </div>
            </div>
            <DebugElem hier={hier} />
        </div>
    )
}

const DebugElem = ({ hier }: { hier: Hier[] }) => {
    const showHier = (hier: Hier[]) => {
        if (hier.length == 0) {
            return <></>
        }
        return (
            <ul>
                {hier.map((h: Hier) => {
                    return (
                        <li>
                            <span>{h.text}</span>
                            {showHier(h.children)}
                        </li>
                    )
                })}
            </ul>
        )
    }
    return (
        <div>
            <h3>階層構造のパース</h3>
            {showHier(hier)}
        </div>
    )
}

export default App
