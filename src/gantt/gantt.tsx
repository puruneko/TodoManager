import React, { useContext, useEffect, useRef, useState } from "react"
import { getData, zoomConfig, simpleColumns } from "./data"
import { Gantt, Willow } from "wx-react-gantt"
import "./gantt.css"
import { MdPropsContext, T_CEvent } from "../store/mdPropsStore"
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

//
const toGtaskFromCevent = (cevent: T_CEvent): T_GanttTask => {
    return {
        id: cevent.id,
        start: cevent.start || undefined,
        end: cevent.end || undefined,
        text: cevent.title || "",
        type: "task",
        parent: 0,
        //open: true,
        details: cevent.description || "",
    }
}
//

export default function GanttChart({ skinSettings = {} }) {
    const { mdProps, mdPropsDispatch } = useContext(MdPropsContext)
    //
    const apiRef = useRef(null)
    const { tasks, links, scales } = getData()
    //
    const [ganttTasks, setGanttTasks] = useState<T_GanttTask[]>([])
    //
    useEffect(() => {
        const headings: T_GanttTask[] = []
        const gtasks: T_GanttTask[] = mdProps.cEvents.map((cevent) => {
            let parent: any = 0
            if (cevent.deps.length !== 0) {
                cevent.deps.forEach((d) => {
                    if (!headings.map((h) => h.id).includes(d.id)) {
                        headings.push({
                            id: d.id,
                            start: cevent.start || undefined,
                            end: cevent.start || undefined,
                            text: d.title || "",
                            type: "summary",
                            parent: 0,
                            details: "",
                            open: true,
                        })
                    }
                })
                parent = cevent.deps[0].id
            }
            return {
                id: cevent.id,
                start: cevent.start || undefined,
                end: cevent.end || undefined,
                text: cevent.title || "",
                type: "task",
                parent: parent,
                //open: true,
                details: cevent.description || "",
            }
        })
        headings.forEach((h) => {
            let start: Date | undefined = undefined
            let end: Date | undefined = undefined
            gtasks.forEach((t) => {
                if (t.parent === h.id) {
                    if (
                        !start ||
                        (start &&
                            t.start &&
                            start.getTime() > t.start.getTime())
                    ) {
                        start = t.start
                    }
                    if (
                        !end ||
                        (end && t.end && end.getTime() < t.end.getTime())
                    ) {
                        end = t.end || end
                    }
                }
            })
            h.start = start || h.start
            h.end = end
            gtasks.push(h)
        })
        setGanttTasks(gtasks)
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
