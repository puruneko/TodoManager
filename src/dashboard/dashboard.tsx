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
    useContext,
} from "react"

//
import { __debugPrint__impl } from "../debugtool/debugtool"
import { T_CEvent, MdPropsContext } from "../store/mdPropsStore"
import { T_Hashtag } from "../texteditor/hashtag"

//
//
const __debugPrint__ = (...args: any) => {
    __debugPrint__impl("<dashboard>", ...args)
}
//
//
const SampleDashboard: React.FC = (props) => {
    //
    const { mdProps, mdPropsDispatch } = useContext(MdPropsContext)
    const [filteredCEvents, setFilteredCEvents] = useState<{
        [tag: string]: T_CEvent[]
    }>({})
    const targetTags = ["TAGtask1", "TAGtask2"]
    //
    useEffect(() => {
        let fe: { [tag: string]: T_CEvent[] } = {}
        for (let targetTag of targetTags) {
            fe[targetTag] = mdProps.cEvents.filter((e) =>
                e.tags?.map((t) => t.name).includes(targetTag)
            )
            __debugPrint__(mdProps.cEvents)
        }
        setFilteredCEvents(fe)
    }, [mdProps.cEvents])
    //
    //
    //
    return (
        <div>
            <h1>DASHBOARD</h1>
            {Object.entries(filteredCEvents).map((fe) => {
                const name = fe[0]
                const es = fe[1]
                return (
                    <div key={name}>
                        <h2>tagname:{name}</h2>
                        {es.map((e) => {
                            return <p key={e.id}>{e.title}</p>
                        })}
                    </div>
                )
            })}
        </div>
    )
}

export default SampleDashboard
