import { useEffect, useRef, useState } from "react"
//
//
//import App from "./App.tsx"
import Calendar from "./calendar/calendar"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import GanttChart from "./gantt/gantt"
import { UseMdPropsProviderComponent } from "./store/mdPropsStore"
//
import {
    Responsive as ResponsiveGridLayout,
    WidthProvider as ResponsiveWidthProvider,
} from "react-grid-layout"
import "./styles.css"
import { isDesktop } from "react-device-detect"
const ResponsiveReactGridLayout = ResponsiveWidthProvider(ResponsiveGridLayout)

import { Alert, Box, Button, Card, Snackbar, Typography } from "@mui/material"

const defaultLayout: ReactGridLayout.Layouts = {
    lg: [
        { x: 0, y: 0, w: 4, h: 4, i: "a" },
        { x: 8, y: 0, w: 4, h: 4, i: "b" },
        { x: 8, y: 0, w: 4, h: 4, i: "c" },
        { x: 0, y: 0, w: 4, h: 4, i: "d" },
        { x: 8, y: 0, w: 4, h: 4, i: "e" },
    ],
    /*
    sm: [
        { x: 0, y: 0, w: 6, h: 2, i: "a" },
        { x: 6, y: 0, w: 3, h: 1, i: "b" },
        { x: 6, y: 0, w: 3, h: 1, i: "c" },
        { x: 0, y: 3, w: 6, h: 1, i: "d" },
        { x: 6, y: 0, w: 3, h: 1, i: "e" },
    ],
    xs: [
        { x: 0, y: 0, w: 3, h: 1, i: "a" },
        { x: 1, y: 0, w: 3, h: 1, i: "b" },
        { x: 2, y: 0, w: 3, h: 1, i: "c" },
        { x: 3, y: 0, w: 3, h: 1, i: "d" },
        { x: 4, y: 0, w: 4, h: 1, i: "e" },
    ],*/
}

const App = () => {
    const [width, setWidth] = useState(0)
    const [isOpen, setIsopen] = useState(false)

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
        /*
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
    const ResponsiveReactGridLayoutContent = ({ title, children }) => {
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

    //const appRef = useRef<string>("black")
    return (
        <>
            <UseMdPropsProviderComponent>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="h3">
                        React-Grid-Layout sample
                    </Typography>
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
                    <div>
                        <ResponsiveReactGridLayout
                            {...layoutState}
                            style={{ backgroundColor: "grey" }}
                            breakpoints={{ lg: 1140, sm: 580, xs: 0 }}
                            //cols={{ lg: 12, sm: 9, xs: 3 }}
                            //margin={{ lg: [10, 10], md: [8, 8], xs: [5, 5] }}
                            width={width}
                            //rowHeight={500}
                            containerPadding={[34, 20]}
                            isDraggable={isDesktop}
                            draggableHandle=".draggable"
                            layouts={layoutState.layout}
                            isResizable={!false}
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
                                key="a"
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
                                    TextEditor
                                </span>
                                <div
                                    style={{
                                        overflowY: "scroll",
                                        backgroundColor: "lightgray",
                                        margin: "0 4px 4px 4px",
                                    }}
                                >
                                    <Texteditor />
                                </div>
                            </div>

                            <div key="b">
                                <ResponsiveReactGridLayoutContent title="Calender">
                                    <Calendar />
                                </ResponsiveReactGridLayoutContent>
                            </div>

                            <Card key="c">
                                <Box margin={1}>
                                    <Typography
                                        style={{ cursor: "move" }}
                                        className="draggable"
                                    >
                                        <Dashboard />
                                    </Typography>
                                    <Button onClick={() => alert("ts")}>
                                        テスト
                                    </Button>
                                </Box>
                            </Card>
                            <Card key="d">
                                <Box margin={1}>
                                    <Typography
                                        style={{ cursor: "move" }}
                                        className="draggable"
                                    >
                                        <GanttChart />
                                    </Typography>
                                    <Button onClick={() => alert("ts")}>
                                        テスト
                                    </Button>
                                </Box>
                            </Card>
                            <Card key="e">
                                <Box margin={1}>
                                    <Typography
                                        style={{ cursor: "move" }}
                                        className="draggable"
                                    >
                                        E
                                    </Typography>
                                    <Button onClick={() => alert("ts")}>
                                        テスト
                                    </Button>
                                </Box>
                            </Card>
                        </ResponsiveReactGridLayout>
                        <Snackbar
                            open={isOpen}
                            autoHideDuration={3000}
                            onClose={() => setIsopen(false)}
                        >
                            <Alert
                                onClose={() => setIsopen(false)}
                                severity="success"
                                sx={{ width: "100%" }}
                            >
                                This is a success message!
                            </Alert>
                        </Snackbar>
                    </div>
                </div>
            </UseMdPropsProviderComponent>
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
