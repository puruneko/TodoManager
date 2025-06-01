import React, { useContext, useEffect, useRef, useState } from "react"
import { getData, zoomConfig, simpleColumns } from "./data"
import { Gantt, Willow } from "wx-react-gantt"
import "./gantt.css"
import { MdPropsContext } from "../store/mdPropsStore"
import { __debugPrint__impl } from "../debugtool/debugtool"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<gantt>", ...args)
}
//
//

type T_GanttTask = {
    id: any
    start: Date
    end?: Date
    text: string
    progress?: number
    parent: any //所属headerを表す（依存関係はlinks）
    type: string
    open?: boolean
    details: string
}

export default function GanttChart({ skinSettings = {} }) {
    const { mdProps, mdPropsDispatch } = useContext(MdPropsContext)
    //
    const apiRef = useRef(null)
    const { tasks, links, scales } = getData()
    //
    const [ganttTasks, setGanttTasks] = useState<T_GanttTask[]>([])
    //
    useEffect(() => {
        const t: T_GanttTask[] = mdProps.cEvents.map((event) => {
            return {
                id: event.id || "a",
                start: event.start || undefined,
                end: event.end || undefined,
                text: event.title || "",
                type: "task",
                parent: 0,
                //open: true,
                details: event.description || "",
            }
        })
        /*
    {
        id: 40,
        start: new Date(2024, 3, 9),
        end: new Date(2024, 3, 15),
        text: "Testing prototype",
        progress: 3,
        parent: 4,
        type: "task",
    }, */
        setGanttTasks(t)
    }, [mdProps])
    //
    __debugPrint__("ganttTasks:", ganttTasks)
    __debugPrint__("tasks:", tasks)
    //
    return (
        <div className="demo-rows">
            <h4 className="p20">
                Point over Gantt chart, then hold Ctrl and use mouse wheel to
                zoom
            </h4>
            <div className="demo-gantt">
                <Willow>
                    <Gantt
                        {...skinSettings}
                        tasks={ganttTasks} //{tasks} //
                        links={links}
                        zoom={zoomConfig}
                        api={apiRef}
                        columns={simpleColumns}
                    />
                </Willow>
            </div>
        </div>
    )
}
