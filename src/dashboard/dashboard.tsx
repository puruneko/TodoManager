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
    useEventsValue,
} from "../store/eventsStore"
import { __debugPrint__ } from "../debugtool/debugtool"

const SampleDashboard: React.FC = (props) => {
    //
    const events = useEventsValue()
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
                    <div key={name}>
                        <h2>tagname:{name}</h2>
                        {es.map((e) => {
                            return <p key={e.title}>{e.title}</p>
                        })}
                    </div>
                )
            })}
        </div>
    )
}

export default SampleDashboard
