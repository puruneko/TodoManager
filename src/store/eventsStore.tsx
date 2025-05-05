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

type EventsActionType =
    | {
          type: "set"
          payload: {
              events: CEventsPropsType
          }
      }
    | {
          type: "update"
          payload: {
              events: CEventsPropsType
          }
      }
    | {
          type: "remove"
          payload: {
              ids: string[]
          }
      }

export const eventsReducer = (
    state: CEventsPropsType,
    action: EventsActionType
): CEventsPropsType => {
    switch (action.type) {
        case "set":
            return structuredClone(action.payload.events)
        case "update":
            const updatingIds = action.payload.events.map((e) => e.id)
            return [
                ...state.filter((x) => !updatingIds.includes(x.id)),
                ...action.payload.events,
            ]
        case "remove":
            return state.filter((x) => !action.payload.ids.includes(x.id))
    }
}

export const useEventsFunction = (dispatch: Dispatch<EventsActionType>) => {
    const set = useCallback((events: CEventsPropsType) => {
        dispatch({ type: "set", payload: { events } })
    }, [])
    const update = useCallback((events: CEventsPropsType) => {
        dispatch({ type: "update", payload: { events } })
    }, [])
    const remove = useCallback((ids: string[]) => {
        dispatch({ type: "remove", payload: { ids } })
    }, [])
    return { set, update, remove }
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
const eventsDispatchContext = createContext<Dispatch<EventsActionType>>(
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
export const useEvents = (): [CEventsPropsType, Dispatch<EventsActionType>] => {
    const events = useEventsContext()
    const dispatch = useEventsDispatch()
    return [events, dispatch]
}

/**
 * eventsの値のみをコンポーネント内で利用するためのHook
 * @example
 *     const events = useEventsValue()
 *
 * @returns
 */
export const useEventsValue = (): CEventsPropsType => {
    const events = useEventsContext()
    return events
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
    id: "",
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
