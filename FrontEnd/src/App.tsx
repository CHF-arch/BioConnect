// src/App.tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./Pages/LoginPage";
import ThemeButton from "./components/ThemeButton/ThemeButton";
import HomePage from "./Pages/HomePage";

function App() {
  return (
    <>
      <ThemeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
