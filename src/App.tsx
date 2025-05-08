import { useRef } from "react"

import "./index.css"
//import App from "./App.tsx"
import Calender from "./calendar/calendar"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import { UseCEventsProviderComponent } from "./store/cEventsStore"
import { UseMdPropsProviderComponent } from "./store/mdtextStore"
import { UseIcChannelProviderComponent } from "./store/interComponentChannelStore"

const App = () => {
    //const appRef = useRef<string>("black")
    return (
        <>
            <UseMdPropsProviderComponent>
                <UseCEventsProviderComponent>
                    <div style={{ display: "flex", flexDirection: "column" }}>
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
                </UseCEventsProviderComponent>
            </UseMdPropsProviderComponent>
        </>
    )
}

export default App
