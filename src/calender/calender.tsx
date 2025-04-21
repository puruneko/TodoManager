/**
 * 各種モジュールのインストール
 */
import React, { useState, useRef } from "react"

// FullCalendarコンポーネント。
import FullCalendar from "@fullcalendar/react"
import type { EventContentArg } from "@fullcalendar/core"

// FullCalendarで週表示を可能にするモジュール。
import timeGridPlugin from "@fullcalendar/timegrid"

// FullCalendarで月表示を可能にするモジュール。
import dayGridPlugin from "@fullcalendar/daygrid"

// FullCalendarで日付や時間が選択できるようになるモジュール。
import interactionPlugin from "@fullcalendar/interaction"

type CEventExtendedPropsType = {
    description?: string
}
type CEventPropsType = {
    id: number
    title: string
    start: Date
    end: Date
} & CEventExtendedPropsType
const SampleCalendar: React.FC = (props) => {
    //
    const refCalender = useRef<any>()
    //
    const [events, setEvents] = useState<CEventPropsType[]>([])
    const [eventId, setEventId] = useState(0)
    const initialEvent: CEventPropsType = {
        id: -1,
        title: "",
        start: new Date(Date.now()),
        end: new Date(Date.now()),
    }
    const [inputEvent, setInputEvent] = useState<CEventPropsType>(initialEvent)
    const [displayInput, setDisplayInput] = useState(false)
    //
    const handleClick = (info: any) => {
        /**
         * infoにはカレンダーに登録されたイベントが入ってくる。そのイベントのIDを元にmyEvents
         * に格納されたイベントを取り出してStateに保存する。
         */
        const id = Number(info.event.id)
        //const event = refCalender.current.getApi().getElementById(id)
        const eventList = events.filter((e) => e.id === id)
        console.log("handle click", events, eventList)
        if (eventList.length === 1) {
            const event = eventList[0]
            const title = event.title
            const start = new Date(event.start)
            const end = new Date(event.end)
            setInputEvent({
                id,
                title,
                start,
                end,
            })
            setDisplayInput(true)
        } else {
            console.error("ERROR:", id, events)
        }
    }
    const handleCalenderSelect = (selection: any) => {
        console.log("select", events)
        setInputEvent({
            id: -1,
            title: "",
            start: selection.start,
            end: selection.end,
        })
        setDisplayInput(true)
    }
    const onAddEvent = () => {
        //refCalender.current.getApi().addEvent(inputEvent)
        console.log("onAddEvent", events)
        setEvents((es) => {
            let newInputEvent = {
                ...inputEvent,
                id: inputEvent.id === -1 ? eventId : inputEvent.id,
                description: "DUMMY DESCRIPTION",
            }
            console.log(
                "setEvents",
                es,
                inputEvent,
                newInputEvent,
                es.filter((x) => x.id !== newInputEvent.id)
            )
            return [
                ...es.filter((x) => x.id !== newInputEvent.id),
                newInputEvent,
            ]
        })
        setEventId((ei) => {
            return ei + 1
        })
        setInputEvent(initialEvent)
        setDisplayInput(false)
    }
    const onDeleteEvent = () => {
        //refCalender.current.getApi().addEvent(inputEvent)
        console.log("onDeleteEvent", events)
        setEvents((es) => {
            console.log(
                "onDeleteEvent setEvents",
                es,
                inputEvent,
                es.filter((x) => x.id !== inputEvent.id)
            )
            return es.filter((x) => x.id !== inputEvent.id)
        })
        setInputEvent(initialEvent)
        setDisplayInput(false)
    }
    //
    /**
     * イベントの見た目の定義
     * @param eventInfo
     * @returns
     */
    const eventDisplayComponent = (eventInfo: EventContentArg) => {
        //const eventProps = {
        //    ...eventInfo.event,
        //    ...eventInfo.event.extendedProps
        // }
        return (
            <>
                <i>{eventInfo.event.title}</i>
                <p style={{ color: "red" }}>@@@@@@@@@@</p>
                <i>{eventInfo.event.extendedProps.description}</i>
                <p style={{ color: "red" }}>@@@@@@@@@@</p>
                <b>{eventInfo.timeText}</b>
            </>
        )
    }
    //
    console.log("events", events)
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
                    height: "200px",
                    width: "200px",
                    zIndex: 2,
                    backgroundColor: "red",
                }}
            >
                <form>
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
                    <p>{String(inputEvent.start)}</p>
                    <p>{String(inputEvent.end)}</p>
                    <input
                        type="button"
                        value="submit"
                        onClick={() => {
                            onAddEvent()
                        }}
                    />
                    <input
                        type="button"
                        value="delete"
                        onClick={() => {
                            onDeleteEvent()
                        }}
                    />
                </form>
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
                eventClick={handleClick}
                eventContent={eventDisplayComponent}
            />
        </div>
    )
}

export default SampleCalendar
