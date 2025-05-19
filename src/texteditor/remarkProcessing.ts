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
import rehypeStringify from "rehype-stringify"
//

//
import { customMdastToHastHandlers } from "./md2hHandlers"
import { __debugPrint__impl } from "../debugtool/debugtool"
import { customComponentsFromHast } from "./h2reactHandler"
import { md2mdParserPlugin_hashtag } from "./md2mdHandler"
import { getTasks } from "./mdText2taskHandler"
import { customTagMMPlugin } from "./plugin/mmExtensionTaggable"

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
                //remarkParse, {
                fragment: true,
                //extensions: [MMTaggableSyntax()],
                //mdastExtensions: [MMTaggableSyntax()],
            })
            //@ts-ignore(問題なし)
            .use(remarkGfm)
            //@ts-ignore(問題なし)
            .use(md2mdParserPlugin_hashtag)
            .use(customTagMMPlugin())
            //
            //transformer(mdast->hast)
            //
            .use(remarkRehype, {
                allowDangerousHtml: true,
                handlers: customMdastToHastHandlers,
            })
            //
            //compiler(hast->react or html)
            //
            //@ts-ignore(OSSの型定義が古い)
            .use(rehypeReact, {
                ...production,
                Fragment,
                components: customComponentsFromHast,
                createElement,
            })
        //.use(rehypeStringify)
    )
}

/*
const initializeMdProcessorImpl_DevHtml = () => {
    return (
        unified()
            //
            //parser(text->mdast)
            //
            .use(remarkParse, {
                //remarkParse, {
                fragment: true,
                //extensions: [MMTaggableSyntax()],
                //mdastExtensions: [MMTaggableSyntax()],
            })
            //@ts-ignore(問題なし)
            .use(md2mdParserPlugin_hashtag)
            //@ts-ignore(問題なし)
            //.use(rubyAttacher)
            .use(remarkGfm)
            //
            //transformer(mdast->hast)
            //
            .use(remarkRehype, { handlers: customMdastToHastHandlers })
            //
            //compiler(hast->html)
            //
            .use(rehypeStringify)
    )
}
*/
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
    //debug
    //
    /*
    const htmlProcessor = initializeMdProcessorImpl_DevHtml()
    const mdastTree_html = htmlProcessor.parse(mdText)
    const hastTree_html = htmlProcessor.runSync(mdastTree_html)
    const compiled_html = htmlProcessor.processSync(mdText)
    const html = compiled_html.value
    __debugPrint__("parsedHTML", html)
    */
    //
    __debugPrint__("parsed", {
        mdastTree,
        hastTree,
        compiled,
        reactComponent,
    })
    return { mdastTree, hastTree, compiled, reactComponent }
}
