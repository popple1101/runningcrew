import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Protected from "./routes/Protected";
import Main from "../src/components/Main";
import AppPage from "./pages/AppPage";
import "../src/components/main.css";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route
            path="/app"
            element={
              <Protected>
                <AppPage />
              </Protected>
            }
          />
          <Route path="*" element={<Main />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
