// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './Pages/LoginPage.tsx';
import ThemeButton from './components/ThemeButton/ThemeButton.tsx';
import Home from './components/Home/Home.tsx';

function App() {
  return (
    <>
      <ThemeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;