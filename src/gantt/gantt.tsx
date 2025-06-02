import React, {
    memo,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
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
    parent: string | number //所属headerを表す（依存関係はlinks）
    type: string
    open?: boolean
    details: string
}

//
const toGtaskFromCevent = (
    cevent: T_CEvent,
    gevent: Partial<T_GanttTask> = {}
): T_GanttTask => {
    return {
        id: cevent.id || undefined,
        start: cevent.start || undefined,
        end: cevent.end || undefined,
        text: cevent.title || "",
        type: gevent?.type || "task",
        parent: gevent?.parent || 0,
        details: cevent.description || "",
        ...gevent,
    }
}
//
const toCEventFromGTask = (gevent: T_GanttTask) => {}
//

export default function GanttChart({ skinSettings = {} }) {
    const { mdProps, mdPropsDispatch } = useContext(MdPropsContext)
    //
    const apiRef = useRef(null)
    //const { tasks, links, scales } = getData()
    //
    const [ganttTasks, setGanttTasks] = useState<T_GanttTask[]>([])
    //
    useEffect(() => {
        const headings: T_GanttTask[] = []
        const gtasks: T_GanttTask[] = mdProps.cEvents.map((cevent) => {
            let parent: any = 0
            //heading(summary)の作成（level=1のみ対応）
            if (cevent.deps.length !== 0) {
                cevent.deps.forEach((d) => {
                    if (!headings.map((h) => h.id).includes(d.id)) {
                        const headingGTask = toGtaskFromCevent(
                            { ...cevent, id: d.id, title: d.title },
                            { type: "summary", open: true }
                        )
                        headings.push(headingGTask)
                    }
                })
                parent = cevent.deps[0].id
            }
            const gtask = toGtaskFromCevent(cevent, { parent })
            return gtask
        })
        //heading(summary)の時間幅の調整
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
            //heading(summary)をgtaskに追加
            gtasks.push(h)
        })
        //ganttへ反映
        setGanttTasks(gtasks)
    }, [mdProps])
    //
    //
    type T_GanttUpdateTaskEventArgs = {
        id: string | number
        task: any
        diff?: number
        inProgress?: boolean
        eventSource?: string
    }
    useEffect(() => {
        if (apiRef.current) {
            //@ts-ignore
            apiRef.current.on(
                "update-task",
                (ev: T_GanttUpdateTaskEventArgs): boolean | void => {
                    __debugPrint__("update-task", ev)
                    //update CEvent
                    const task = ev.task
                    const id = task.id
                    const cevents = mdProps.cEvents.filter((ce) => {
                        return ce.id === id
                    })
                    if (cevents.length === 1) {
                        const cevent = cevents[0]
                        cevent.start = task.start
                        cevent.end = task.end
                        cevent.title = task.text
                        cevent.description = task.detail
                        //
                        mdPropsDispatch({
                            type: "updateCEvents",
                            payload: { cEvents: [cevent] },
                        })
                    } else {
                        throw Error(`invalid cevents or gtasks:${id}`)
                    }
                }
            )
        }
    }, [])
    //
    //
    __debugPrint__("ganttTasks:", ganttTasks)
    //__debugPrint__("tasks:", tasks)
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
                        //links={links}
                        zoom={zoomConfig}
                        api={apiRef}
                        columns={simpleColumns}
                    />
                </Willow>
            </div>
        </div>
    )
}
