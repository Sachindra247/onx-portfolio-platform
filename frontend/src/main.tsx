import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "./components/feedback/ToastProvider";
import { router } from "./app/router";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/events.css";
import { AuthProvider } from "./auth/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
);
