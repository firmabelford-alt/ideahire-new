
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import App from "./App";
import { supabase } from "./supabase";

/* =========================================================
   KOMPONENT: NAVIGACJA DLA ZALOGOWANEGO UŻYTKOWNIKA
========================================================= */

function AccountNav() {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/");
  }

  return (
    <header className="account-navbar">
      <Link className="logo" to="/">
        Idea<span>Hire</span>
      </Link>

      <div className="account-nav-actions">
        <Link className="btn btn-ghost" to="/account">
          Moje konto
        </Link>

        <button
          className="btn btn-dark"
          type="button"
          onClick={handleLogout}
        >
          Wyloguj się
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   KOMPONENT: LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("LOGIN ERROR:", error);

      alert(`Nie udało się zalogować: ${error.message}`);
      return;
    }

    navigate("/account");
  }

  return (
    <div className="page">
      <div className="auth-card">
        <Link className="logo" to="/">
          Idea<span>Hire</span>
        </Link>

        <div className="auth-header">
          <span className="section-label">
            Witaj ponownie
          </span>

          <h1>Zaloguj się</h1>

          <p>
            Zaloguj się do swojego konta IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
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

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logowanie..."
              : "Zaloguj się →"}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz jeszcze konta?{" "}
          <Link to="/register">
            Utwórz konto
          </Link>
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   KOMPONENT: REGISTER
========================================================= */

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    setLoading(true);

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    setLoading(false);

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    if (error) {
      alert(
        `Nie udało się utworzyć konta: ${error.message}`
      );
      return;
    }

    if (!data?.user) {
      alert(
        "Supabase nie zwrócił użytkownika po rejestracji."
      );
      return;
    }

    alert(
      "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i potwierdź adres."
    );

    navigate("/login");
  }

  return (
    <div className="page">
      <div className="auth-card">
        <Link className="logo" to="/">
          Idea<span>Hire</span>
        </Link>

        <div className="auth-header">
          <span className="section-label">
            Dołącz do IdeaHire
          </span>

          <h1>Utwórz konto</h1>

          <p>
            Załóż swoje konto i zacznij korzystać z IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >
          <label>
            Imię

            <input
              type="text"
              name="name"
              placeholder="Twoje imię"
              required
            />
          </label>

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
              placeholder="Utwórz hasło"
              minLength={6}
              required
            />
          </label>

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Tworzenie konta..."
              : "Utwórz konto →"}
          </button>
        </form>

        <p className="auth-footer">
          Masz już konto?{" "}
          <Link to="/login">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   KOMPONENT: MOJE KONTO
========================================================= */

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    setName(
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      ""
    );

    setAvatar(
      user.user_metadata?.avatar_url || ""
    );

    setLoading(false);
  }

  async function handleSave(event) {
    event.preventDefault();

    setSaving(true);

    const {
      data,
      error,
    } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
        avatar_url: avatar,
      },
    });

    setSaving(false);

    if (error) {
      console.error("PROFILE UPDATE ERROR:", error);

      alert(
        `Nie udało się zapisać profilu: ${error.message}`
      );

      return;
    }

    setUser(data.user);

    alert("Profil został zapisany.");
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Wybierz plik graficzny.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Zdjęcie może mieć maksymalnie 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(reader.result);
    };

    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/");
  }

  if (loading) {
    return (
      <div className="page">
        <AccountNav />

        <div className="app-page">
          <p>Ładowanie konta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <AccountNav />

      <div className="app-page account-page">
        <div className="app-page-header">
          <span className="section-label">
            Twoje konto
          </span>

          <h1>Moje konto</h1>

          <p>
            Zarządzaj swoim profilem i ustawieniami konta.
          </p>
        </div>

        <div className="account-card">
          <div className="profile-preview">
            {avatar ? (
              <img
                src={avatar}
                alt="Zdjęcie profilowe"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}

            <div>
              <h2>
                {name || "Użytkownik"}
              </h2>

              <p>
                {user?.email}
              </p>
            </div>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSave}
          >
            <label>
              Zdjęcie profilowe

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>

            <label>
              Imię / nazwa

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Twoje imię"
                required
              />
            </label>

            <label>
              Adres e-mail

              <input
                type="email"
                value={user?.email || ""}
                disabled
              />
            </label>

            <button
              className="btn btn-dark btn-large"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Zapisywanie..."
                : "Zapisz profil →"}
            </button>
          </form>
        </div>

        <div className="account-actions">
          <Link
            className="btn btn-outline btn-large"
            to="/find-talent"
          >
            Dodaj zlecenie →
          </Link>

          <Link
            className="btn btn-outline btn-large"
            to="/jobs"
          >
            Znajdź zlecenie →
          </Link>
        </div>

        <button
          className="btn btn-ghost"
          type="button"
          onClick={handleLogout}
        >
          Wyloguj się
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   KOMPONENT: FIND TALENT
========================================================= */

function FindTalent() {
  return (
    <div className="page">
      <div className="app-page">
        <Link className="logo" to="/">
          Idea<span>Hire</span>
        </Link>

        <div className="app-page-header">
          <span className="section-label">
            Dla zlecających
          </span>

          <h1>Dodaj zlecenie</h1>

          <p>
            Opisz swój projekt i znajdź osobę, która pomoże
            Ci go zrealizować.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <label>
            Czego potrzebujesz?

            <input
              type="text"
              name="title"
              placeholder="Np. nowoczesna strona internetowa"
              required
            />
          </label>

          <label>
            Opisz swój projekt

            <textarea
              name="description"
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
              rows="6"
              required
            />
          </label>

          <label>
            Budżet

            <input
              type="text"
              name="budget"
              placeholder="Np. 1 500–3 000 zł"
              required
            />
          </label>

          <button
            className="btn btn-dark btn-large"
            type="submit"
          >
            Opublikuj zlecenie →
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   KOMPONENT: JOBS
========================================================= */

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
        <Link className="logo" to="/">
          Idea<span>Hire</span>
        </Link>

        <div className="app-page-header">
          <span className="section-label">
            Dla wykonawców
          </span>

          <h1>Znajdź zlecenie</h1>

          <p>
            Przeglądaj projekty i znajdź zlecenie dopasowane
            do Twoich umiejętności.
          </p>
        </div>

        <div className="jobs-list">
          {jobs.map((job) => (
            <article
              className="job-card"
              key={job.title}
            >
              <span className="section-label">
                {job.category}
              </span>

              <h2>{job.title}</h2>

              <p>
                Budżet: {job.budget}
              </p>

              <button
                className="btn btn-dark"
                type="button"
              >
                Zobacz zlecenie →
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ROUTER
========================================================= */

function Router() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/find-talent"
          element={<FindTalent />}
        />

        <Route
          path="/jobs"
          element={<Jobs />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default Router;
