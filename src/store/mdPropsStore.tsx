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
import { getTasks } from "../texteditor/mdtext2taskHandler"
import { debugMdTextSimple } from "../debugtool/sampleMd"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<mdpropsstore>", ...args)
}
//
//

export type MdPosition = {
    lineNumber: number
    column: number
    offset: number
}
export type MdRange = {
    start: MdPosition
    end: MdPosition
}

export const genDefaultRange = (range?: Partial<MdRange>) => {
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

export type CEventDepType = {
    id: string
    title: string
    range: MdRange
}
export type CEventPropsType = {
    id: string
    title: string
    start: Date
    end: Date | null
    range: MdRange
    deps: CEventDepType[]
    //
    allDay: boolean
    //
    description?: string
    tags?: string[]
    checked?: boolean
    taskRange?: MdRange
    descriptionRange?: MdRange
}
//
export type MdTaskType = Omit<CEventPropsType, "start" | "end"> & {
    start: CEventPropsType["start"] | null
    end: CEventPropsType["start"] | null
}

export type MdPropsType = {
    mdtext: string
    parsed: any
    tasks: MdTaskType[]
    cEvents: CEventPropsType[]
}

const initialMdtext = debugMdTextSimple // ""
//
export const genDefaultCEventProps = (cEvent?: Partial<CEventPropsType>) => {
    return {
        id: "",
        title: "",
        start: new Date("Invalid Date"),
        end: null,
        range: genDefaultRange(),
        deps: [],
        allDay: false,
        ...cEvent,
    }
}

//
type MdPropsActionType =
    | {
          type: "set"
          payload: {
              mdprops: MdPropsType
          }
      }
    | {
          type: "update"
          payload: {
              mdprops: Partial<MdPropsType>
          }
      }
    | {
          type: "setMdtext"
          payload: {
              mdtext: string
          }
      }
    | {
          type: "updateMdtext"
          payload: {
              mdtext: string
              range: MdRange
          }
      }
    | {
          type: "setTasks"
          payload: {
              tasks: MdTaskType[]
          }
      }
    | {
          type: "updateTasks"
          payload: {
              tasks: MdTaskType[]
          }
      }
    | {
          type: "setCEvents"
          payload: {
              cEvents: CEventPropsType[]
          }
      }
    | {
          type: "updateCEvents"
          payload: {
              cEvents: CEventPropsType[]
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

export const getCEventById = (cEvents: CEventPropsType[], id: string) => {
    let cEvent: CEventPropsType | undefined = undefined
    const _cEvent = cEvents.filter((e) => e.id === id)
    if (_cEvent.length === 1) {
        cEvent = _cEvent[0]
    }
    return cEvent
}

export const mdRange2cEventid = (mdRange: MdRange): string => {
    let eventid = `${mdRange.start.lineNumber}-${mdRange.start.column}-${mdRange.start.offset}`
    if (mdRange.end) {
        eventid += `,${mdRange.end.lineNumber}-${mdRange.end.column}-${mdRange.end.offset}`
    }
    return eventid
}
export const cEventid2mdRange = (cEventid: string): MdRange => {
    const regexpMdposStr = new RegExp(
        "(\\d+)-(\\d+)-(\\d+),(\\d+)-(\\d+)-(\\d+)"
    )
    const m = cEventid.match(regexpMdposStr)
    let res = {
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
export const getDateProps = (d: Date, typeFunc: any = Number) => {
    try {
        return {
            year: typeFunc(d.getFullYear()),
            month: typeFunc(d.getMonth() + 1),
            day: typeFunc(d.getDate()),
            hour: typeFunc(d.getHours()),
            minute: typeFunc(d.getMinutes()),
            second: typeFunc(d.getSeconds()),
        }
    } catch (e) {
        return null
    }
}
export const dateProps2stringType = (dateProps: any) => {
    if (dateProps) {
        return {
            year: String(dateProps.year).padStart(4, "0"),
            month: String(dateProps.month).padStart(2, "0"),
            day: String(dateProps.day).padStart(2, "0"),
            hour: String(dateProps.hour).padStart(2, "0"),
            minute: String(dateProps.minute).padStart(2, "0"),
            second: String(dateProps.second).padStart(2, "0"),
        }
    }
    return null
}
export const dateProps2dateString = (dateProps: any) => {
    const d = dateProps2stringType(dateProps)
    __debugPrint__("dateProps2dateString", d)
    if (d) {
        return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`
    }
    return ""
}
const regstrDateHashtag = new RegExp(
    "[~]?(\\d{4}-\\d{1,2}-\\d{1,2})(T(\\d{1,2}(:\\d{1,2}(:\\d{1,2})?)?))?",
    "g"
)
export const dateHashtagValue2dateRange = (dateHashtagValue: string) => {
    // "2025-4-1T10:00:00~2025-10-11T12"
    // ---> ['2025-4-1T10:00:00', '2025-4-1', 'T10:00:00', '10:00:00', ':00:00', ':00',]
    // ---> ['~2025-10-11T12', '2025-10-11', 'T12', '12', undefined, undefined,]
    const hashtagValue = dateHashtagValue
        .replace("#", "")
        .replace("scheduled:", "")
    const dates = Array.from(hashtagValue.matchAll(regstrDateHashtag), (m) => {
        const d = {
            year: Number(m[1].split("-")[0]),
            month: Number(m[1].split("-")[1]),
            day: Number(m[1].split("-")[2]),
            hour: Number(m[2] ? m[2].replace("T", "").split(":")[0] : 0), //'T10:00:00'
            minute: Number(m[3] ? m[3].split(":")[1] : 0), //'10:00:00'
        }
        return {
            ...d,
            date: new Date(d.year, d.month - 1, d.day, d.hour, d.minute),
        }
    })
    __debugPrint__(
        "dateHashtagValue2dateRange",
        dateHashtagValue,
        hashtagValue,
        dates
    )
    return {
        start: dates[0].date,
        end:
            dates[1] && !Number.isNaN(dates[1].date.getTime())
                ? dates[1].date
                : null,
    }
}
export const dateRange2dateHashtagValue = (dateRange: {
    start: Date
    end: Date | null
}) => {
    let d = getDateProps(dateRange.start, String)
    const startStr = dateProps2dateString(d) //`${d.year.padStat(4,'0')}-${d.month.padStat(2,'0')}-${d.day.padStat(2,'0')}T${d.hour.padStat(2,'0')}:${d.minute.padStat(2,'0')}`
    let endStr = ""
    if (
        dateRange.end &&
        dateRange.start.getTime() !== dateRange.end.getTime()
    ) {
        d = getDateProps(dateRange.end)
        endStr = `~${dateProps2dateString(d)}` //`~${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`
    }
    const dateHashtagValue = `${startStr}${endStr}`
    return dateHashtagValue
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
export const replaceTextByRange = (
    text: string,
    replaceText: string,
    range: MdRange
): string => {
    if (!range.end) {
        throw Error("range.end is null")
    }
    return (
        text.slice(0, range.start.offset) +
        replaceText +
        text.slice(range.end.offset)
    )
}

/**
 * mdpropsを作成する
 * @param mdtext
 * @returns
 */
export const genBrandnewMdProps = (mdtext: string): MdPropsType => {
    const parsed = parseMarkdown(mdtext)
    const tasks = getTasks(mdtext, parsed.mdastTree)
    const cEvents = tasks.filter((task) => {
        return task.start
    }) as CEventPropsType[]
    return {
        mdtext,
        parsed,
        tasks,
        cEvents,
    }
}

export const genInitialMdProps = (props = {}): MdPropsType => {
    return {
        mdtext: "",
        parsed: null,
        tasks: [],
        cEvents: [],
        ...props,
    }
}

export const genErrorRange = (): MdRange => {
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

/**
 * mdPropsの更新の実装部分
 * @param state
 * @param action
 * @returns
 */
export const mdPropsReducer = (
    state: MdPropsType,
    action: MdPropsActionType
): MdPropsType => {
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
            const mdtext = action.payload.mdtext
            const res = Object.assign(
                {
                    ...state,
                    ...genBrandnewMdProps(mdtext),
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
        case "updateTasks": //TODO
            break
        case "setCEvents": //TODO
            break
        case "updateCEvents":
            newState = (() => {
                let newMdtext = state.mdtext
                for (let cEvent of action.payload.cEvents) {
                    const tagsStr = cEvent.tags
                        ? cEvent.tags
                              .filter((tag) => {
                                  return !tag.startsWith("scheduled:")
                              })
                              .map((tag) => {
                                  return `#${tag}`
                              })
                              .join(" ")
                        : ""
                    const scheduledHashtagValue = dateRange2dateHashtagValue({
                        ...cEvent,
                    })
                    //新規タスクの追加
                    if (cEvent.id === "") {
                        let newLineText = "\n"
                        newLineText += `- [${cEvent.checked ? "x" : " "}] ${
                            cEvent.title
                        } ${tagsStr} #scheduled:${scheduledHashtagValue}`
                        if (cEvent.description && cEvent.description != "") {
                            newLineText += "\n"
                            newLineText += `    - ${cEvent.description}`
                        }
                        newMdtext += newLineText
                        __debugPrint__(
                            "updateTasks in mdPropsReducer :: new",
                            newLineText
                        )
                    }
                    //既存タスクの更新
                    else {
                        const range = cEvent.taskRange || cEvent.range
                        if (range) {
                            const newLineText = `- [${
                                cEvent.checked ? "x" : " "
                            }] ${
                                cEvent.title
                            } ${tagsStr} #scheduled:${scheduledHashtagValue}`
                            newMdtext = replaceTextByRange(
                                newMdtext,
                                newLineText,
                                range
                            )
                            __debugPrint__(
                                "updateTasks in mdPropsReducer :: update",
                                newLineText
                            )
                        } else {
                            throw Error(`range not found.(${cEvent})`)
                        }
                    }
                }
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
export const initialMdProps: MdPropsType = genBrandnewMdProps(initialMdtext)

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
