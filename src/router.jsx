import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";

function Login() {
  return <h1>Logowanie</h1>;
}

function FindTalent() {
  return <h1>Znajdź wykonawcę</h1>;
}

function Jobs() {
  return <h1>Znajdź zlecenie</h1>;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/find-talent" element={<FindTalent />} />
        <Route path="/jobs" element={<Jobs />} />
      </Routes>
    </BrowserRouter>
  );
}
