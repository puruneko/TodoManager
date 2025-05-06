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
import { CEventsPropsType } from "./cEventsStore"
import { Position } from "unist"
import { __debugPrint__ } from "../debugtool/debugtool"
import { dictMap } from "../utils/iterable"

export type MdPropsType = {
    mdtext: string
}

export const initialMdProps: MdPropsType = {
    mdtext: `aaa
# PJ1
- [ ] task1 #TAGtask10 #TAGtask10_2
- [ ] task2 #TAGtask20 #TAGtask2
- [x] task3 #TAGtask30
- [ ] task4 #TAGtask40
- [ ] task5 #TAGtask50 #scheduled:2025-5-5T10:00~2025-5-5T11:00
`,
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
              position: any
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

export const mdpos2cEventid = (mdpos: Position): string => {
    return `${mdpos.start.line}-${mdpos.start.column}-${mdpos.start.offset},${mdpos.end.line}-${mdpos.end.column}-${mdpos.end.offset}`
}
export const cEventid2mdpos = (cEventid: string): Position => {
    const regexpMdposStr = new RegExp(
        "(\\d+)-(\\d+)-(\\d+),(\\d+)-(\\d+)-(\\d+)"
    )
    const m = cEventid.match(regexpMdposStr)
    let res = {
        start: {
            line: -1,
            column: -1,
            offset: -1,
        },
        end: {
            line: -1,
            column: -1,
            offset: -1,
        },
    }
    if (m) {
        res = {
            start: {
                line: Number(m[1]),
                column: Number(m[2]),
                offset: Number(m[3]),
            },
            end: {
                line: Number(m[4]),
                column: Number(m[5]),
                offset: Number(m[6]),
            },
        }
    }
    return res
}
export const getDateProps = (d: Date, typeFunc: any = Number) => {
    return {
        year: typeFunc(d.getFullYear()),
        month: typeFunc(d.getMonth() + 1),
        day: typeFunc(d.getDate()),
        hour: typeFunc(d.getHours()),
        minute: typeFunc(d.getMinutes()),
        second: typeFunc(d.getSeconds()),
    }
}
export const dateProps2stringType = (dateProps: any) => {
    return {
        year: String(dateProps.year).padStart(4, "0"),
        month: String(dateProps.month).padStart(2, "0"),
        day: String(dateProps.day).padStart(2, "0"),
        hour: String(dateProps.hour).padStart(2, "0"),
        minute: String(dateProps.minute).padStart(2, "0"),
        second: String(dateProps.second).padStart(2, "0"),
    }
}
export const dateProps2dateString = (dateProps: any) => {
    const d = dateProps2stringType(dateProps)
    __debugPrint__("dateProps2dateString", d)
    return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`
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
        end: dates[1] ? dates[1].date : dates[0].date,
    }
}
export const dateRange2dateHashtagValue = (dateRange: {
    start: Date
    end: Date
}) => {
    let d = getDateProps(dateRange.start, String)
    const startStr = dateProps2dateString(d) //`${d.year.padStat(4,'0')}-${d.month.padStat(2,'0')}-${d.day.padStat(2,'0')}T${d.hour.padStat(2,'0')}:${d.minute.padStat(2,'0')}`
    let endStr = ""
    if (dateRange.start.getTime() !== dateRange.end.getTime()) {
        d = getDateProps(dateRange.end)
        endStr = `~${dateProps2dateString(d)}` //`~${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`
    }
    const dateHashtagValue = `${startStr}${endStr}`
    return dateHashtagValue
}

/*
export const position2indexRange = (text: string, position: Position) => {
    const lines = text.split("\n")
    let indexRange = [0, 0]
    let count = 0
    let lineno = 1
    for (; lineno < position.start.line; lineno++) {
        count += lines[lineno].length + 1
    }
    count += position.start.column
    indexRange[0] = count
    count +=
        position.start.line != position.end.line
            ? lines[lineno - 1].length - position.start.column
            : 0
    for (lineno++; lineno < position.end.line; lineno++) {
        count += lines[lineno].length + 1
    }
    count += position.end.column
    indexRange[1] = count
    console.log(indexRange)
    return indexRange
}

    */
export const replaceTextByPosition = (
    text: string,
    replaceText: string,
    position: Position
): string => {
    return (
        text.slice(0, position.start.offset) +
        replaceText +
        text.slice(position.end.offset)
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
                              .map((tag) => {
                                  return `#${tag}`
                              })
                              .join(" ")
                        : ""
                    //新規タスクの追加
                    if (task.id === "") {
                        let newLineText = "\n"
                        const scheduledHashtagValue =
                            dateRange2dateHashtagValue({ ...task })
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
                        const position = cEventid2mdpos(task.id)
                        const newLineText = `- [${task.checked ? "x" : " "}] ${
                            task.title
                        } ${tagsStr}`
                        newMdtext = replaceTextByPosition(
                            newMdtext,
                            newLineText,
                            position
                        )
                        __debugPrint__(
                            "updateTasks in mdPropsReducer :: update",
                            newLineText
                        )
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
            let positions: Position[] = action.payload.ids.map((id) => {
                return cEventid2mdpos(id)
            })
            let newMdtext = state.mdtext
            for (let pos of positions) {
                newMdtext = replaceTextByPosition(newMdtext, "", pos)
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
            (mdtext: string, position: any) => {
                dispatch({ type: "updateText", payload: { mdtext, position } })
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
