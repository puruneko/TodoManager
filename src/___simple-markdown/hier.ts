import SimpleMarkdown from "./simple-markdown/simple-markdown"
import type * as SimpleMarkdownType from "./simple-markdown/simple-markdown"

export type TargetASTNode = Partial<SimpleMarkdownType.ASTNode>

export type Hier = {
    type: string
    text: string
    children: Hier[]
}

const targetAST = [
    {
        type: "heading",
    },
    {
        type: "li",
        liBullet: "-",
    },
]

const _getHier = (
    syntaxTree: SimpleMarkdownType.ASTNodeArray,
    targetAST: TargetASTNode[],
    targetAST_nest: TargetASTNode[] = [{ type: "heading" }],
    level: number = 0
): Hier[] => {
    let upperChildren: Hier[] = []
    let i = 0
    for (; i < syntaxTree.length; i++) {
        const node = syntaxTree[i]
        const nodeKeys = new Set(Object.keys(node))
        const keysArrayNest = targetAST_nest.map((t) => {
            return [...nodeKeys].filter((x) => new Set(Object.keys(t)).has(x))
        })
        const checkNest = keysArrayNest.some((keys, j) => {
            return keys.length > 0
                ? keys.every((key) => {
                      return node[key] == targetAST_nest[j][key]
                  })
                : false
        })
        if (checkNest) {
            let children: Hier[] = []
            //nestが同じ、または深くなる場合、子要素をパース
            if (level < node.level) {
                children = _getHier(
                    syntaxTree.splice(i + 1),
                    targetAST,
                    targetAST_nest,
                    node.level
                )
            }
            //nestが上位の場合、このnestは終了し上位に処理を戻す
            else {
                return upperChildren
            }
            //
            upperChildren.push({
                type: node.type,
                text: SimpleMarkdown.getInnerText(node.children), //node.children[0].text,
                children,
            })
            //nest先で進んだイテレーターをこのnestでも進める
            while (
                i < syntaxTree.length &&
                (!syntaxTree[i]?.level || syntaxTree[i].level != node.level)
            ) {
                i++
            }
        } else {
            const keysArray = targetAST.map((t) => {
                return [...nodeKeys].filter((x) =>
                    new Set(Object.keys(t)).has(x)
                )
            })
            const check = keysArray.some((keys, j) => {
                return keys.length > 0
                    ? keys.every((key) => {
                          return node[key] == targetAST[j][key]
                      })
                    : false
            })
            const children = _getHier(node.children, targetAST)
            if (check) {
                upperChildren.push({
                    type: node.type,
                    text: SimpleMarkdown.getInnerText(node.children), //node.children[0].text,
                    children: children,
                })
            } else {
                for (let child of children) {
                    upperChildren.push(child)
                }
            }
        }
    }
    return upperChildren
}

export const getHier = (
    syntaxTree: SimpleMarkdownType.ASTNodeArray,
    targetAST: TargetASTNode[],
    targetAST_nest: TargetASTNode[] = [{ type: "heading" }]
): Hier[] => {
    let newSyntaxTree: SimpleMarkdownType.ASTNodeArray =
        structuredClone(syntaxTree)
    return _getHier(newSyntaxTree, targetAST, targetAST_nest, 0)
}
