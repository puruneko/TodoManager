import { useRef } from "react"

//import App from "./App.tsx"
import Calender from "./calendar/calendar"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import { UseMdPropsProviderComponent } from "./store/mdPropsStore"

const App = () => {
    //const appRef = useRef<string>("black")
    return (
        <>
            <UseMdPropsProviderComponent>
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
            </UseMdPropsProviderComponent>
        </>
    )
}

export default App
