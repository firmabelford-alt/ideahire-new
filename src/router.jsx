import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";

function Login() {
  return (
    <div className="page">
      <div className="auth-card">
        <a className="logo" href="/">
          Idea<span>Hire</span>
        </a>

        <div className="auth-header">
          <span className="section-label">Witaj ponownie</span>
          <h1>Zaloguj się</h1>
          <p>
            Zaloguj się do swojego konta IdeaHire i przejdź do swoich projektów.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            Adres e-mail
            <input
              type="email"
              name="email"
              placeholder="twoj@email.com"
              required
            />
          </label>

          <label>
            Hasło
            <input
              type="password"
              name="password"
              placeholder="Wpisz swoje hasło"
              required
            />
          </label>

          <button className="btn btn-dark btn-large" type="submit">
            Zaloguj się →
          </button>
        </form>

        <p className="auth-footer">
          Nie masz jeszcze konta?{" "}
          <a href="/register">Utwórz konto</a>
        </p>
      </div>
    </div>
  );
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
  const jobs = [
    {
      title: "Nowoczesna strona internetowa",
      category: "Programowanie",
      budget: "1 500–3 000 zł",
    },
    {
      title: "Logo dla nowej marki",
      category: "Grafika i design",
      budget: "500–1 000 zł",
    },
    {
      title: "Materiały do social media",
      category: "Marketing",
      budget: "800–1 500 zł",
    },
  ];

  return (
    <div className="page">
      <div className="app-page">
        <a className="logo" href="/">
          Idea<span>Hire</span>
        </a>

        <div className="app-page-header">
          <span className="section-label">Dla wykonawców</span>
          <h1>Znajdź zlecenie</h1>
          <p>
            Przeglądaj projekty i znajdź zlecenie dopasowane do Twoich
            umiejętności.
          </p>
        </div>

        <div className="jobs-list">
          {jobs.map((job) => (
            <article className="job-card" key={job.title}>
              <span className="section-label">{job.category}</span>
              <h2>{job.title}</h2>
              <p>Budżet: {job.budget}</p>

              <button className="btn btn-dark" type="button">
                Zobacz zlecenie →
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
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
