import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
//import App from "./App.tsx"
import Calender from "./calendar/calendar"
import Dashboard from "./dashboard/dashboard"
import Texteditor from "./texteditor/texteditor"
import { UseCEventsProviderComponent } from "./store/cEventsStore"
import { UseMdPropsProviderComponent } from "./store/mdtextStore"
import App from "./App"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
