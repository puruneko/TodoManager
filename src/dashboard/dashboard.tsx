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
import { T_CEvent, MdPropsContext, T_MdTask } from "../store/mdPropsStore"
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
    const [pinnedMdTasks, setPinnedMdTasks] = useState("")
    const [filteredMdTasks, setFilteredMdTasks] = useState<{
        [tag: string]: T_MdTask[]
    }>({})
    const [tagFilters, setTagFilters] = useState(["TAGtask1", "TAGtask2"])
    //
    useEffect(() => {
        let fe: { [tag: string]: T_MdTask[] } = {}
        for (let targetTag of tagFilters) {
            fe[targetTag] = mdProps.mdTasks.filter((e) =>
                e.tags?.map((t) => t.name).includes(targetTag)
            )
            __debugPrint__(mdProps.mdTasks)
        }
        setFilteredMdTasks(fe)
    }, [mdProps.mdTasks, tagFilters])
    //
    const handleTagnameChange = (e) => {
        const keyCode = e.keyCode
        const elem = e.target
        const index = elem.dataset.index ? Number(elem.dataset.index) : -1
        const textBfKeydown = elem.textContent
        __debugPrint__(
            "handleTagnameChange",
            e,
            elem,
            e.key,
            e.keyCode,
            elem.textContent,
            index
        )
        if (keyCode === 13 && index >= 0) {
            setTagFilters((bf) => {
                return bf.map((f, i) => {
                    return i !== index ? f : textBfKeydown
                })
            })
            elem.blur()
        }
    }
    //
    //
    return (
        <div>
            <h1>DASHBOARD</h1>

            <div>
                <h2>ピン止め</h2>
            </div>

            <div>
                <h2>フィルター</h2>
                {Object.entries(filteredMdTasks).map((fe, i) => {
                    const name = fe[0]
                    const es = fe[1]
                    return (
                        <div key={name}>
                            <h3>
                                <input
                                    type="text"
                                    value={name}
                                    style={{ border: "none" }}
                                    onKeyDown={handleTagnameChange}
                                    data-index={i}
                                />
                            </h3>
                            {es.map((e) => {
                                return <p key={e.id}>{e.value}</p>
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default SampleDashboard
