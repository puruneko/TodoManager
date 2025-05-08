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
} from "react"

// FullCalendarコンポーネント。
import FullCalendar from "@fullcalendar/react"
import type {
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
    useCEvents,
    CEventPropsType,
    initialCEvent,
    initialCEvents,
    CEventsPropsType,
    cEventsReducer,
    useCEventsFunction,
    useCEventsValue,
} from "../store/cEventsStore"
import {
    dateProps2stringType,
    getDateProps,
    MdPosition,
    useMdProps,
    useMdPropsFunction,
} from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"
import { useIcChannel } from "../store/interComponentChannelStore"
import { nonPropagatingEvent } from "../utils/htmlEvents"

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
const getCEventById = (cEvents: CEventsPropsType, id: string) => {
    let cEvent: CEventPropsType | undefined = undefined
    const _cEvent = cEvents.filter((e) => e.id === id)
    if (_cEvent.length === 1) {
        cEvent = _cEvent[0]
    }
    return cEvent
}

type SampleCalendarPropsType = {}
const SampleCalendar: React.FC<SampleCalendarPropsType> = (props) => {
    //
    const refCalender = useRef<any>()
    //
    const icChannel = useIcChannel("calender")
    //
    const [mdProps, mdPropsDispatch] = useMdProps()
    const mdPropsFunc = useMdPropsFunction(mdPropsDispatch)
    //
    const cEvents = useCEventsValue()
    const [inputCEvent, setInputCEvent] =
        useState<CEventPropsType>(initialCEvent)
    const [displayInput, setDisplayInput] = useState(false)
    //
    const windowKeyDownRef = useRef<string | null>(null)
    //
    //
    const updateTasks = (tasks: CEventsPropsType) => {
        mdPropsFunc.updateTasks(tasks)
    }
    const createCEventFromFcevent = (fcEvent: EventApi) => {
        const id = getCEventInfoProps(fcEvent, "id")
        const cEvent = getCEventById(cEvents, id)
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
    useEffect(() => {
        document.addEventListener("keydown", (e) => {
            windowKeyDownRef.current = e.code
        })
        document.addEventListener("keyup", (e) => {
            windowKeyDownRef.current = null
        })
    }, [])
    //
    //key event
    //
    const handleClick = (id: string) => {
        //const cEvent = refCalender.current.getApi().getElementById(id)
        const cEvent = getCEventById(cEvents, id)
        __debugPrint__("handle click", id, cEvents, cEvent, inputCEvent)
        if (cEvent) {
            const title = cEvent.title
            const start = new Date(cEvent.start)
            const end = new Date(cEvent.end)
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
            __debugPrint__("ERROR:", id, cEvents)
        }
    }
    const handleCalenderSelect = (selection: any) => {
        __debugPrint__(
            "select",
            cEvents,
            selection,
            "key:",
            windowKeyDownRef.current
        )
        if (windowKeyDownRef.current?.toLowerCase().startsWith("shift")) {
            const textareaPosition = icChannel.send(
                "texteditor",
                "getPosition",
                {}
            ) as MdPosition
            if (textareaPosition && textareaPosition.start.offset) {
                let newCEvent: CEventPropsType | null = null
                for (let cEvent of cEvents) {
                    if (
                        (cEvent.position?.start.offset || 99999999) <=
                            textareaPosition.start.offset &&
                        textareaPosition.start.offset <=
                            (cEvent.position?.end.offset || -1)
                    ) {
                        newCEvent = cEvent
                        break
                    }
                }
                if (newCEvent) {
                    newCEvent.start = selection.start
                    newCEvent.end = selection.end
                    onSubmitCEvent(newCEvent)
                }
            }
        } else {
            setInputCEvent(() => {
                return Object.assign(
                    {
                        id: "",
                        title: "",
                        start: selection.start,
                        end: selection.end,
                    },
                    {}
                )
            })
            setDisplayInput(true)
        }
    }
    const onSubmitCEvent = (__inputCEvent?: CEventPropsType) => {
        //refCalender.current.getApi().addCEvent(inputCEvent)
        __debugPrint__("onSubmitCEvent", cEvents)
        //
        updateTasks([__inputCEvent ? __inputCEvent : inputCEvent])
        //
        setInputCEvent(() => {
            return { ...initialCEvent }
        })
        setDisplayInput(false)
    }
    const onDeleteCEvent = () => {
        //refCalender.current.getApi().addCEvent(inputCEvent)
        __debugPrint__("onDeleteCEvent", cEvents)
        /*
        setCEvents((es) => {
            __debugPrint__(
                "onDeleteCEvent setCEvents",
                es,
                inputCEvent,
                es.filter((x) => x.id !== inputCEvent.id)
            )
            return es.filter((x) => x.id !== inputCEvent.id)
        })
            */
        mdPropsFunc.removeTasks([inputCEvent.id])
        setInputCEvent(initialCEvent)
        setDisplayInput(false)
    }
    //
    //event drag handler
    //
    const moveCalenderEvent = (
        info: EventDropArg | EventDragStopArg | EventResizeDoneArg
    ) => {
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
        const newCEvent = createCEventFromFcevent(fcEvent)
        __debugPrint__("handleCalenderEventEdit", newCEvent, cEvents)
        if (newCEvent) {
            updateTasks([newCEvent])
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
            console.log(getCEventById(cEvents, id))
            icChannel.send("texteditor", "focusTextarea", {
                position: getCEventInfoProps(fcEvent, "position"),
            })
        }
        const handleCheckboxClicked = () => {
            const cEvent = getCEventById(cEvents, id)
            if (cEvent) {
                cEvent.checked =
                    cEvent.checked !== undefined ? !cEvent.checked : true
                mdPropsFunc.updateTasks([cEvent])
            }
        }
        const handleDragover = (e) => {
            e.preventDefault()
        }
        const handleDrop = (e) => {
            e.preventDefault()
            const selectionStart = e.dataTransfer.getData(
                "application/texteditor"
            )
            __debugPrint__("handleDrop(1):", e)
            __debugPrint__(selectionStart)
            let droppedCEvent: CEventPropsType | null = null
            for (let cEvent of cEvents) {
                if (
                    (cEvent.position?.start.offset || 99999999) <=
                        selectionStart &&
                    selectionStart <= (cEvent.position?.end.offset || -1)
                ) {
                    droppedCEvent = cEvent
                    break
                }
            }
            __debugPrint__("droppedCEvent:", droppedCEvent)
        }
        //
        const d = {
            start: dateProps2stringType(
                getDateProps(getCEventInfoProps(fcEvent, "start"), String)
            ),
            end: dateProps2stringType(
                getDateProps(getCEventInfoProps(fcEvent, "end"), String)
            ),
        }
        if (d.start) {
            let timeText = `${d.start.hour}:${d.start.minute}`
            if (d.end) {
                timeText += `- ${d.end.hour}:${d.end.minute}`
            }
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
                    onDrop={handleDrop}
                    onDragOver={handleDragover}
                >
                    <div className="calender-cEventcard-header">
                        <div style={{ flexGrow: 1 }}>PJ Name</div>
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
                            {getCEventInfoProps(fcEvent, "tags").join(",")}
                        </p>
                    </div>
                    <div className="calender-cEventcard-description">
                        <p className="p-text-ellipsis">
                            [desc]{getCEventInfoProps(fcEvent, "description")}
                        </p>
                    </div>
                </div>
            )
        } else {
            return null
        }
    }
    //
    __debugPrint__("cEvents in calendar", cEvents, inputCEvent)
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
                            tags: e.target.value.split(","),
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
            </div>
            <div id="fullcalendar-wrapper">
                <FullCalendar
                    ref={refCalender}
                    //@ts-ignore
                    events={cEvents}
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
