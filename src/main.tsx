import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
//import App from "./App.tsx"
import Calender from "./calender/calender"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import { UseEventsProviderComponent } from "./sampleTasks"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <UseEventsProviderComponent>
            <div style={{ display: "flex", flexDirection: "column" }}>
                {/*
            <div>
                <p>main.tsx</p>
                <App />
            </div>
            */}
                <div style={{ display: "flex", flexDirection: "row" }}>
                    <div
                        style={{
                            margin: "10px",
                            flexBasis: "20vw",
                        }}
                    >
                        <Texteditor />
                    </div>
                    <div
                        style={{
                            margin: "10px",
                            flexBasis: "65vw",
                            flexGrow: 1,
                        }}
                    >
                        <Calender />
                    </div>
                    <div
                        style={{
                            margin: "10px",
                            flexBasis: "15vw",
                        }}
                    >
                        <Dashboard />
                    </div>
                </div>
            </div>
        </UseEventsProviderComponent>
    </StrictMode>
)
