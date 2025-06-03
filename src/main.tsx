import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

import { UseMdPropsProviderComponent } from "./store/mdPropsStore"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <UseMdPropsProviderComponent>
            <App />
        </UseMdPropsProviderComponent>
    </StrictMode>
)
