const component_dev = (props) => {
    return (
        <>
            <input type="checkbox" />
            {props.children}
        </>
    )
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
    mycheckbox: component_dev,
}
