
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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
   Jedno źródło prawdy dla całej aplikacji.
========================================================= */

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "SUPABASE GET SESSION ERROR:",
            error
          );
        }

        if (!active) return;

        const currentSession =
          data?.session || null;

        setSession(currentSession);
        setUser(
          currentSession?.user || null
        );
        setLoading(false);
      } catch (error) {
        console.error(
          "AUTH INITIALIZATION ERROR:",
          error
        );

        if (!active) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!active) return;

        console.log(
          "AUTH EVENT:",
          event
        );

        setSession(
          newSession || null
        );

        setUser(
          newSession?.user || null
        );

        setLoading(false);
      }
    );

    return () => {
      active = false;

      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    isLoggedIn:
      Boolean(session) &&
      Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div className="page">
      <div className="auth-card">
        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>

        <p>
          Ładowanie...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({
  children,
}) {
  const {
    loading,
    isLoggedIn,
  } = useAuth();

  const location =
    useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return children;
}

/* =========================================================
   PUBLIC ONLY ROUTE
   Jeżeli ktoś jest już zalogowany,
   nie pokazujemy mu ponownie loginu.
========================================================= */

function PublicOnlyRoute({
  children,
}) {
  const {
    loading,
    isLoggedIn,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   NAVBAR ZALOGOWANEGO UŻYTKOWNIKA
========================================================= */

function AccountNavbar() {
  const {
    user,
  } = useAuth();

  const navigate =
    useNavigate();

  const name =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  async function handleLogout() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

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
      <Link
        className="logo"
        to="/"
      >
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
        <Link
          className="btn btn-ghost"
          to="/account"
        >
          {name}
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
   LOGIN
========================================================= */

function Login() {
  const navigate =
    useNavigate();

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (
      !authLoading &&
      isLoggedIn
    ) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email.trim(),
            password,
          }
        );

      if (error) {
        console.error(
          "LOGIN ERROR:",
          error
        );

        setErrorMessage(
          `Nie udało się zalogować: ${error.message}`
        );

        return;
      }

      if (
        !data?.session ||
        !data?.user
      ) {
        setErrorMessage(
          "Logowanie zakończyło się bez aktywnej sesji."
        );

        return;
      }

      console.log(
        "LOGIN SUCCESS:",
        data.user.id
      );

      /*
        Supabase posiada już sesję.
        Przechodzimy bezpośrednio do konta.
      */

      navigate("/account", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "LOGIN EXCEPTION:",
        error
      );

      setErrorMessage(
        "Wystąpił nieoczekiwany błąd podczas logowania."
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className="page">
      <div className="auth-card">
        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>

        <div className="auth-header">
          <span className="section-label">
            Witaj ponownie
          </span>

          <h1>
            Zaloguj się
          </h1>

          <p>
            Zaloguj się do swojego konta IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={
            handleLogin
          }
        >
          <label>
            Adres e-mail

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
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
                setPassword(
                  event.target.value
                )
              }
              placeholder="Wpisz swoje hasło"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage && (
            <p className="auth-error">
              {errorMessage}
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
  const navigate =
    useNavigate();

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (
      !authLoading &&
      isLoggedIn
    ) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleRegister(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email.trim(),
            password,
            options: {
              data: {
                name:
                  name.trim(),
              },
            },
          }
        );

      if (error) {
        console.error(
          "REGISTER ERROR:",
          error
        );

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

      console.log(
        "REGISTER SUCCESS:",
        data.user.id
      );

      /*
        Jeśli e-mail confirmation jest włączone,
        data.session będzie null.
      */

      if (!data.session) {
        alert(
          "Konto zostało utworzone. Sprawdź skrzynkę e-mail i potwierdź adres."
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
      console.error(
        "REGISTER EXCEPTION:",
        error
      );

      setMessage(
        "Wystąpił nieoczekiwany błąd podczas rejestracji."
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className="page">
      <div className="auth-card">
        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>

        <div className="auth-header">
          <span className="section-label">
            Dołącz do IdeaHire
          </span>

          <h1>
            Utwórz konto
          </h1>

          <p>
            Załóż konto i zacznij korzystać z IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={
            handleRegister
          }
        >
          <label>
            Imię / nazwa

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
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
                setEmail(
                  event.target.value
                )
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
                setPassword(
                  event.target.value
                )
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
   ACCOUNT
========================================================= */

function Account() {
  const {
    user,
    loading,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [avatar, setAvatar] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!user) return;

    setName(
      user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        ""
    );

    setAvatar(
      user.user_metadata
        ?.avatar_url || ""
    );
  }, [user]);

  if (loading) {
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

  const displayName =
    name ||
    user.email?.split("@")[0] ||
    "Użytkownik";

  async function handleSave(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const {
      data,
      error,
    } =
      await supabase.auth.updateUser(
        {
          data: {
            name:
              name.trim(),
            avatar_url:
              avatar,
          },
        }
      );

    if (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      setMessage(
        `Nie udało się zapisać profilu: ${error.message}`
      );

      setSaving(false);
      return;
    }

    console.log(
      "PROFILE UPDATED:",
      data?.user?.id
    );

    setMessage(
      "Profil został zapisany."
    );

    setSaving(false);
  }

  function handleAvatarChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Wybierz plik graficzny."
      );

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      alert(
        "Zdjęcie może mieć maksymalnie 2 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setAvatar(
        String(
          reader.result
        )
      );
    };

    reader.readAsDataURL(
      file
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
            {displayName}
          </h1>

          <p>
            Zarządzaj swoim profilem i korzystaj z platformy IdeaHire.
          </p>
        </div>

        <section className="account-card">
          <div className="profile-preview">
            {avatar ? (
              <img
                src={avatar}
                alt="Zdjęcie profilowe"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <h2>
                {displayName}
              </h2>

              <p>
                {user.email}
              </p>
            </div>
          </div>

          <form
            className="auth-form"
            onSubmit={
              handleSave
            }
          >
            <label>
              Zdjęcie profilowe

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleAvatarChange
                }
              />
            </label>

            <label>
              Imię / nazwa

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                value={
                  user.email || ""
                }
                disabled
              />
            </label>

            {message && (
              <p>
                {message}
              </p>
            )}

            <button
              className="btn btn-dark btn-large"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Zapisywanie..."
                : "Zapisz zmiany →"}
            </button>
          </form>
        </section>

        <section className="account-actions">
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
            Opisz swój projekt i znajdź osobę, która pomoże Ci go zrealizować.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={(event) => {
            event.preventDefault();

            alert(
              "Formularz jest gotowy. Następnym krokiem będzie zapis zlecenia do Supabase."
            );
          }}
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
              rows="6"
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
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
      title:
        "Nowoczesna strona internetowa",
      category:
        "Programowanie",
      budget:
        "1 500–3 000 zł",
    },
    {
      title:
        "Logo dla nowej marki",
      category:
        "Grafika i design",
      budget:
        "500–1 000 zł",
    },
    {
      title:
        "Materiały do social media",
      category:
        "Marketing",
      budget:
        "800–1 500 zł",
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
            Przeglądaj projekty i znajdź zlecenie dopasowane do Twoich umiejętności.
          </p>
        </div>

        <div className="jobs-list">
          {jobs.map(
            (job) => (
              <article
                className="job-card"
                key={
                  job.title
                }
              >
                <span className="section-label">
                  {
                    job.category
                  }
                </span>

                <h2>
                  {
                    job.title
                  }
                </h2>

                <p>
                  Budżet:{" "}
                  {
                    job.budget
                  }
                </p>

                <button
                  className="btn btn-dark"
                  type="button"
                >
                  Zobacz zlecenie →
                </button>
              </article>
            )
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
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

          {/* STRONA GŁÓWNA */}

          <Route
            path="/"
            element={
              <Home />
            }
          />

          {/* LOGOWANIE */}

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          {/* REJESTRACJA */}

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* KONTO */}

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          {/* DODAJ ZLECENIE */}

          <Route
            path="/find-talent"
            element={
              <ProtectedRoute>
                <FindTalent />
              </ProtectedRoute>
            }
          />

          {/* ZNAJDŹ ZLECENIE */}

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}

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
