export const PLUGIN_ALIES_CHECKBOX = "customCheckbox"

/////////////////
//////////////////

export const toHastFromMdast = customListItemHandler

/**
 * Turn an mdast `listItem` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {ListItem} node
 *   mdast node.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {Element}
 *   hast node.
 */
function customListItemHandler(state, node, parent) {
    const results = state.all(node)
    const loose = parent ? listLoose(parent) : listItemLoose(node)
    /** @type {Properties} */
    const properties: { [key: string]: any } = {}
    /** @type {Array<ElementContent>} */
    const children: any[] = []

    if (typeof node.checked === "boolean") {
        const head = results[0]
        /** @type {Element} */
        let paragraph

        if (head && head.type === "element" && head.tagName === "p") {
            paragraph = head
        } else {
            paragraph = {
                type: "element",
                tagName: "p",
                properties: {},
                children: [],
            }
            results.unshift(paragraph)
        }

        if (paragraph.children.length > 0) {
            paragraph.children.unshift({ type: "text", value: " " })
        }
        /*
        paragraph.children.unshift({
            type: 'element',
            tagName: 'input',
            properties: {type: 'checkbox', checked: node.checked, disabled: true},
            children: []
          })
        */
        paragraph.children.unshift({
            type: "element",
            tagName: PLUGIN_ALIES_CHECKBOX, //"input", //
            properties: {
                type: "checkbox",
                checked: node.checked,
                "data-pos": node.position,
            },
            children: [],
        })

        // According to github-markdown-css, this class hides bullet.
        // See: <https://github.com/sindresorhus/github-markdown-css>.
        properties.className = ["task-list-item"]
    }

    let index = -1

    while (++index < results.length) {
        const child = results[index]

        // Add eols before nodes, except if this is a loose, first paragraph.
        if (
            loose ||
            index !== 0 ||
            child.type !== "element" ||
            child.tagName !== "p"
        ) {
            children.push({ type: "text", value: "\n" })
        }

        if (child.type === "element" && child.tagName === "p" && !loose) {
            children.push(...child.children)
        } else {
            children.push(child)
        }
    }

    const tail = results[results.length - 1]

    // Add a final eol.
    if (tail && (loose || tail.type !== "element" || tail.tagName !== "p")) {
        children.push({ type: "text", value: "\n" })
    }

    /** @type {Element} */
    const result = { type: "element", tagName: "li", properties, children }
    state.patch(node, result)
    return state.applyData(node, result)
}

/**
 * @param {Parents} node
 * @return {Boolean}
 */
function listLoose(node) {
    let loose = false
    if (node.type === "list") {
        loose = node.spread || false
        const children = node.children
        let index = -1

        while (!loose && ++index < children.length) {
            loose = listItemLoose(children[index])
        }
    }

    return loose
}

/**
 * @param {ListItem} node
 * @return {Boolean}
 */
function listItemLoose(node) {
    const spread = node.spread

    return spread === null || spread === undefined
        ? node.children.length > 1
        : spread
}

//////////////////
//////////////////
export const ComponentFromHast = (props) => {
    const onClick_dev = () => {
        console.log("onClick_dev!!!!!!")
    }
    return (
        <div
            style={{ display: "flex", flexDirection: "row" }}
            onClick={onClick_dev}
        >
            <input type="checkbox" />
            <span style={{ color: "red" }}>@@{props.children}</span>
        </div>
    )
}
