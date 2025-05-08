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
import { CEventsPropsType } from "./cEventsStore"
import { Position } from "unist"
import { __debugPrint__ } from "../debugtool/debugtool"

/*
[ex]

//in reciever component
const icChannel = useICChannel(componentName="ComponentName")
icChannel.on('insertText', (payload) => {
    textareaElement.innnerHTML = payload.text
})

//in sender component
const icChannel = useICChannel(componentName="ComponentName")
icChannel.send({
    to:'RecieverComponentName',
    eventName:'insertText',
    payload:{text: "INSERT TEXT"}
})

const useICChannel = (componentName) => {
    const iccStore = useICCStoreContext()
    const dispatch = useICCStoreDispatch()
    const on = (eventName, callback) => {
        dispatch({
            type: 'on',
            payload: {
                componentName: componentName,
                eventName: eventName,
                callback: callback,
            }
        })
    }
    const send = (toComponentName, eventName, payload) => {
        dispatch({
            type: 'send',
            payload: {
                componentName: toComponentName,
                eventName: eventName,
                payload: payload,
                from: componentName,
            }
        })
    }
    return {
        store: iccStore,
        dispatch: dispatch,
        on: on,
        send: send,
    }
}
*/

type ICCCallbacksType = {
    [componentName: string]: {
        [evnetName: string]: (payload: any) => any
    }
}
type ICCStoreType = {
    redraw: boolean
    callback: ICCCallbacksType
}

const ICCCallbackStore: ICCCallbacksType = {}

const ICCStoreInitial: ICCStoreType = { redraw: true, callback: {} }

type ICCStoreActionType =
    | {
          type: "on"
          payload: {
              componentName: string
              eventName: string
              callback: (payload: any) => any
          }
      }
    | {
          type: "send"
          payload: {
              componentName: string
              eventName: string
              payload: any
              from?: string
              redraw?: boolean
          }
      }
    | {
          type: "remove"
          payload: {
              componentName: string
              eventName: string
          }
      }

export const iccStoreReducer = (
    state: ICCStoreType,
    action: ICCStoreActionType
): ICCStoreType => {
    switch (action.type) {
        case "on":
            return {
                redraw: state.redraw,
                callback: {
                    ...state.callback,
                    [action.payload.componentName]: {
                        ...state.callback[action.payload.componentName],
                        [action.payload.eventName]: action.payload.callback,
                    },
                },
            }
        case "send":
            try {
                state.callback[action.payload.componentName][
                    action.payload.eventName
                ](action.payload.payload)
                return {
                    ...state,
                    callback: { ...state.callback },
                }
            } catch (e) {
                console.error(
                    `[ERROR]iccStoreReducer:${action.payload.componentName}:${action.payload.eventName}`,
                    state
                )
            }
        case "remove":
            return {
                redraw: state.redraw,
                callback: {
                    ...state.callback,
                    [action.payload.componentName]: Object.keys(
                        state[action.payload.componentName]
                    ).reduce((d, key) => {
                        if (key !== action.payload.eventName) {
                            d[key] = state[action.payload.componentName][key]
                        }
                        return d
                    }, {}),
                },
            }
    }
}
export const useIccStoreFunction = (dispatch: Dispatch<ICCStoreActionType>) => {
    const funcs = {
        on: useCallback(
            (...payload: any) => {
                dispatch({ type: "on", payload: { ...payload } })
            },
            [dispatch]
        ),
        send: useCallback(
            (...payload: any) => {
                dispatch({ type: "send", payload: { ...payload } })
            },
            [dispatch]
        ),
        remove: useCallback(
            (...payload: any) => {
                dispatch({ type: "remove", payload: { ...payload } })
            },
            [dispatch]
        ),
    }
    return funcs
}

/**
 * cEventsの本体
 */
const IccStoreContext = createContext<ICCStoreType>(ICCStoreInitial)

/**
 * cEventsにアクセスするためのHook
 * @returns
 */
const useIccStoreContext = () => useContext(IccStoreContext)

/**
 * cEventsのdispatchの本体
 */
const IccStoreDispatchContext = createContext<Dispatch<ICCStoreActionType>>(
    () => undefined
)

/**
 * cEventsDispatchにアクセスするためのHook
 * @returns
 */
const useIccStoreDispatch = () => useContext(IccStoreDispatchContext)

/**
 * cEventsをコンポーネント内で利用するためのHook
 * @example
 *     const [cEvents, cEventsDispatch] = useCEvents()
 *
 * @returns
 */
export const useIcChannel = (componentName) => {
    /*
    const iccStore = useIccStoreContext()
    const dispatch = useIccStoreDispatch()
    const __on = (eventName, callback) => {
        dispatch({
            type: "on",
            payload: {
                componentName: componentName,
                eventName: eventName,
                callback: callback,
            },
        })
    }
    const __send = (toComponentName, eventName, payload) => {
        dispatch({
            type: "send",
            payload: {
                componentName: toComponentName,
                eventName: eventName,
                payload: payload,
                from: componentName,
            },
        })
    }
    */
    const on = useCallback(
        (eventName, callback) => {
            if (!(componentName in ICCCallbackStore)) {
                ICCCallbackStore[componentName] = {}
            }
            ICCCallbackStore[componentName][eventName] = callback
        },
        [ICCCallbackStore]
    )
    const send = useCallback(
        (toComponentName, eventName, payload) => {
            return ICCCallbackStore[toComponentName][eventName](payload)
        },
        [ICCCallbackStore]
    )
    return {
        //store: iccStore,
        //dispatch: dispatch,
        on: on,
        send: send,
    }
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
export const UseIcChannelProviderComponent: React.FC<any> = ({ children }) => {
    const [iccStoreGlobal, iccStoreGlobalDispatch] = useReducer(
        iccStoreReducer,
        ICCStoreInitial
    )
    return (
        <IccStoreContext.Provider value={iccStoreGlobal}>
            <IccStoreDispatchContext.Provider value={iccStoreGlobalDispatch}>
                {children}
            </IccStoreDispatchContext.Provider>
        </IccStoreContext.Provider>
    )
}
