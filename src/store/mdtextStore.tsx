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
import {
    CEventPropsType,
    CEventsPropsType,
    getCEventById,
} from "./cEventsStore"
import { Point, Position } from "unist"
import { __debugPrint__ } from "../debugtool/debugtool"
import { dictMap } from "../utils/iterable"

export type MdPosition = {
    lineNumber: number
    column: number
    offset: number
}
export type MdRange = {
    start: MdPosition
    end: MdPosition
}

export type MdTaskType = Omit<CEventPropsType, "start" | "end"> & {
    start: CEventPropsType["start"] | null
    end: CEventPropsType["start"] | null
}

export type MdPropsType = {
    mdtext: string
    tasks: MdTaskType[]
}

/*
const aaaa: MdTaskType = {
    id: "",
    title: "",
    end: new Date(),
    //@ts-ignore
    range: genErrorRange(),
    deps: [],
}
console.log(aaaa)
*/

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

export const initialMdProps: MdPropsType = {
    mdtext: `aaa
# PJ1
- [ ] task1 #TAGtask10 #TAGtask10_2
    - DESCRIPTION(1-1)*bold*EOL
    - DESCRIPTION(1-2)
- [ ] task2 #TAGtask20 #TAGtask2
    - DESCRIPTION(2-1)
    - DESCRIPTION(2-2)
- [x] task3 #TAGtask30 #scheduled:2025-5-5T15:00~2025-5-5T16:00
    - DESCRIPTION(3-1)
    - DESCRIPTION(3-2)
- [ ] task4 #TAGtask40
    - DESCRIPTION(4-1)
    - DESCRIPTION(4-2)
- [ ] task5 #TAGtask50 #scheduled:2025-5-5T10:00~2025-5-5T11:00
    - DESCRIPTION(5-1)
    - DESCRIPTION(5-2)
`,
    tasks: [],
}

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
          type: "setText"
          payload: {
              mdtext: string
          }
      }
    | {
          type: "updateText"
          payload: {
              mdtext: string
              range: any
          }
      }
    | {
          type: "updateTasks"
          payload: {
              tasks: CEventsPropsType
          }
      }
    | {
          type: "removeTasks"
          payload: {
              ids: string[]
          }
      }
    | {
          type: "flush"
          payload: {}
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

export const mdPropsReducer = (
    state: MdPropsType,
    action: MdPropsActionType
): MdPropsType => {
    switch (action.type) {
        case "set":
            return structuredClone(action.payload.mdprops)
        case "update":
            return Object.assign(
                {
                    ...state,
                    ...action.payload.mdprops,
                },
                {}
            )
        case "setText":
            const res = Object.assign(
                {
                    ...state,
                    mdtext: action.payload.mdtext,
                },
                {}
            )
            __debugPrint__("setText in mdPropsReducer", state, action, res)
            return res
        case "updateText": //TODO
            return Object.assign(
                {
                    ...state,
                },
                {}
            )
        case "updateTasks":
            return (() => {
                let newMdtext = state.mdtext
                for (let task of action.payload.tasks) {
                    const tagsStr = task.tags
                        ? task.tags
                              .filter((tag) => {
                                  return !tag.startsWith("scheduled:")
                              })
                              .map((tag) => {
                                  return `#${tag}`
                              })
                              .join(" ")
                        : ""
                    const scheduledHashtagValue = dateRange2dateHashtagValue({
                        ...task,
                    })
                    //新規タスクの追加
                    if (task.id === "") {
                        let newLineText = "\n"
                        newLineText += `- [${task.checked ? "x" : " "}] ${
                            task.title
                        } ${tagsStr} #scheduled:${scheduledHashtagValue}`
                        if (task.description && task.description != "") {
                            newLineText += "\n"
                            newLineText += `    - ${task.description}`
                        }
                        newMdtext += newLineText
                        __debugPrint__(
                            "updateTasks in mdPropsReducer :: new",
                            newLineText
                        )
                    }
                    //既存タスクの更新
                    else {
                        const range = task.taskRange || task.range
                        if (range) {
                            const newLineText = `- [${
                                task.checked ? "x" : " "
                            }] ${
                                task.title
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
                            throw Error(`range not found.(${task})`)
                        }
                    }
                }
                return Object.assign(
                    {
                        ...state,
                        mdtext: newMdtext,
                    },
                    {}
                )
            })()
        case "removeTasks":
            let ranges: MdRange[] = action.payload.ids.map((id) => {
                return cEventid2mdRange(id)
            })
            let newMdtext = state.mdtext
            for (let pos of ranges) {
                newMdtext = replaceTextByRange(newMdtext, "", pos)
            }
            return Object.assign(
                {
                    ...state,
                    mdtext: newMdtext,
                },
                {}
            )
        case "flush":
            return Object.assign(
                {
                    mdtext: "",
                    tasks: [],
                },
                {}
            )
    }
}
export const useMdPropsFunction = (dispatch: Dispatch<MdPropsActionType>) => {
    const funcs = {
        set: useCallback(
            (mdprops: MdPropsType) => {
                dispatch({ type: "set", payload: { mdprops } })
            },
            [dispatch]
        ),
        update: useCallback(
            (mdprops: MdPropsType) => {
                dispatch({ type: "update", payload: { mdprops } })
            },
            [dispatch]
        ),
        setText: useCallback(
            (mdtext: string) => {
                __debugPrint__("setText in useMdPropsFunction", mdtext)
                dispatch({ type: "setText", payload: { mdtext } })
            },
            [dispatch]
        ),
        updateText: useCallback(
            (mdtext: string, range: any) => {
                dispatch({ type: "updateText", payload: { mdtext, range } })
            },
            [dispatch]
        ),
        updateTasks: useCallback(
            (tasks: CEventsPropsType) => {
                dispatch({ type: "updateTasks", payload: { tasks } })
            },
            [dispatch]
        ),
        removeTasks: useCallback(
            (ids: string[]) => {
                dispatch({ type: "removeTasks", payload: { ids } })
            },
            [dispatch]
        ),
        flush: useCallback(() => {
            dispatch({ type: "flush", payload: {} })
        }, [dispatch]),
    }
    return funcs
}

/**
 * cEventsの本体
 */
const MdPropsContext = createContext<MdPropsType>(initialMdProps)

/**
 * cEventsにアクセスするためのHook
 * @returns
 */
const useMdPropsContext = () => useContext(MdPropsContext)

/**
 * cEventsのdispatchの本体
 */
const MdPropsDispatchContext = createContext<Dispatch<MdPropsActionType>>(
    () => undefined
)

/**
 * cEventsDispatchにアクセスするためのHook
 * @returns
 */
const useMdPropsDispatch = () => useContext(MdPropsDispatchContext)

/**
 * cEventsをコンポーネント内で利用するためのHook
 * @example
 *     const [cEvents, cEventsDispatch] = useCEvents()
 *
 * @returns
 */
export const useMdProps = (): [MdPropsType, Dispatch<MdPropsActionType>] => {
    const mdprops = useMdPropsContext()
    const dispatch = useMdPropsDispatch()
    return [mdprops, dispatch]
}

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
    const [mdPropsStoreGlobal, mdPropsStoreGlobalDispatch] = useReducer(
        mdPropsReducer,
        initialMdProps
    )
    return (
        <MdPropsContext.Provider value={mdPropsStoreGlobal}>
            <MdPropsDispatchContext.Provider value={mdPropsStoreGlobalDispatch}>
                {children}
            </MdPropsDispatchContext.Provider>
        </MdPropsContext.Provider>
    )
}
