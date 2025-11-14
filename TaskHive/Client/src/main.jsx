import { StrictMode, createContext, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerLicense } from "@syncfusion/ej2-base";

// Syncfusion styles - Vite automatically resolves from node_modules
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";
import "@syncfusion/ej2-react-kanban/styles/material.css";

// Register Syncfusion license - Community License (FREE)
// Licensed for Essential Studio Enterprise Edition 31.x.x
registerLicense(
  "Ngo9BigBOggjGyl/Vkd+XU9FcVRDX3xIfEx0RWFcb1d6dlJMY19BNQtUQF1hTH9Sd0djUHxbdXRdRGZdWkd3"
);

export const Context = createContext({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <Context.Provider
      value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      <App />
    </Context.Provider>
  );
};
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);
