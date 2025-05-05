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
import {
    useEvents,
    CEventPropsType,
    initialEvent,
    initialEvents,
    CEventsPropsType,
    eventsReducer,
    useEventsFunction,
    useEventsValue,
} from "../store/eventsStore"
import { useMdProps, useMdPropsFunction } from "../store/mdtextStore"
import { __debugPrint__ } from "../debugtool/debugtool"

const eventInfoFirstProps = [
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
const getEventInfoProps = (eventInfoObj: any, propname: string) => {
    if (eventInfoFirstProps.includes(propname)) {
        return eventInfoObj[propname]
    }
    return eventInfoObj.extendedProps[propname]
}
const getEventById = (events: CEventsPropsType, id: string) => {
    let event: CEventPropsType | undefined = undefined
    const _event = events.filter((e) => e.id === id)
    if (_event.length === 1) {
        event = _event[0]
    }
    return event
}

const SampleCalendar: React.FC = (props) => {
    //
    const refCalender = useRef<any>()
    //
    const [mdProps, mdPropsDispatch] = useMdProps()
    const mdPropsFunc = useMdPropsFunction(mdPropsDispatch)
    //
    const events = useEventsValue()
    const [inputEvent, setInputEvent] = useState<CEventPropsType>(initialEvent)
    const [displayInput, setDisplayInput] = useState(false)
    //
    const handleClick = (id: string) => {
        //const event = refCalender.current.getApi().getElementById(id)
        const event = getEventById(events, id)
        __debugPrint__("handle click", id, events, event, inputEvent)
        if (event) {
            const title = event.title
            const start = new Date(event.start)
            const end = new Date(event.end)
            setInputEvent(() => {
                return {
                    ...event,
                    id,
                    title,
                    start,
                    end,
                }
            })
            setDisplayInput(true)
        } else {
            __debugPrint__("ERROR:", id, events)
        }
    }
    const handleCalenderSelect = (selection: any) => {
        __debugPrint__("select", events, selection)
        setInputEvent(() => {
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
    const onSubmitEvent = () => {
        //refCalender.current.getApi().addEvent(inputEvent)
        __debugPrint__("onSubmitEvent", events)
        //
        mdPropsFunc.updateTasks([inputEvent])
        //
        setInputEvent(() => {
            return { ...initialEvent }
        })
        setDisplayInput(false)
    }
    const onDeleteEvent = () => {
        //refCalender.current.getApi().addEvent(inputEvent)
        __debugPrint__("onDeleteEvent", events)
        /*
        setEvents((es) => {
            __debugPrint__(
                "onDeleteEvent setEvents",
                es,
                inputEvent,
                es.filter((x) => x.id !== inputEvent.id)
            )
            return es.filter((x) => x.id !== inputEvent.id)
        })
            */
        mdPropsFunc.removeTasks([inputEvent.id])
        setInputEvent(initialEvent)
        setDisplayInput(false)
    }
    //
    /**
     * イベントの見た目の定義
     * @param eventInfo
     * @returns
     */
    const EventDisplayComponent = (eventInfo: EventContentArg) => {
        //const eventProps = {
        //    ...eventInfo.event,
        //    ...eventInfo.event.extendedProps
        // }
        __debugPrint__(
            eventInfo,
            eventInfo.event,
            eventInfo.event.extendedProps,
            { ...eventInfo.event, ...eventInfo.event.extendedProps },
            getEventInfoProps(eventInfo.event, "title"),
            getEventInfoProps(eventInfo.event, "tags")
        )
        //
        const id = getEventInfoProps(eventInfo.event, "id")
        const handleCheckboxClicked = (e) => {
            const event = getEventById(events, id)
            if (event) {
                event.checked =
                    event.checked !== undefined ? !event.checked : true
                mdPropsFunc.updateTasks([event])
            }
            e.stopPropagation()
        }
        //
        return (
            <div
                style={{
                    maxWidth: "100%",
                    wordWrap: "break-word",
                }}
                onClick={() => {
                    handleClick(id)
                }}
            >
                <table style={{ color: "red", wordWrap: "break-word" }}>
                    <tr>
                        <td>
                            <input
                                type="checkbox"
                                checked={getEventInfoProps(
                                    eventInfo.event,
                                    "checked"
                                )}
                                onClick={handleCheckboxClicked}
                            />
                            {eventInfo.event.title}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            [desc]{eventInfo.event.extendedProps.description}
                        </td>
                    </tr>
                    <tr>
                        <td>[timeText]{eventInfo.timeText}</td>
                    </tr>
                    <tr>
                        <td>
                            [tags]{eventInfo.event.extendedProps.tags.join(",")}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            [checked]
                            {String(
                                getEventInfoProps(eventInfo.event, "checked")
                            )}
                        </td>
                    </tr>
                </table>
            </div>
        )
    }
    //
    __debugPrint__("events in calendar", events, inputEvent)
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
                <p>{inputEvent.id}</p>
                <input
                    value={inputEvent.title}
                    onChange={(e) => {
                        setInputEvent({
                            ...inputEvent,
                            title: e.target.value,
                        })
                    }}
                />
                <input
                    value={inputEvent.tags?.join(",")}
                    onChange={(e) => {
                        setInputEvent({
                            ...inputEvent,
                            tags: e.target.value.split(","),
                        })
                    }}
                />
                <p>{String(inputEvent.start)}</p>
                <p>{String(inputEvent.end)}</p>
                <input
                    type="button"
                    value="submit"
                    onClick={() => {
                        onSubmitEvent()
                    }}
                />
                <input
                    type="button"
                    value="delete"
                    onClick={() => {
                        onDeleteEvent()
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
                events={events}
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
                //eventClick={handleClick}
                eventContent={EventDisplayComponent}
            />
        </div>
    )
}

export default SampleCalendar
