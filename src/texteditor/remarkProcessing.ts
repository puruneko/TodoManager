////////////////////////////////
import { Fragment, createElement } from "react"
import production from "react/jsx-runtime"
//
import { Processor, unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
//import rehypeStringify from "rehype-stringify"
import rehypeReact from "rehype-react"
//

//
import { __debugPrint__impl } from "../debugtool/debugtool"
import hashtagPlugin from "./plugin/hashtag"
import checkboxPlugin from "./plugin/checkbox"

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
            .use(remarkParse, {
                fragment: true,
            })
            .use(remarkGfm)
            //micromark Extension
            .use(hashtagPlugin.micromarkPlugin())
            .use(checkboxPlugin.micromarkPlugin())
            //
            //transformer(mdast->hast)
            //
            .use(remarkRehype, {
                allowDangerousHtml: true,
                handlers: {
                    ...hashtagPlugin.toHastFromMdastPlugin,
                    ...checkboxPlugin.toHastFromMdastPlugin,
                },
            })
            //
            //compiler(hast->react or html)
            //
            //@ts-ignore(OSSの型定義が古い)
            .use(rehypeReact, {
                ...production,
                Fragment,
                components: {
                    ...hashtagPlugin.toReactFromHastPlugin,
                    ...checkboxPlugin.toReactFromHastPlugin,
                },
                createElement,
            })
        //.use(rehypeStringify)
    )
}

export const initializeMdProcessor = () => {
    mdProcessor = initializeMdProcessorImpl()
    return mdProcessor
}

export const parseMarkdown = (mdText: string) => {
    if (!mdProcessor) {
        mdProcessor = initializeMdProcessor()
    }
    const mdastTree = mdProcessor.parse(mdText)
    const hastTree = mdProcessor.runSync(mdastTree)
    //const contents = await mdProcessor.process(mdText)
    const compiled = mdProcessor.processSync(mdText)
    const reactComponent = compiled.result
    //
    __debugPrint__("parsed", {
        mdastTree,
        hastTree,
        compiled,
        reactComponent,
    })
    //
    return { mdastTree, hastTree, compiled, reactComponent }
}
