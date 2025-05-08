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
import { genErrorRange, MdRange } from "./mdtextStore"

export type CEventDepType = {
    id: string
    title: string
    range: MdRange
}
export type CEventPropsType = {
    id: string
    title: string
    start: Date
    end: Date | null
    range: MdRange
    deps: CEventDepType[]
    //
    allDay: boolean
    //
    description?: string
    tags?: string[]
    checked?: boolean
    taskRange?: MdRange
    descriptionRange?: MdRange
}
export type CEventsPropsType = NonNullable<Array<CEventPropsType>>

//

const __now = new Date(Date.now())
export const genInitialCEvent = (initialValue = {}): CEventPropsType => {
    return {
        id: "",
        title: "",
        start: structuredClone(__now),
        end: structuredClone(__now),
        range: genErrorRange(),
        deps: [],
        allDay: false,
        ...initialValue,
    }
}
//
//
export const getCEventById = (cEvents: CEventsPropsType, id: string) => {
    let cEvent: CEventPropsType | undefined = undefined
    const _cEvent = cEvents.filter((e) => e.id === id)
    if (_cEvent.length === 1) {
        cEvent = _cEvent[0]
    }
    return cEvent
}

//
//
//
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
        [genInitialCEvent()]
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
