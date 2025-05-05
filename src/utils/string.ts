/**
 * JavaやC#のformatメソッドのように、特定の文字列のプレースホルダを引数で渡された文字で置き換える
 *
 * @param str 置換前文字列 プレースホルダを`{0}`, `{1}`の形式で埋め込む
 * @param ...args 第2引数以降で、置換する文字列を指定する
 *
 * @see
 * - https://qiita.com/YOS0602/items/8eadf8f7743ebdc5946c
 * - https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
 * - https://trueman-developer.blogspot.com/2015/11/typescriptjavascript.html
 *
 * @example
 * ```ts
 * stringFormat('{0}とは、{1}までに身に付けた{2}の{3}である。', '常識', '18歳', '偏見', 'コレクション')
 * stringFormat('{0}とは、{1}までに身に付けた{2}の{3}である。', ...['常識', '18歳', '偏見', 'コレクション'])
 * ```
 * →`'常識とは、18歳までに身に付けた偏見のコレクションである。'`
 */
export const stringFormat = (str: string, ...args: unknown[]): string => {
    for (const [i, arg] of args.entries()) {
        const regExp = new RegExp(`\\{${i}\\}`, "g")
        str = str.replace(regExp, arg as string)
    }
    return str
}
