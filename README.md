# simple-markdown fork

fork for parse processing.

# .TODO_LIST

-   markdown

    -   [x] MD エディタ（最低限）
    -   [x] preview 機能（最低限）
    -   [x] MD 記法拡張機能
    -   [x] MD<->プレビューの位置関係の紐づけ（pos）
    -   [x] チェックボックスの実装
        -   [x] クリックのみ機能
        -   [x] toggle 機能
        -   [x] MD 連携
    -   [STOP] スクロール sync
        -   [ ] エディタ・プレビューエリアの作成
        -   [ ] スクロール sync
        -   [ ] 内部リンク機能
        -   [ ] スクロールジャンプ機能
    -   [WIP] エディタの選別
        -   [ ] textarea で OK なのか？（コンテキストメニューとか出せるか？）
        -   [ ] ほかのエディタ OSS も触ってみる
        -   [WIP] monaco を使ってみる。できるか確かめる
            -   [x] text selection
                -   mdPos<->monaca.positionAt で変換
            -   [ ] scroll sync
            -   [x] 動作の軽さ
                -   ->とりあえず OK
            -   [x] bundle size
                -   ->とりあえず OK（monaca+今の構成こみこみで約 200kB）
    -   タスク関連
        -   [ ] タスクの階層化のルールを作る
        -   [ ] タスクの抽出機能
            -   li などの文字部分を抜き出すのが難しい
                -   レンダリング後からパースする方法はタスク階層構造の計算がレンダリングに依存することになり処理が増えるなどなどよろしくないので、syntaxTree から計算したい
                    -   syntaxTree は HTML 表示に寄った階層表現なので（reactElement もそうだが）意味のとして階層構造に変換するのが大変そう・・・。しかしこの変換は必須なので、工夫して対処する必要あり。
                        -   案としては li と pos 対応を利用して MD 本文からテキスト部分を抽出
        -   [ ] タスクの階層構造化
    -   [ ] 対応していない記法の実装

-   バグ関連

    -   [ ] state.parseNumber を key とした react.key がおかしい
    -   [ ] App.ts 側の RuleType のエラー解消

-   改善関連

    -   [ ] list パース実装の一般化

-   aaa
    -   bbb
    1. aaaa
    -   ccc
    -   ddd

# changed settings

## tsconfig

-   "noUnusedLocals": false,
-   "noUnusedParameters": false,

## eslint.config.js

`js
rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            "@typescript-eslint/no-unused-vars": "warn",
            //"@typescript-eslint/ban-ts-comment": "allow-with-description"
        },
`

## .vscode/launch.json

## .vscode/tasks.json

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

-   [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
-   [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

-   Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
    languageOptions: {
        // other options...
        parserOptions: {
            project: ["./tsconfig.node.json", "./tsconfig.app.json"],
            tsconfigRootDir: import.meta.dirname,
        },
    },
})
```

-   Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
-   Optionally add `...tseslint.configs.stylisticTypeChecked`
-   Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react"

export default tseslint.config({
    // Set the react version
    settings: { react: { version: "18.3" } },
    plugins: {
        // Add the react plugin
        react,
    },
    rules: {
        // other rules...
        // Enable its recommended rules
        ...react.configs.recommended.rules,
        ...react.configs["jsx-runtime"].rules,
    },
})
```
