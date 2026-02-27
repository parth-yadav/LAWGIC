import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./globals.css";
import App from "./App.jsx";
import SessionProvider from "@/providers/SessionProvider";
import { DataProvider } from "@/providers/DataProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { DocumentsProvider } from "@/providers/DocumentsProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <DataProvider>
          <ThemeProvider>
            <DocumentsProvider>
              <App />
            </DocumentsProvider>
          </ThemeProvider>
        </DataProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
