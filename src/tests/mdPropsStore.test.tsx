//
//テストしたい.test.tsファイルを開いてF5
//
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { getTasks } from "../texteditor/mdText2taskHandler"
import { genDefaultRange, genBrandnewMdProps } from "../store/mdPropsStore"
import { debugMdTextSimple } from "../debugtool/sampleMd"
//
import { micromark, parse, postprocess, preprocess } from "micromark"
//import { syntax, html } from "micromark-extension-taggable"

describe("mdText2taskHandler", () => {
    it("mytest", () => {
        const mdtext = "#tag"
    })
})
