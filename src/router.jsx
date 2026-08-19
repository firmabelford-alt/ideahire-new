
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import App from "./App";
import { supabase } from "./supabase";

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error("GET SESSION ERROR:", error);
        }

        if (!mounted) return;

        const currentSession = data?.session || null;

        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      } catch (error) {
        console.error("SESSION LOAD ERROR:", error);

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession || null);
        setUser(newSession?.user || null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isLoggedIn: !!session && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return React.useContext(AuthContext);
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div className="page">
      <div className="auth-card">
        <div className="logo">
          Idea<span>Hire</span>
        </div>

        <p>Ładowanie...</p>
      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const { loading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

/* =========================================================
   PUBLIC ONLY
========================================================= */

function PublicOnlyRoute({ children }) {
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

/* =========================================================
   NAVBAR
========================================================= */

function AccountNavbar() {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert(
        `Nie udało się wylogować: ${error.message}`
      );

      return;
    }

    navigate("/", {
      replace: true,
    });
  }

  return (
    <header className="navbar">
      <Link className="logo" to="/">
        Idea<span>Hire</span>
      </Link>

      <nav className="nav-links">
        <Link to="/account">
          Moje konto
        </Link>

        <Link to="/find-talent">
          Dodaj zlecenie
        </Link>

        <Link to="/jobs">
          Znajdź zlecenie
        </Link>
      </nav>

      <div className="nav-actions">
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
   LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setMessage(
          `Nie udało się zalogować: ${error.message}`
        );
        return;
      }

      if (!data?.session || !data?.user) {
        setMessage(
          "Logowanie nie utworzyło aktywnej sesji."
        );
        return;
      }

      navigate("/account", {
        replace: true,
      });
    } catch (error) {
      setMessage(
        `Nie udało się zalogować: ${
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || isLoggedIn) {
    return <LoadingScreen />;
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
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="twoj@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Hasło

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Wpisz swoje hasło"
              autoComplete="current-password"
              required
            />
          </label>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

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
   REGISTER
========================================================= */

function Register() {
  const navigate = useNavigate();

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
            },
          },
        });

      if (error) {
        setMessage(
          `Nie udało się utworzyć konta: ${error.message}`
        );
        return;
      }

      if (!data?.user) {
        setMessage(
          "Supabase nie zwrócił użytkownika."
        );
        return;
      }

      if (!data.session) {
        alert(
          "Konto zostało utworzone. Sprawdź e-mail i potwierdź adres."
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      navigate("/account", {
        replace: true,
      });
    } catch (error) {
      setMessage(
        `Nie udało się utworzyć konta: ${
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || isLoggedIn) {
    return <LoadingScreen />;
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
            Załóż konto i zacznij korzystać z IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >
          <label>
            Imię / nazwa

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Twoje imię"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Adres e-mail

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="twoj@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Hasło

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Utwórz hasło"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

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
   ACCOUNT — CZYSTA WERSJA
========================================================= */

function Account() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Twoje konto
          </span>

          <h1>
            Moje konto
          </h1>

          <p>
            To jest podstawowy widok konta.
          </p>
        </div>

        <section className="account-card">
          <div className="profile-info">
            <h2>
              Konto IdeaHire
            </h2>

            <p>
              {user.email}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   FIND TALENT
========================================================= */

function FindTalent() {
  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Dla zlecających
          </span>

          <h1>
            Dodaj zlecenie
          </h1>

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
              placeholder="Np. nowoczesna strona internetowa"
              required
            />
          </label>

          <label>
            Opisz swój projekt

            <textarea
              rows="6"
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
              required
            />
          </label>

          <label>
            Budżet

            <input
              type="text"
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
      </main>
    </div>
  );
}

/* =========================================================
   JOBS
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
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Dla wykonawców
          </span>

          <h1>
            Znajdź zlecenie
          </h1>

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

              <h2>
                {job.title}
              </h2>

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
      </main>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <App />;
}

/* =========================================================
   ROUTER
========================================================= */

function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          <Route
            path="/find-talent"
            element={
              <ProtectedRoute>
                <FindTalent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;

