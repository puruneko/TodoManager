/**
 * 各種モジュールのインストール
 */
import React, {
    useState,
    useRef,
    useMemo,
    useCallback,
    SetStateAction,
    useEffect,
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
} from "../sampleTasks"

//DEBUG
const isDebugPrint = true
const __debugPrint__ = (...args: any) => {
    if (isDebugPrint) {
        console.debug(...args.map((x: any) => structuredClone(x)))
    }
}
//

const SampleDashboard: React.FC = (props) => {
    //
    const [events, eventsDispatch] = useEvents()
    const setEvent = useCallback((event: CEventPropsType) => {
        eventsDispatch({ type: "update", payload: { event } })
    }, [])
    const [filteredEvents, setFilteredEvents] = useState<{
        [tag: string]: CEventsPropsType
    }>({})
    const targetTags = ["TAGtask1", "TAGtask2"]
    //
    useEffect(() => {
        let fe: { [tag: string]: CEventsPropsType } = {}
        for (let targetTag of targetTags) {
            fe[targetTag] = events.filter((e) => e.tags?.includes(targetTag))
            __debugPrint__(events)
        }
        setFilteredEvents(fe)
    }, [events])
    //
    //
    //
    return (
        <div>
            <h1>DASHBOARD</h1>
            {Object.entries(filteredEvents).map((fe) => {
                const name = fe[0]
                const es = fe[1]
                return (
                    <div>
                        <h2>tagname:{name}</h2>
                        {es.map((e) => {
                            return <p>{e.title}</p>
                        })}
                    </div>
                )
            })}
        </div>
    )
}

export default SampleDashboard
