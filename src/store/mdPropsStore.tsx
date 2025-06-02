//
//

import {
    debugMdForGantt,
    debugMdTextSimple,
    debugMdTextSimple2,
} from "../debugtool/sampleMd"
const initialMdtext = debugMdForGantt // ""

//
//

import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react"
import { Point, Position } from "unist"
import { __debugPrint__impl } from "../debugtool/debugtool"
import { dictMap } from "../utils/iterable"
import { parseMarkdown } from "../texteditor/remarkProcessing"
import { genLinetext, getTasks } from "../texteditor/mdText2taskHandler"
import {
    toStringFromDateProps,
    toDatePropsFromDate,
    toDateStringFromDateRange,
} from "../utils/datetime"
import {
    T_DateHashtag,
    filterDateHashtag,
    T_Hashtag,
    isDateHashtag,
    updateHashtag,
} from "../texteditor/hashtag"
import { OnlyIdRequired } from "../utils/types"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<mdpropsstore>", ...args)
}
//
//

export type T_MdPosition = {
    lineNumber: number
    column: number
    offset: number
}
export type T_MdRange = {
    start: T_MdPosition
    end: T_MdPosition
}

export const genDefaultRange = (range?: Partial<T_MdRange>) => {
    return {
        start: {
            lineNumber: -1,
            column: -1,
            offset: -1,
            ...range?.start,
        },
        end: {
            lineNumber: -1,
            column: -1,
            offset: -1,
            ...range?.end,
        },
    }
}

//

export type T_CEventDep = {
    id: string
    title: string
    range: T_MdRange
    depth: number
}
export type T_CEventType = "plan" | "due" | "event"
export type T_CEvent = {
    //calendar props
    type: T_CEventType
    id: string
    title: string
    start: Date
    end: Date | null
    allDay: boolean
    description: string | null
    //calendar props(extended)
    deps: T_CEventDep[]
    tags: T_Hashtag[]
    checked: boolean
}

//
export type T_MdObj = {
    id: string
    value: string
    deps: T_CEventDep[]
    tags: T_Hashtag[]
    range: T_MdRange
}
export type T_MdUnit = {
    value: string
    range: T_MdRange
}
export type T_MdTask = T_MdObj & {
    task: T_MdUnit
    description: T_MdUnit
    checked: boolean
}

export type T_MdProps = {
    mdText: string
    mdParsed: any
    mdTasks: T_MdTask[]
    cEvents: T_CEvent[]
}

//
export const genDefaultCEvent = (cEvent?: Partial<T_CEvent>): T_CEvent => {
    return {
        type: "event",
        id: "",
        title: "",
        start: new Date("Invalid Date"),
        end: null,
        allDay: false,
        description: null,
        deps: [],
        tags: [],
        checked: false,
        ...cEvent,
    }
}

//
const toCEventFromMdTask = (mdTask: T_MdTask): T_CEvent[] | null => {
    let dateHashtags = filterDateHashtag(mdTask.tags)
    if (dateHashtags.length == 0) {
        return null
    }
    const res = dateHashtags.map((dateHashtag) => {
        const cT_Event: T_CEventType =
            dateHashtag.name == "due"
                ? "due"
                : dateHashtag.name == "plan"
                ? "plan"
                : "event"
        const cEventId = `${mdTask.id}_${dateHashtag.name}`
        return genDefaultCEvent({
            ...mdTask,
            ...dateHashtag.value,
            type: cT_Event,
            id: cEventId,
            title: mdTask.task.value,
            allDay: !dateHashtag.value.end,
            description: mdTask.description.value,
        })
    })
    return res
}

//
type T_MdPropsAction =
    | {
          type: "set"
          payload: {
              mdprops: T_MdProps
          }
      }
    | {
          type: "update"
          payload: {
              mdprops: Partial<T_MdProps>
          }
      }
    | {
          type: "setMdtext"
          payload: {
              mdText: string
          }
      }
    | {
          type: "updateMdtext"
          payload: {
              mdText: string
              range: T_MdRange
          }
      }
    | {
          type: "setTasks"
          payload: {
              mdTasks: T_MdTask[]
          }
      }
    | {
          type: "updateTasks"
          payload: {
              mdTasks: OnlyIdRequired<T_MdTask>[]
          }
      }
    | {
          type: "updateTask"
          payload: {
              mdTask: OnlyIdRequired<T_MdTask>
          }
      }
    | {
          type: "setCEvents"
          payload: {
              cEvents: T_CEvent[]
          }
      }
    | {
          type: "updateCEvents"
          payload: {
              cEvents: T_CEvent[]
          }
      }
    | {
          type: "removeCEvents"
          payload: {
              ids: string[]
          }
      }
    | {
          type: "flush"
          payload: {}
      }

export const getCEventById = (cEvents: T_CEvent[], id: string) => {
    let cEvent: T_CEvent | undefined = undefined
    const _cEvent = cEvents.filter((e) => e.id === id)
    if (_cEvent.length === 1) {
        cEvent = _cEvent[0]
    }
    return cEvent
}

export const toTaskIdFromMdRange = (mdRange: T_MdRange): string => {
    let eventid = `${mdRange.start.lineNumber}-${mdRange.start.column}-${mdRange.start.offset}`
    if (mdRange.end) {
        eventid += `,${mdRange.end.lineNumber}-${mdRange.end.column}-${mdRange.end.offset}`
    }
    return eventid
}

export const toCEventIdFromMdRange = (
    mdRange: T_MdRange,
    cT_Event: T_CEventType
): string => {
    let eventid = toTaskIdFromMdRange(mdRange)
    eventid += `_${cT_Event}`
    return eventid
}
const regstrT_MdRange = new RegExp(
    "(\\d+)-(\\d+)-(\\d+),(\\d+)-(\\d+)-(\\d+)_(\\S+)"
)
export const toMdRangeFromCEventId = (cEventid: string): T_MdRange => {
    const m = cEventid.match(regstrT_MdRange)
    let res = genDefaultRange()
    if (m) {
        res = {
            start: {
                lineNumber: Number(m[1]),
                column: Number(m[2]),
                offset: Number(m[3]),
            },
            end: {
                lineNumber: Number(m[4]),
                column: Number(m[5]),
                offset: Number(m[6]),
            },
        }
    }
    return res
}
export const toDateHashtagNameFromCEventId = (
    cEventid: string
): string | null => {
    const m = cEventid.match(regstrT_MdRange)
    if (m && m.length >= 7) {
        return m[7]
    }
    return null
}
/*
export const range2indexRange = (text: string, range: Position) => {
    const lines = text.split("\n")
    let indexRange = [0, 0]
    let count = 0
    let lineno = 1
    for (; lineno < range.start.lineNumber; lineno++) {
        count += lines[lineno].length + 1
    }
    count += range.start.column
    indexRange[0] = count
    count +=
        range.start.lineNumber != range.end.lineNumber
            ? lines[lineno - 1].length - range.start.column
            : 0
    for (lineno++; lineno < range.end.lineNumber; lineno++) {
        count += lines[lineno].length + 1
    }
    count += range.end.column
    indexRange[1] = count
    console.log(indexRange)
    return indexRange
}

    */
const replaceTextByRangeImpl = (
    text: string,
    replaceText: string,
    range: T_MdRange
): string => {
    return (
        text.slice(0, range.start.offset) +
        replaceText +
        text.slice(range.end.offset)
    )
}
export const replaceTextByRange = (
    text: string,
    replacements: {
        replaceText: string
        range: T_MdRange
    }[]
): string => {
    return replacements
        .sort((a, b) => b.range.start.offset - a.range.start.offset) // 後ろから処理
        .reduce((textNow, replacement) => {
            return replaceTextByRangeImpl(
                textNow,
                replacement.replaceText,
                replacement.range
            )
        }, text)
}

const toCEventListFromMdTasks = (mdTasks: T_MdTask[]): T_CEvent[] => {
    return mdTasks
        .map(toCEventFromMdTask)
        .filter((task) => {
            return task !== null
        })
        .flat()
}

const toMdTaskIdFromCEventId = (cEventId: string): string => {
    return cEventId.split("_")[0]
}

export const genPseudoMdTaskFromCEvent = (cEvent: T_CEvent): T_MdTask => {
    const dateHashtag: T_Hashtag = {
        name: cEvent.type,
        value: toDateStringFromDateRange({ ...cEvent }),
    }
    const targetHashtagName = toDateHashtagNameFromCEventId(cEvent.id)
    const tags = updateHashtag(
        cEvent.tags,
        targetHashtagName
            ? {
                  name: targetHashtagName,
                  value: toDateStringFromDateRange({ ...cEvent }),
              }
            : null
    )
    const range = toMdRangeFromCEventId(cEvent.id)
    let mdTask: T_MdTask = {
        id: toMdTaskIdFromCEventId(cEvent.id),
        value: "",
        deps: cEvent.deps,
        tags: tags,
        range: range,
        //
        task: {
            value: cEvent.title,
            range: range,
        },
        description: {
            value: cEvent.description || "",
            range: range,
        },
        checked: cEvent.checked,
    }
    mdTask.value = genLinetext("task", mdTask)
    return mdTask
}

export const getMdTaskById = (mdTasks: T_MdTask[], id: string): T_MdTask => {
    const matched = mdTasks.filter((task) => {
        return task.id == id
    })
    if (matched.length == 1) {
        return matched[0]
    }
    throw Error(
        `task id duplicated(${matched
            .map((m) => m.value)
            .join(",")}): ${matched}`
    )
}

export const getMdTaskByCEventId = (
    mdTasks: T_MdTask[],
    cEventId: string
): T_MdTask => {
    const id = toMdTaskIdFromCEventId(cEventId)
    return getMdTaskById(mdTasks, id)
}

export const getMdTaskByOffset = (
    mdTasks: T_MdTask[],
    offset: number
): T_MdTask | null => {
    let resTask: T_MdTask | null = null
    for (let task of mdTasks) {
        if (
            task.range.start.offset <= offset &&
            offset <= task.range.end.offset
        ) {
            resTask = task
            break
        }
    }
    return resTask
}

export const toMdTaskFromCEvent = (
    mdTasks: T_MdTask[],
    cEvent: T_CEvent
): T_MdTask => {
    let oldMdTask = getMdTaskByCEventId(mdTasks, cEvent.id)
    let pseudoMdTask = genPseudoMdTaskFromCEvent(cEvent)
    let mdTask: T_MdTask = {
        ...pseudoMdTask,
        task: {
            ...pseudoMdTask.task,
            range: oldMdTask.task.range,
        },
        description: {
            ...pseudoMdTask.description,
            range: oldMdTask.description.range,
        },
    }
    mdTask.value = genLinetext("task", mdTask)
    return mdTask
}

export const genInitialMdProps = (props = {}): T_MdProps => {
    return {
        mdText: "",
        mdParsed: null,
        mdTasks: [],
        cEvents: [],
        ...props,
    }
}

export const genErrorRange = (): T_MdRange => {
    return {
        start: {
            lineNumber: -1,
            column: -1,
            offset: -1,
        },
        end: {
            lineNumber: -1,
            column: -1,
            offset: -1,
        },
    }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
/**
 * mdpropsを作成する
 * @param mdText
 * @returns
 */
export const genBrandnewMdProps = (mdText: string): T_MdProps => {
    const mdParsed = parseMarkdown(mdText)
    const mdTasks = getTasks(mdText, mdParsed.mdastTree)
    const cEvents = toCEventListFromMdTasks(mdTasks)
    const res = {
        mdText,
        mdParsed,
        mdTasks,
        cEvents,
    }
    __debugPrint__("====genBrandnewMdProps====", res)
    return res
}

//
const toMdTextFromCEvent = (
    mdText: string,
    mdTasks: T_MdTask[],
    cEvent: T_CEvent
) => {
    let newMdtext = mdText
    //新規タスクの追加
    if (cEvent.id === "") {
        const pseudoMdTask = genPseudoMdTaskFromCEvent(cEvent)
        const newLineText = "\n" + pseudoMdTask.value
        newMdtext += newLineText
        __debugPrint__("toMdTextFromCEvent", cEvent, pseudoMdTask, newLineText)
    }
    //既存タスクの更新
    else {
        const mdTask = toMdTaskFromCEvent(mdTasks, cEvent)
        const newLineText = mdTask.value
        newMdtext = replaceTextByRange(newMdtext, [
            { replaceText: newLineText, range: mdTask.range },
        ])
        __debugPrint__("toMdTextFromCEvent in mdPropsReducer", newLineText)
    }
    return newMdtext
}
//
const updateMdTasks = (
    nowMdTasks: T_MdTask[],
    newMdTasks: OnlyIdRequired<T_MdTask>[]
): T_MdTask[] => {
    const newMdTaskIds = newMdTasks.reduce((d, mdTask) => {
        d[mdTask.id] = mdTask
        return d
    }, {})
    const updatedMdTasks = nowMdTasks.map((mdTask) => {
        const t = newMdTaskIds[mdTask.id]
        if (t) {
            const oldMdTask = getMdTaskById(nowMdTasks, mdTask.id)
            return {
                ...oldMdTask,
                ...t,
            }
        } else {
            return mdTask
        }
    })
    return updatedMdTasks
}

/**
 * mdPropsの更新の実装部分
 * @param state
 * @param action
 * @returns
 */
export const mdPropsReducer = (
    state: T_MdProps,
    action: T_MdPropsAction
): T_MdProps => {
    let newState = state
    switch (action.type) {
        case "set":
            newState = structuredClone(action.payload.mdprops)
            break
        case "update":
            newState = Object.assign(
                {
                    ...state,
                    ...action.payload.mdprops,
                },
                {}
            )
            break
        case "setMdtext":
            const mdText = action.payload.mdText
            const res = Object.assign(
                {
                    ...state,
                    ...genBrandnewMdProps(mdText),
                },
                {}
            )
            __debugPrint__("setText in mdPropsReducer", state, action, res)
            newState = res
            break
        case "updateMdtext": //TODO
            break
        case "setTasks": //TODO
            break
        case "updateTasks":
            newState = (() => {
                const updatedMdTasks = updateMdTasks(
                    state.mdTasks,
                    action.payload.mdTasks
                )
                const newMdText = replaceTextByRange(
                    state.mdText,
                    updatedMdTasks.map((mdTask) => {
                        return {
                            replaceText: genLinetext("task", mdTask),
                            range: mdTask.range,
                        }
                    })
                )
                __debugPrint__(
                    "updateTasks in mdPropsReducer :: update",
                    updatedMdTasks
                )
                return Object.assign(
                    {
                        ...state,
                        ...genBrandnewMdProps(newMdText),
                    },
                    {}
                )
            })()
            break
        case "setCEvents": //TODO
            break
        case "updateCEvents":
            newState = (() => {
                let newMdtext = state.mdText
                for (let cEvent of action.payload.cEvents) {
                    newMdtext = toMdTextFromCEvent(
                        newMdtext,
                        state.mdTasks,
                        cEvent
                    )
                }
                __debugPrint__("updateCEvents in mdPropsReducer", newMdtext)
                //
                return Object.assign(
                    {
                        ...state,
                        ...genBrandnewMdProps(newMdtext),
                    },
                    {}
                )
            })()
            break
        case "removeCEvents": //TODO
            break
        case "flush":
            newState = Object.assign(genInitialMdProps(), {})
            break
    }

    return newState
}

/**
 * mdpropsの初期値
 */
export const initialMdProps: T_MdProps = genBrandnewMdProps(initialMdtext)

export const useMdPropsReducer = () => {
    const [mdProps, mdPropsDispatch] = useReducer(
        mdPropsReducer,
        initialMdProps
    )
    return { mdProps, mdPropsDispatch }
}

const defaultMdPropsContext: ReturnType<typeof useMdPropsReducer> = {
    mdProps: initialMdProps,
    mdPropsDispatch: () => {},
}

/**
 * cEventsの本体
 */
export const MdPropsContext = createContext(defaultMdPropsContext)

/**
 * cEventsにアクセスできるコンポーネントを制御するためのProvider
 * @example
 *     <UseCEventsProviderComponent>
 *         <App />
 *     </UseCEventsProviderComponent>
 * @param param0
 * @returns
 * @description ここでcontextとreducerが扱うstore/dispacherを紐づける（value=の部分）
 */
export const UseMdPropsProviderComponent: React.FC<any> = ({ children }) => {
    return (
        <MdPropsContext.Provider value={useMdPropsReducer()}>
            {children}
        </MdPropsContext.Provider>
    )
}
