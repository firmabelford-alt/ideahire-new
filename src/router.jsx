import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";

function Login() {
  return <h1>Logowanie</h1>;
}

function FindTalent() {
  return (
    <div className="page">
      <div className="app-page">
        <a className="logo" href="/">
          Idea<span>Hire</span>
        </a>

        <div className="app-page-header">
          <span className="section-label">Dla zlecających</span>
          <h1>Znajdź wykonawcę</h1>
          <p>
            Opisz swój projekt i znajdź osobę, która pomoże Ci go zrealizować.
          </p>
        </div>

        <form className="project-form">
          <label>
            Czego potrzebujesz?
            <input
              type="text"
              placeholder="Np. nowoczesna strona internetowa"
            />
          </label>

          <label>
            Opisz swój projekt
            <textarea
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
              rows="6"
            />
          </label>

          <label>
            Budżet
            <input
              type="text"
              placeholder="Np. 1 500–3 000 zł"
            />
          </label>

          <button className="btn btn-dark btn-large" type="submit">
            Szukaj wykonawcy →
          </button>
        </form>
      </div>
    </div>
  );
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
