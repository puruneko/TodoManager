//@ts-nocheck

export function micromarkExtensionTag() {
    const TAG_NAME = "tag"
    //let valueCursor = 0

    return {
        text: {
            35: { tokenize: tagTokenizer }, // '#' のコードポイント
        },
    }

    function tagTokenizer(
        //this: TokenizeContext,
        effects: Effects,
        ok: State,
        nok: State
    ): State {
        let buffer = ""
        return start

        function start(code) {
            if (code !== 35) return nok(code)
            //
            effects.enter(TAG_NAME)
            //
            effects.consume(code)
            return insideTag
        }
        function insideTag(code) {
            // 終了条件: null（終わり）、空白、改行、キャリッジリターン
            if (code === null || code === 32 || code === 10 || code === 13) {
                /*
                if (buffer.trim() !== "") {
                    console.log("insideTag: buffer content", buffer)
                    // タグのテキストをノードに追加
                    //
                    //
                    for (let i = 0; i < buffer.length; i++) {
                        effects.consume(buffer.charCodeAt(i)) // テキストを消費
                        console.log(
                            "insideTag: consumed text char",
                            buffer.charCodeAt(i)
                        )
                    }
                    //
                    //
                }
                    */
                //
                effects.exit(TAG_NAME) // 'tag' ノードの終了
                //
                return ok(code) // 次の処理へ
            }

            // bufferに文字を追加
            buffer += String.fromCharCode(code)
            effects.consume(code) // 現在のコードポイントを消費
            return insideTag
        }
    }
    /*
        function start(code: Code) {
            if (!code || markdownLineEnding(code) || code === codes.eof) {
                return nok(code)
            }

            effects.enter("taggable")
            effects.enter("taggableMarker")
            return consumeMarker(code)
        }

        function consumeMarker(code: Code) {
            if (!code || code !== 35) {
                return nok(code)
            }

            effects.consume(code)

            effects.exit("taggableMarker")
            effects.enter("taggableValue")

            return consumeValue
        }

        function consumeValue(code: Code) {
            if (!code || markdownLineEnding(code) || code === codes.eof) {
                if (valueCursor < 1) {
                    return nok(code)
                } else {
                    effects.exit("taggableValue")
                    effects.exit("taggable")
                    return ok(code)
                }
            }

            valueCursor++
            effects.consume(code)
            return consumeValue
        }
    }*/
}

export function fromMarkdownTag() {
    return {
        enter: {
            tag(token) {
                this.enter({ type: "tag", value: "", data: {} }, token) // MDAST ノード作成
            },
        },
        exit: {
            tag(token) {
                const node = this.stack[this.stack.length - 1]
                node.value = this.sliceSerialize(token) // ここでタグの文字列が value に入る
                this.exit(token)
            },
        },
    }
}

export function customTagExtension() {
    // remark プラグイン形式で micromark/mdast 拡張を登録
    const data = this.data()

    function add(field, value) {
        if (!data[field]) data[field] = []
        data[field].push(value)
    }

    add("micromarkExtensions", micromarkExtensionTag())
    add("fromMarkdownExtensions", fromMarkdownTag())
}
