import { memo, useEffect, useRef, useState } from "react"
//
//
//import App from "./App.tsx"
import Calendar from "./calendar/calendar"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import GanttChart from "./gantt/gantt"
//
import {
    Responsive as ResponsiveGridLayout,
    WidthProvider as ResponsiveWidthProvider,
} from "react-grid-layout"
import "./styles.css"
import { isDesktop } from "react-device-detect"
const ResponsiveReactGridLayout = ResponsiveWidthProvider(ResponsiveGridLayout)

import {
    Alert,
    Box,
    Button,
    ButtonGroup,
    Card,
    darkScrollbar,
    Snackbar,
    Typography,
} from "@mui/material"

const availableHandles = ["s", "w", "e", "n", "sw", "nw", "se", "ne"]
const goodLayoutSample = [
    //よさげな既定レイアウト
    {
        x: 0,
        y: 0,
        w: 4,
        h: 5,
        i: "Texteditor",
        resizeHandles: availableHandles,
    },
    { x: 4, y: 0, w: 8, h: 3, i: "Calendar", resizeHandles: availableHandles },
    { x: 0, y: 5, w: 1, h: 1, i: "Dashboard", resizeHandles: availableHandles },
    {
        x: 4,
        y: 3,
        w: 8,
        h: 8,
        i: "GanttChart",
        resizeHandles: availableHandles,
    },
    { x: 5, y: 6, w: 1, h: 1, i: "test", resizeHandles: availableHandles },
]

const defaultLayout = {
    lg: goodLayoutSample,
    //sm: goodLayoutSample,
    //xs: goodLayoutSample,
}

const App = () => {
    const [width, setWidth] = useState(0)
    const [isOpen, setIsopen] = useState(false)
    const [isEnabled, setIsEnabled] = useState<any>({})

    const [layoutState, setLayoutState] = useState<any>({
        className: "layout",
        rowHeight: 30,
        onLayoutChange: function () {},
        cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
        currentBreakpoint: "lg",
        compactType: "vertical",
        mounted: false,
        layout: defaultLayout,
    })

    const boxRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        //save layout
        const storagedLayout = window.localStorage.getItem("layout")
        if (storagedLayout) {
            setLayoutState((ls) => {
                return {
                    ...ls,
                    layout: JSON.parse(storagedLayout),
                }
            })
        }
        //
        setIsEnabled(
            defaultLayout.lg.reduce((dict, x) => {
                dict[x.i] = true
                return dict
            }, {})
        )
        //
        /*
        //何しているのか不明・・・
        function handleResize() {
            setWidth(boxRef.current?.clientWidth ?? 0)
        }
        window.addEventListener("resize", handleResize)
        handleResize()
        return () => window.removeEventListener("resize", handleResize)
        */
    }, [])

    const onBreakpointChange = (breakpoint) => {
        setLayoutState({
            currentBreakpoint: breakpoint,
        })
    }
    const ResponsiveReactGridLayoutContent = memo(
        ({ title, children }: any) => {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        //justifyContent: "space-around",
                        alignItems: "stretch",
                        flexWrap: "nowrap",
                        //rowGap: "10px",
                        backgroundColor: "lightblue",
                        borderRadius: "4px",
                        height: "100%",
                    }}
                >
                    <span
                        style={{
                            cursor: "move",
                            marginLeft: "10px",
                        }}
                        className="draggable grid-header"
                    >
                        {title}
                    </span>
                    <div
                        style={{
                            flexGrow: "1",
                            overflowY: "scroll",
                            backgroundColor: "lightgray",
                            margin: "0 4px 4px 4px",
                        }}
                    >
                        {children}
                    </div>
                </div>
            )
        }
    )

    //const appRef = useRef<string>("black")
    return (
        <>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="h4">React-Grid-Layout sample</Typography>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        paddingRight: "30px",
                    }}
                >
                    <Button
                        sx={{ display: isDesktop ? "block" : "none" }}
                        onClick={() => {
                            window.localStorage.setItem(
                                "layout",
                                JSON.stringify(layoutState.layout)
                            )
                            setIsopen(true)
                        }}
                    >
                        現在のレイアウトを保存する
                    </Button>
                    {Object.keys(isEnabled).map((key) => {
                        return (
                            <Button
                                key={`button_${key}`}
                                variant={
                                    isEnabled[key] ? "contained" : "outlined"
                                }
                                onClick={(e) => {
                                    setIsEnabled((ie) => {
                                        return {
                                            ...ie,
                                            [key]: !ie[key],
                                        }
                                    })
                                }}
                            >
                                {key}
                            </Button>
                        )
                    })}
                </div>
                <div>
                    <ResponsiveReactGridLayout
                        //絶対にroot要素にしない。divで囲む等する。
                        {...layoutState}
                        style={{ backgroundColor: "grey" }}
                        //breakpoints={{ lg: 1140, sm: 580, xs: 0 }}
                        //cols={{ lg: 12, sm: 9, xs: 3 }}
                        //margin={{ lg: [10, 10], md: [8, 8], xs: [5, 5] }}
                        //width={width}
                        //rowHeight={500}
                        containerPadding={[34, 20]}
                        isDraggable={isDesktop}
                        draggableHandle=".draggable"
                        layouts={layoutState.layout}
                        //isResizable={true}
                        allowOverlap={true}
                        onLayoutChange={(_curent, all) => {
                            setLayoutState((ls) => {
                                return {
                                    ...ls,
                                    layout: all,
                                }
                            })
                        }}
                        // WidthProvider option
                        measureBeforeMount={false}
                        compactType={"vertical"}
                        preventCollision={false}
                        onBreakpointChange={onBreakpointChange}
                    >
                        <div
                            key="Texteditor"
                            style={{
                                display: isEnabled["Texteditor"]
                                    ? undefined
                                    : "none",
                            }}
                        >
                            <ResponsiveReactGridLayoutContent title="Texteditor">
                                <Texteditor />
                            </ResponsiveReactGridLayoutContent>
                        </div>

                        <div
                            key="Calendar"
                            style={{
                                display: isEnabled["Calendar"]
                                    ? undefined
                                    : "none",
                            }}
                        >
                            <ResponsiveReactGridLayoutContent title="Calendar">
                                <Calendar />
                            </ResponsiveReactGridLayoutContent>
                        </div>

                        <Card
                            key="Dashboard"
                            style={{
                                display: isEnabled["Dashboard"]
                                    ? undefined
                                    : "none",
                            }}
                        >
                            <Box margin={1}>
                                <Typography
                                    style={{ cursor: "move" }}
                                    className="draggable"
                                >
                                    <Dashboard />
                                </Typography>
                            </Box>
                        </Card>

                        <div
                            key="GanttChart"
                            style={{
                                display: isEnabled["GanttChart"]
                                    ? undefined
                                    : "none",
                            }}
                        >
                            <ResponsiveReactGridLayoutContent title="GanttChart">
                                <GanttChart />
                            </ResponsiveReactGridLayoutContent>
                        </div>

                        <div
                            //keyで判別。keyを指定した要素はResponsiveReactGridLayoutの直下に
                            key="test"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                //justifyContent: "space-around",
                                alignItems: "stretch",
                                flexWrap: "nowrap",
                                //rowGap: "10px",
                                backgroundColor: "lightblue",
                                borderRadius: "4px",
                            }}
                        >
                            <span
                                style={{
                                    cursor: "move",
                                    width: "100%",
                                    marginLeft: "10px",
                                }}
                                className="draggable grid-header"
                            >
                                TEST
                            </span>
                            <div
                                style={{
                                    overflowY: "scroll",
                                    backgroundColor: "lightgray",
                                    margin: "0 4px 4px 4px",
                                }}
                            >
                                This is test area.
                            </div>
                        </div>
                    </ResponsiveReactGridLayout>
                </div>
            </div>
        </>
    )
}

export default App

const comment = `
<div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                            }}
                        >
                            <div
                                style={{
                                    margin: "10px",
                                    flexBasis: "30vw",
                                }}
                            >
                                <Texteditor />
                            </div>
                            <div
                                style={{
                                    margin: "10px",
                                    flexBasis: "60vw",
                                    flexGrow: 1,
                                }}
                            >
                                <Calender />
                            </div>
                            <div
                                style={{
                                    margin: "10px",
                                    flexBasis: "10vw",
                                }}
                            >
                                <Dashboard />
                            </div>
                        </div>
                    </div>
                    <div>
                        <GanttChart />
                    </div>
                </div>
`
