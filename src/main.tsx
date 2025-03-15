import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import Calender from "./calender/calender"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div>
                <p>main.tsx</p>
                <App />
            </div>
            <div style={{ margin: "100px 50px 0 50px", maxWidth: "90vw" }}>
                <Calender />
            </div>
        </div>
    </StrictMode>
)
