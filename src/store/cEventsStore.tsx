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

type CEventsActionType =
    | {
          type: "set"
          payload: {
              cEvents: CEventsPropsType
          }
      }
    | {
          type: "update"
          payload: {
              cEvents: CEventsPropsType
          }
      }
    | {
          type: "remove"
          payload: {
              ids: string[]
          }
      }

export const cEventsReducer = (
    state: CEventsPropsType,
    action: CEventsActionType
): CEventsPropsType => {
    switch (action.type) {
        case "set":
            return structuredClone(action.payload.cEvents)
        case "update":
            const updatingIds = action.payload.cEvents.map((e) => e.id)
            return [
                ...state.filter((x) => !updatingIds.includes(x.id)),
                ...action.payload.cEvents,
            ]
        case "remove":
            return state.filter((x) => !action.payload.ids.includes(x.id))
    }
}

export const useCEventsFunction = (dispatch: Dispatch<CEventsActionType>) => {
    const set = useCallback((cEvents: CEventsPropsType) => {
        dispatch({ type: "set", payload: { cEvents } })
    }, [])
    const update = useCallback((cEvents: CEventsPropsType) => {
        dispatch({ type: "update", payload: { cEvents } })
    }, [])
    const remove = useCallback((ids: string[]) => {
        dispatch({ type: "remove", payload: { ids } })
    }, [])
    return { set, update, remove }
}

/**
 * cEventsの本体
 */
const CEventsContext = createContext<CEventsPropsType>([])

/**
 * cEventsにアクセスするためのHook
 * @returns
 */
const useCEventsContext = () => useContext(CEventsContext)

/**
 * cEventsのdispatchの本体
 */
const cEventsDispatchContext = createContext<Dispatch<CEventsActionType>>(
    () => undefined
)

/**
 * cEventsDispatchにアクセスするためのHook
 * @returns
 */
const useCEventsDispatch = () => useContext(cEventsDispatchContext)

/**
 * cEventsをコンポーネント内で利用するためのHook
 * @example
 *     const [cEvents, cEventsDispatch] = useCEvents()
 *
 * @returns
 */
export const useCEvents = (): [
    CEventsPropsType,
    Dispatch<CEventsActionType>
] => {
    const cEvents = useCEventsContext()
    const dispatch = useCEventsDispatch()
    return [cEvents, dispatch]
}

/**
 * cEventsの値のみをコンポーネント内で利用するためのHook
 * @example
 *     const cEvents = useCEventsValue()
 *
 * @returns
 */
export const useCEventsValue = (): CEventsPropsType => {
    const cEvents = useCEventsContext()
    return cEvents
}

/**
 * cEventsにアクセスできるコンポーネントを制御するためのProvider
 * @example
 *     <UseCEventsProviderComponent>
 *         <App />
 *     </UseCEventsProviderComponent>
 * @param param0
 * @returns
 * @description ここでcontextとreducerが扱うstore/dispacherを紐づける（value=の部分）
 */
export const UseCEventsProviderComponent: React.FC<any> = ({ children }) => {
    const [cEventsStoreGlobal, cEventsStoreGlobalDispatch] = useReducer(
        cEventsReducer,
        initialCEvents
    )
    return (
        <CEventsContext.Provider value={cEventsStoreGlobal}>
            <cEventsDispatchContext.Provider value={cEventsStoreGlobalDispatch}>
                {children}
            </cEventsDispatchContext.Provider>
        </CEventsContext.Provider>
    )
}

///////////////////////////////////////////

const __now = new Date(Date.now())
export const initialCEvent: CEventPropsType = {
    id: "",
    title: "",
    start: structuredClone(__now),
    end: structuredClone(__now),
}
export const initialCEvents: CEventsPropsType = [] /*[
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
