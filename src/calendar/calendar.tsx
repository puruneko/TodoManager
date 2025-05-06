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
} from "react"

// FullCalendarコンポーネント。
import FullCalendar from "@fullcalendar/react"
import type { EventContentArg } from "@fullcalendar/core"

// FullCalendarで週表示を可能にするモジュール。
import timeGridPlugin from "@fullcalendar/timegrid"

// FullCalendarで月表示を可能にするモジュール。
import dayGridPlugin from "@fullcalendar/daygrid"

// FullCalendarで日付や時間が選択できるようになるモジュール。
import interactionPlugin from "@fullcalendar/interaction"

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
    useMdProps,
    useMdPropsFunction,
} from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"

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

const SampleCalendar: React.FC = (props) => {
    //
    const refCalender = useRef<any>()
    //
    const [mdProps, mdPropsDispatch] = useMdProps()
    const mdPropsFunc = useMdPropsFunction(mdPropsDispatch)
    //
    const cEvents = useCEventsValue()
    const [inputCEvent, setInputCEvent] =
        useState<CEventPropsType>(initialCEvent)
    const [displayInput, setDisplayInput] = useState(false)
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
        __debugPrint__("select", cEvents, selection)
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
    const onSubmitCEvent = () => {
        //refCalender.current.getApi().addCEvent(inputCEvent)
        __debugPrint__("onSubmitCEvent", cEvents)
        //
        mdPropsFunc.updateTasks([inputCEvent])
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
        //
        const handleCEventAreaClicked = (id) => {
            console.log(getCEventById(cEvents, id))
        }
        const handleCheckboxClicked = (e) => {
            const cEvent = getCEventById(cEvents, id)
            if (cEvent) {
                cEvent.checked =
                    cEvent.checked !== undefined ? !cEvent.checked : true
                mdPropsFunc.updateTasks([cEvent])
            }
            e.stopPropagation()
        }
        //
        const d = {
            start: dateProps2stringType(
                getDateProps(
                    getCEventInfoProps(fcEventInfo.event, "start"),
                    String
                )
            ),
            end: dateProps2stringType(
                getDateProps(
                    getCEventInfoProps(fcEventInfo.event, "end"),
                    String
                )
            ),
        }
        const timeText = `${d.start.hour}:${d.start.minute} - ${d.end.hour}:${d.end.minute}`
        //
        return (
            <div
                key={id}
                className="calender-cEventcard"
                onClick={() => {
                    handleCEventAreaClicked(id)
                    //handleClick(id)
                }}
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
                        checked={getCEventInfoProps(fcEvent, "checked")}
                        onClick={handleCheckboxClicked}
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
                {/*
                <table style={{ color: "red", wordWrap: "break-word" }}>
                    <tr>
                        <td>
                            <input
                                type="checkbox"
                                checked={getCEventInfoProps(
                                    cEventInfo.cEvent,
                                    "checked"
                                )}
                                onClick={handleCheckboxClicked}
                            />
                            {cEventInfo.cEvent.title}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            [desc]{cEventInfo.cEvent.extendedProps.description}
                        </td>
                    </tr>
                    <tr>
                        <td>[timeText]{cEventInfo.timeText}</td>
                    </tr>
                    <tr>
                        <td>
                            [tags]{cEventInfo.cEvent.extendedProps.tags.join(",")}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            [checked]
                            {String(
                                getCEventInfoProps(cEventInfo.cEvent, "checked")
                            )}
                        </td>
                    </tr>
                </table>
                */}
            </div>
        )
    }
    //
    __debugPrint__("cEvents in calendar", cEvents, inputCEvent)
    //
    //
    return (
        <div>
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
            <FullCalendar
                ref={refCalender}
                //@ts-ignore
                events={cEvents}
                locale="ja" // ロケール設定。
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]} // 週表示、月表示、日付等のクリックを可能にするプラグインを設定。
                initialView="timeGridWeek" // カレンダーの初期表示設定。この場合、週表示。
                slotDuration="00:30:00" // 週表示した時の時間軸の単位。
                selectable={true} // 日付選択を可能にする。interactionPluginが有効になっている場合のみ。
                businessHours={{
                    // ビジネス時間の設定。
                    daysOfWeek: [1, 2, 3, 4, 5], // 0:日曜 〜 7:土曜
                    startTime: "00:00",
                    endTIme: "24:00",
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
                select={handleCalenderSelect}
                //cEventClick={handleClick}
                eventContent={CEventDisplayComponent}
            />
        </div>
    )
}

export default SampleCalendar
