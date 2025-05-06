import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
//import App from "./App.tsx"
import Calender from "./calendar/calendar"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import { UseCEventsProviderComponent } from "./store/cEventsStore"
import { UseMdPropsProviderComponent } from "./store/mdtextStore"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <UseMdPropsProviderComponent>
            <UseCEventsProviderComponent>
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
            </UseCEventsProviderComponent>
        </UseMdPropsProviderComponent>
    </StrictMode>
)
