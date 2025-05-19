import { HASHTAG_ALIES } from "./plugin/mmExtensionTaggable"

const ComponentCustomCheckbox = (props) => {
    return (
        <div style={{ display: "flex", flexDirection: "row" }}>
            <input type="checkbox" />
            <span style={{ color: "red" }}>@@{props.children}</span>
        </div>
    )
}
const ComponentCustomHashtag = (props) => {
    return <span className={HASHTAG_ALIES}>{props.children}</span>
}

/**
 * コンパイラに渡す
 * @example
   import { unified } from "unified"
   import production from "react/jsx-runtime"
   import rehypeReact from "rehype-react"
   unified()
    .use(<<someExtension>>)
    .use(rehypeReact, {
        ...production,
        components: customComponentsFromHast,
    })
 */
export const customComponentsFromHast = {
    //message: component_message,
    customCheckbox: ComponentCustomCheckbox,
    [HASHTAG_ALIES]: ComponentCustomHashtag,
}
