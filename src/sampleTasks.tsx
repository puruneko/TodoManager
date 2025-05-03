import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react"

export type CEventPropsType = {
    id: string
    title: string
    start: Date
    end: Date
    //
    description?: string
    tags?: string[]
    checked?: boolean
}
export type CEventsPropsType = NonNullable<Array<CEventPropsType>>

type EventActionType =
    | {
          type: "update"
          payload: {
              event: CEventPropsType
          }
      }
    | {
          type: "delete"
          payload: {
              id: string
          }
      }

export const eventsReducer = (
    state: CEventsPropsType,
    action: EventActionType
): CEventsPropsType => {
    switch (action.type) {
        case "update":
            return [
                ...state.filter((x) => x.id !== action.payload.event.id),
                action.payload.event,
            ]
        case "delete":
            return state.filter((x) => x.id !== action.payload.id)
    }
}

/**
 * eventsの本体
 */
const EventsContext = createContext<CEventsPropsType>([])

/**
 * eventsにアクセスするためのHook
 * @returns
 */
const useEventsContext = () => useContext(EventsContext)

/**
 * eventsのdispatchの本体
 */
const eventsDispatchContext = createContext<Dispatch<EventActionType>>(
    () => undefined
)

/**
 * eventsDispatchにアクセスするためのHook
 * @returns
 */
const useEventsDispatch = () => useContext(eventsDispatchContext)

/**
 * eventsをコンポーネント内で利用するためのHook
 * @example
 *     const [events, eventsDispatch] = useEvents()
 *
 * @returns
 */
export const useEvents = (): [CEventsPropsType, Dispatch<EventActionType>] => {
    const events = useEventsContext()
    const dispatch = useEventsDispatch()
    return [events, dispatch]
}

export const useEventsFunction = (dispatch: Dispatch<EventActionType>) => {
    const setEvent = useCallback((event: CEventPropsType) => {
        dispatch({ type: "update", payload: { event } })
    }, [])
    const deleteEvent = useCallback((id: string) => {
        dispatch({ type: "delete", payload: { id } })
    }, [])
    return { setEvent, deleteEvent }
}

/**
 * eventsにアクセスできるコンポーネントを制御するためのProvider
 * @example
 *     <UseEventsProviderComponent>
 *         <App />
 *     </UseEventsProviderComponent>
 * @param param0
 * @returns
 * @description ここでcontextとreducerが扱うstore/dispacherを紐づける（value=の部分）
 */
export const UseEventsProviderComponent: React.FC<any> = ({ children }) => {
    const [eventsStoreGlobal, eventsStoreGlobalDispatch] = useReducer(
        eventsReducer,
        initialEvents
    )
    return (
        <EventsContext.Provider value={eventsStoreGlobal}>
            <eventsDispatchContext.Provider value={eventsStoreGlobalDispatch}>
                {children}
            </eventsDispatchContext.Provider>
        </EventsContext.Provider>
    )
}

///////////////////////////////////////////

const __now = new Date(Date.now())
export const initialEvent: CEventPropsType = {
    id: "-1",
    title: "",
    start: structuredClone(__now),
    end: structuredClone(__now),
}
export const initialEvents: CEventsPropsType = [] /*[
    {
        id: "0",
        title: "task0",
        start: structuredClone(__now),
        end: structuredClone(__now),
        tags: ["TAGtask0"],
    },
    {
        id: "1",
        title: "task1",
        start: structuredClone(__now),
        end: structuredClone(__now),
        tags: ["TAGtask1"],
    },
    {
        id: "2",
        title: "task2",
        start: structuredClone(__now),
        end: structuredClone(__now),
        tags: ["TAGtask2"],
    },
    {
        id: "3",
        title: "task3",
        start: structuredClone(__now),
        end: structuredClone(__now),
        tags: ["TAGtask3"],
    },
]
*/
