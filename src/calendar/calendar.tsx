/**
 * 各種モジュールのインストール
 */
import React, {
    useState,
    useRef,
    useMemo,
    useCallback,
    SetStateAction,
    useReducer,
    useEffect,
    KeyboardEvent,
    useContext,
} from "react"

// FullCalendarコンポーネント。
import FullCalendar from "@fullcalendar/react"
import type {
    DateSelectArg,
    EventApi,
    EventContentArg,
    EventDropArg,
} from "@fullcalendar/core"

// FullCalendarで週表示を可能にするモジュール。
import timeGridPlugin from "@fullcalendar/timegrid"

// FullCalendarで月表示を可能にするモジュール。
import dayGridPlugin from "@fullcalendar/daygrid"

// FullCalendarで日付や時間が選択できるようになるモジュール。
import interactionPlugin, {
    EventResizeDoneArg,
    EventResizeStopArg,
    Draggable,
    EventDragStopArg,
} from "@fullcalendar/interaction"

//
import "./calendar.css"
import {
    T_CEvent,
    T_CEventType,
    genDefaultCEvent,
    getCEventById,
    getMdTaskByOffset,
    MdPropsContext,
    T_MdRange,
    T_MdTask,
    toDateHashtagNameFromCEventId,
} from "../store/mdPropsStore"
import { __debugPrint__impl } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import { nonPropagatingEvent } from "../utils/htmlEvents"
import { dateT_Props2string, getDateProps } from "../utils/datetime"
import {
    getHashtagByName,
    toDateHashtagValueFromDateRange,
    updateHashtag,
} from "../texteditor/hashtag"

//
//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<calender>", ...args)
}
//
//
const cEventInfoFirstProps = [
    "source",
    "start",
    "end",
    "startStr",
    "endStr",
    "id",
    "groupId",
    "allDay",
    "title",
    "url",
    "display",
    "startEditable",
    "durationEditable",
    "constraint",
    "overlap",
    "backgroundColor",
    "borderColor",
    "textColor",
    "classNames",
    "extendedProps",
]
const getCEventInfoProps = (cEventInfoObj: any, propname: string) => {
    if (cEventInfoFirstProps.includes(propname)) {
        return cEventInfoObj[propname]
    }
    return cEventInfoObj.extendedProps[propname]
}

type T_SampleCalendarProps = {}
const SampleCalendar: React.FC<T_SampleCalendarProps> = (props) => {
    //
    const refCalender = useRef<any>()
    //
    const icChannel = useIcChannel("calender")
    //
    const { mdProps, mdPropsDispatch } = useContext(MdPropsContext)
    const [inputCEvent, setInputCEvent] = useState<T_CEvent | null>(null)
    const [displayInput, setDisplayInput] = useState(false)
    //
    const windowKeyDownRef = useRef<string | null>(null)
    //
    //
    const updateEvents = (newCEvents: T_CEvent[]) => {
        mdPropsDispatch({
            type: "updateCEvents",
            payload: { cEvents: newCEvents },
        })
    }
    const createCEventFromFcEvent = (fcEvent: EventApi) => {
        const id = getCEventInfoProps(fcEvent, "id")
        const cEvent = getCEventById(mdProps.cEvents, id)
        if (cEvent) {
            const newCEvent = Object.keys(cEvent).reduce((dict, key) => {
                const value = getCEventInfoProps(fcEvent, key)
                dict[key] = value !== undefined ? value : cEvent[key]
                return dict
            }, {} as typeof cEvent)
            return newCEvent
        }
    }
    //
    //component did mount
    //
    useEffect(() => {
        //
        //key capture
        //
        document.addEventListener("keydown", (e) => {
            windowKeyDownRef.current = e.code
        })
        document.addEventListener("keyup", (e) => {
            windowKeyDownRef.current = null
        })
        //
        //init event
        //
        //@ts-ignore(いずれ型の整合性をとる)
        //cEventsFunc.set(mdProps.mdTasks)
    }, [])
    //
    //key event
    //
    const handleClick = (id: string) => {
        //const cEvent = refCalender.current.getApi().getElementById(id)
        const cEvent = getCEventById(mdProps.cEvents, id)
        __debugPrint__("handle click", id, mdProps.cEvents, cEvent, inputCEvent)
        if (cEvent) {
            const title = cEvent.title
            const start = new Date(cEvent.start)
            const end = cEvent.end ? new Date(cEvent.end) : null
            setInputCEvent(() => {
                return {
                    ...cEvent,
                    id,
                    title,
                    start,
                    end,
                }
            })
            setDisplayInput(true)
        } else {
            __debugPrint__("ERROR:", id, mdProps.cEvents)
        }
    }
    const handleCalenderSelect = (selection: DateSelectArg) => {
        __debugPrint__(
            "select",
            mdProps.cEvents,
            selection,
            "key:",
            windowKeyDownRef.current
        )
        //shift+selectionで新規カレンダーイベント
        if (windowKeyDownRef.current?.toLowerCase().startsWith("shift")) {
            const textareaPosition = icChannel.send(
                "texteditor",
                "getPosition",
                {}
            ) as T_MdRange
            if (textareaPosition && textareaPosition.start.offset) {
                //[TODO]eventではなくtaskにする
                let newMdTask = getMdTaskByOffset(
                    mdProps.mdTasks,
                    textareaPosition.start.offset
                )
                if (newMdTask) {
                    const newDateHashtag = {
                        name: "plan",
                        value: toDateHashtagValueFromDateRange({
                            ...selection,
                        }),
                    }
                    newMdTask.tags = updateHashtag(
                        newMdTask.tags,
                        newDateHashtag
                    )
                    mdPropsDispatch({
                        type: "updateTask",
                        payload: {
                            mdTask: newMdTask,
                        },
                    })
                }
            }
            __debugPrint__("")
        } else {
            setInputCEvent(() => {
                return Object.assign(
                    genDefaultCEvent({
                        start: selection.start,
                        end: selection.end,
                    }),
                    {}
                )
            })
            setDisplayInput(true)
        }
    }
    const onSubmitCEvent = () => {
        //refCalender.current.getApi().addCEvent(inputCEvent)
        __debugPrint__("onSubmitCEvent", mdProps.cEvents)
        //
        if (inputCEvent) {
            updateEvents([inputCEvent])
        }
        //
        setInputCEvent(() => {
            return null
        })
        setDisplayInput(false)
    }
    const onDeleteCEvent = () => {
        //refCalender.current.getApi().addCEvent(inputCEvent)
        __debugPrint__("onDeleteCEvent", mdProps.cEvents)
        if (inputCEvent) {
            mdPropsDispatch({
                type: "removeCEvents",
                payload: { ids: [inputCEvent.id] },
            })
        }
        setInputCEvent(null)
        setDisplayInput(false)
    }
    //
    //event drag handler
    //
    const moveCalenderEvent = (
        info: EventDropArg | EventDragStopArg | EventResizeDoneArg
    ) => {
        //allDay処理
        if ("delta" in info && "oldEvent" in info) {
            const delta = info.delta as {
                days: number
                milliseconds: number
                months: number
                years: number
            }
            const oldEvent = info.oldEvent as EventApi
            //allDayから時間枠のあるイベントに変更の場合の処理
            //暫定で時間枠は１時間とする
            if (oldEvent.allDay && delta.milliseconds && info.event.start) {
                const defaultEventTimeFlame = 1000 * 60 * 60 * 1
                info.event.setEnd(
                    new Date(info.event.start.getTime() + defaultEventTimeFlame)
                )
            }
        }
        const fcEvent = info.event
        const newCEvent = createCEventFromFcEvent(fcEvent)
        __debugPrint__("handleCalenderEventEdit", newCEvent, mdProps.cEvents)
        if (newCEvent) {
            updateEvents([newCEvent])
        }
    }
    const handleCalenderEventResized = (info: EventResizeDoneArg) => {
        __debugPrint__("handleCalenderEventResized", info)
        moveCalenderEvent(info)
    }
    const handleCalenderEventDragged = (info: EventDropArg) => {
        __debugPrint__("handleCalenderEventDragged", info)
        moveCalenderEvent(info)
    }
    //
    //drop
    //
    const handleElementDroppedOnCalendar = (dropinfo) => {
        __debugPrint__("handleElementDroppedOnCalendar", dropinfo)
    }
    //
    /**
     * イベントの見た目の定義
     * @param cEventInfo
     * @returns
     */
    const CEventDisplayComponent = (fcEventInfo: EventContentArg) => {
        //
        const fcEvent = fcEventInfo.event
        //
        const id = getCEventInfoProps(fcEvent, "id")
        const checked = getCEventInfoProps(fcEvent, "checked")
        //
        const handleCEventAreaClicked = (id) => {
            console.log(getCEventById(mdProps.cEvents, id))
            icChannel.send("texteditor", "focusTextarea", {
                range: getCEventInfoProps(fcEvent, "range"),
            })
        }
        const handleCheckboxClicked = () => {
            const cEvent = getCEventById(mdProps.cEvents, id)
            if (cEvent) {
                cEvent.checked =
                    cEvent.checked !== undefined ? !cEvent.checked : true
                updateEvents([cEvent])
                icChannel.send("texteditor", "setSelection", {
                    range: getCEventInfoProps(fcEvent, "range"),
                })
            }
        }
        //
        const d = {
            start: dateT_Props2string(
                getDateProps(getCEventInfoProps(fcEvent, "start"), String)
            ),
            end: dateT_Props2string(
                getDateProps(getCEventInfoProps(fcEvent, "end"), String)
            ),
        }
        if (d.start) {
            let timeText = `${d.start.hour}:${d.start.minute}`
            if (d.end) {
                timeText += `- ${d.end.hour}:${d.end.minute}`
            }
            const depsText = (getCEventInfoProps(fcEvent, "deps") || [])
                .map((dep) => {
                    return dep.title
                })
                .join(" > ")
            const tags = getCEventInfoProps(fcEvent, "tags")
            const description = getCEventInfoProps(fcEvent, "description")
            //
            return (
                <div
                    key={id}
                    className="calender-cEventcard"
                    style={{
                        backgroundColor: checked ? "lightgray" : "lightgreen",
                    }}
                    onClick={(e) => {
                        handleCEventAreaClicked(id)
                        e.stopPropagation()
                    }}
                >
                    <div className="calender-cEventcard-header">
                        <div style={{ flexGrow: 1 }}>{depsText}</div>
                        <div>{timeText}</div>
                    </div>
                    <div
                        className="calender-cEventcard-title"
                        style={{ display: "inline-flex", flexDirection: "row" }}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            onClick={(e) => {
                                handleCheckboxClicked()
                                e.stopPropagation()
                            }}
                            onChange={() => {}}
                        />
                        <p>{fcEvent.title}</p>
                    </div>
                    <div className="calender-cEventcard-tags">
                        <p className="p-text-ellipsis">
                            {tags ? tags.join(",") : ""}
                        </p>
                    </div>
                    <div className="calender-cEventcard-description">
                        <pre style={{ maxWidth: "100%", textWrap: "wrap" }}>
                            {description
                                ? description.replace(/\n( {4}|\\t)/g, "\n")
                                : ""}
                        </pre>
                    </div>
                </div>
            )
        } else {
            return null
        }
    }
    //
    __debugPrint__("mdProps.cEvents in calendar", mdProps.cEvents, inputCEvent)
    //
    //
    return (
        <div>
            <h1>CALENDAR</h1>
            <button
                onClick={() => {
                    icChannel.send("texteditor", "debug", { color: "pink" })
                }}
            >
                @@@DEBUG@@@
            </button>
            <div
                style={{
                    display: displayInput ? undefined : "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    minHeight: "200px",
                    minWidth: "200px",
                    zIndex: 2,
                    backgroundColor: "green",
                    border: "1px solid black",
                }}
            >
                {inputCEvent ? (
                    <>
                        <p>{inputCEvent.id}</p>
                        <input
                            value={inputCEvent.title}
                            onChange={(e) => {
                                setInputCEvent({
                                    ...inputCEvent,
                                    title: e.target.value,
                                })
                            }}
                        />
                        <input
                            value={inputCEvent.tags?.join(",")}
                            onChange={(e) => {
                                setInputCEvent({
                                    ...inputCEvent,
                                    tags: [], //e.target.value.split(","),
                                })
                            }}
                        />
                        <p>{String(inputCEvent.start)}</p>
                        <p>{String(inputCEvent.end)}</p>
                        <input
                            type="button"
                            value="submit"
                            onClick={() => {
                                onSubmitCEvent()
                            }}
                        />
                        <input
                            type="button"
                            value="delete"
                            onClick={() => {
                                onDeleteCEvent()
                            }}
                        />
                        <input
                            type="button"
                            value="close"
                            onClick={() => {
                                setDisplayInput(false)
                            }}
                        />
                    </>
                ) : (
                    <></>
                )}
            </div>
            <div id="fullcalendar-wrapper">
                <FullCalendar
                    ref={refCalender}
                    //@ts-ignore
                    events={mdProps.cEvents}
                    locale="ja" // ロケール設定。
                    plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]} // 週表示、月表示、日付等のクリックを可能にするプラグインを設定。
                    initialView="timeGridWeek" // カレンダーの初期表示設定。この場合、週表示。
                    slotDuration="00:30:00" // 週表示した時の時間軸の単位。
                    businessHours={{
                        // ビジネス時間の設定。
                        daysOfWeek: [1, 2, 3, 4, 5], // 0:日曜 〜 7:土曜
                        startTime: "06:00",
                        endTIme: "23:00",
                    }}
                    weekends={true} // 週末を強調表示する。
                    titleFormat={{
                        // タイトルのフォーマット。(詳細は後述。※1)
                        year: "numeric",
                        month: "short",
                    }}
                    headerToolbar={{
                        // カレンダーのヘッダー設定。(詳細は後述。※2)
                        start: "title",
                        center: "prev, next, today",
                        end: "dayGridMonth,timeGridWeek",
                    }}
                    //editable
                    selectable={true} // 日付選択を可能にする。interactionPluginが有効になっている場合のみ。
                    editable={true}
                    eventStartEditable={true}
                    eventResizableFromStart={true}
                    droppable={true}
                    dropAccept={"*"}
                    //event handler
                    select={handleCalenderSelect}
                    eventResize={handleCalenderEventResized}
                    eventDrop={handleCalenderEventDragged}
                    drop={handleElementDroppedOnCalendar}
                    eventReceive={handleElementDroppedOnCalendar}
                    //display component
                    eventContent={CEventDisplayComponent}
                    eventBackgroundColor="rgba(255, 255, 255, 0)"
                    eventBorderColor="rgba(255, 255, 255, 0)"
                />
            </div>
        </div>
    )
}

export default SampleCalendar
