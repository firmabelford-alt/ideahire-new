
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

// ==========================================
// LOGOWANIE
// ==========================================

function Login() {
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error("LOGIN ERROR:", error);

      alert(
        `Nie udało się zalogować: ${error.message}`
      );

      return;
    }

    console.log("LOGIN SUCCESS:", data);
    console.log("LOGGED USER:", data?.user);

    // ==========================================
    // TEST - JEŚLI TO SIĘ POJAWI,
    // LOGOWANIE DZIAŁA I TEN ROUTER JEST UŻYWANY
    // ==========================================

    alert(
      "LOGIN OK — PRZECHODZĘ DO PROFILU"
    );

    navigate("/profile");
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
            Zaloguj się do swojego konta IdeaHire i przejdź
            do swoich projektów.
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
          >
            Zaloguj się →
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

// ==========================================
// REJESTRACJA
// ==========================================

function Register() {
  const navigate = useNavigate();

  async function handleRegister(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

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

    if (error) {
      console.error("SIGNUP ERROR:", error);

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

    console.log(
      "USER CREATED:",
      data.user.id
    );

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
          >
            Utwórz konto →
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

// ==========================================
// PROFIL
// ==========================================

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      console.log("PROFILE PAGE START");

      // Pobieramy zalogowanego użytkownika
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("CURRENT USER:", user);
      console.log("USER ERROR:", userError);

      if (userError || !user) {
        console.error(
          "NO LOGGED USER:",
          userError
        );

        setLoading(false);
        navigate("/login");
        return;
      }

      setUser(user);

      // Pobieramy profil z public.users
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("PROFILE DATA:", data);
      console.log("PROFILE ERROR:", error);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert(
        `Nie udało się wylogować: ${error.message}`
      );

      return;
    }

    navigate("/");
  }

  if (loading) {
    return (
      <div className="page">
        <div className="app-page">
          <h1>Ładowanie profilu...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="app-page">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <Link className="logo" to="/">
            Idea<span>Hire</span>
          </Link>

          <button
            className="btn btn-outline"
            type="button"
            onClick={handleLogout}
          >
            Wyloguj się
          </button>
        </div>

        <div className="app-page-header">
          <span className="section-label">
            Twoje konto
          </span>

          <h1>
            Cześć,{" "}
            {profile?.name ||
              user?.user_metadata?.name ||
              "Użytkowniku"}!
          </h1>

          <p>
            Jesteś zalogowany do IdeaHire.
          </p>
        </div>

        <div className="jobs-list">

          <article className="job-card">
            <span className="section-label">
              Twój profil
            </span>

            <h2>
              {profile?.name ||
                user?.user_metadata?.name ||
                "Brak imienia"}
            </h2>

            <p>
              E-mail: {user?.email}
            </p>

            <p>
              ID: {user?.id}
            </p>

            {profileError && (
              <p>
                Nie udało się pobrać profilu z
                public.users: {profileError}
              </p>
            )}
          </article>

          <article className="job-card">
            <span className="section-label">
              IdeaHire
            </span>

            <h2>
              Co chcesz zrobić?
            </h2>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "20px",
              }}
            >
              <Link
                className="btn btn-dark"
                to="/find-talent"
              >
                Dodaj zlecenie →
              </Link>

              <Link
                className="btn btn-outline"
                to="/jobs"
              >
                Znajdź zlecenie →
              </Link>
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// ZNAJDŹ WYKONAWCĘ
// ==========================================

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

          <h1>Znajdź wykonawcę</h1>

          <p>
            Opisz swój projekt i znajdź osobę,
            która pomoże Ci go zrealizować.
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
            Szukaj wykonawcy →
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// ZLECENIA
// ==========================================

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
            Przeglądaj projekty i znajdź zlecenie
            dopasowane do Twoich umiejętności.
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

// ==========================================
// ROUTER
// ==========================================

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
          path="/profile"
          element={<Profile />}
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
