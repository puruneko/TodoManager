import React, { useState, useRef, useEffect } from "react"

////
//https://github.com/suren-atoyan/monaco-react
import MonacoEditor from "@monaco-editor/react"

//https://microsoft.github.io/monaco-editor/docs.html
import monaco from "monaco-editor"
import type monacoType from "monaco-editor"

////////////////////////////////
import { Processor, unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
//import rehypeStringify from "rehype-stringify"
import production from "react/jsx-runtime"
import rehypeReact from "rehype-react"

//
import { customMdastToHastHandlers } from "./md2hHandlers"
import { useCEvents, useCEventsFunction } from "../store/cEventsStore"
import { MdRange, useMdProps, useMdPropsFunction } from "../store/mdPropsStore"
import { __debugPrint__impl } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import { customComponentsFromHast } from "./h2reactHandler"
import { md2mdParserPlugin_message } from "./md2mdHandler"
import { getTasks } from "./mdtext2taskHandler"
import {
    getMonacoPosition,
    getMonacoScrollTopPxByLineNumber,
    mdRange2monacoRange,
} from "./monacoUtils"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<remarkProcessing>", ...args)
}
//
//

let mdProcessor: any = null

const initializeMdProcessorImpl = () => {
    return (
        unified()
            //
            //parser(text->mdast)
            //
            .use(remarkParse, { fragment: true })
            .use(remarkGfm)
            //@ts-ignore(問題なし)
            .use(md2mdParserPlugin_message)
            //
            //transformer(mdast->hast)
            //
            .use(remarkRehype, { handlers: customMdastToHastHandlers })
            //
            //compiler(hast->react or html)
            //
            //@ts-ignore(OSSの型定義が古い)
            .use(rehypeReact, {
                ...production,
                components: customComponentsFromHast,
            })
        //.use(rehypeStringify)
    )
}
export const initializeMdProcessor = () => {
    mdProcessor = initializeMdProcessorImpl()
    return mdProcessor
}

export const parseMarkdown = (mdtext: string) => {
    if (!mdProcessor) {
        mdProcessor = initializeMdProcessor()
    }
    const mdastTree = mdProcessor.parse(mdtext)
    const hastTree = mdProcessor.runSync(mdastTree)
    //const contents = await mdProcessor.process(mdtext)
    const compiled = mdProcessor.processSync(mdtext)
    const reactComponent = compiled.result
    __debugPrint__("parsed", {
        mdastTree,
        hastTree,
        compiled,
    })
    return { mdastTree, hastTree, compiled, reactComponent }
}

const gent = (mdtext, parsed) => {
    //
    // generate tasks
    //
    const newTasks = getTasks(mdtext, parsed)
    //cEventsFunc.set(newTasks)
    __debugPrint__("getTask", newTasks)
}
