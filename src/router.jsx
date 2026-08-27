import React, {
  useEffect,
  useState,
  useContext,
  createContext,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import App from "./App";
import { supabase } from "./supabase";

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "AUTH ERROR:",
            error
          );
        }

        if (!mounted) return;

        const currentSession =
          data?.session || null;

        setSession(currentSession);
        setUser(
          currentSession?.user || null
        );
        setLoading(false);
      } catch (error) {
        console.error(
          "AUTH ERROR:",
          error
        );

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return;

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
        isLoggedIn:
          !!session && !!user,
      }}
    >
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
            location.pathname +
            location.search,
        }}
      />
    );
  }

  return children;
}

/* =========================================================
   PUBLIC ONLY
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
   JOB CATEGORIES
========================================================= */

const JOB_CATEGORIES = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
];

/* =========================================================
   NAVBAR
========================================================= */

function AccountNavbar() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [
    hasNotifications,
    setHasNotifications,
  ] = useState(false);

  const userName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user?.user_metadata
      ?.avatar_url || "";

  const initial =
    userName
      .charAt(0)
      .toUpperCase();

  async function checkNotifications() {
    if (!user?.id) return;

    try {
      const {
        data: myJobs,
        error: jobsError,
      } = await supabase
        .from("jobs")
        .select("id")
        .eq(
          "user_id",
          user.id
        );

      if (jobsError) {
        console.error(
          "NOTIFICATION JOBS ERROR:",
          jobsError
        );

        return;
      }

      const jobIds =
        (myJobs || []).map(
          (job) => job.id
        );

      if (
        jobIds.length === 0
      ) {
        setHasNotifications(
          false
        );

        return;
      }

      const {
        data: applications,
        error:
          applicationsError,
      } = await supabase
        .from(
          "job_applications"
        )
        .select(
          "id, job_id, applicant_id, created_at"
        )
        .in(
          "job_id",
          jobIds
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (applicationsError) {
        console.error(
          "NOTIFICATION APPLICATIONS ERROR:",
          applicationsError
        );

        return;
      }

      const readKey =
        `ideahire_read_notifications_${user.id}`;

      const readIds =
        JSON.parse(
          localStorage.getItem(
            readKey
          ) || "[]"
        );

      const unread =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              application.id
            )
        );

      setHasNotifications(
        unread
      );
    } catch (error) {
      console.error(
        "NOTIFICATION CHECK ERROR:",
        error
      );
    }
  }

  useEffect(() => {
    checkNotifications();

    const interval =
      setInterval(
        checkNotifications,
        10000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [user?.id]);

  async function handleLogout() {
    try {
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
    } catch (error) {
      alert(
        `Nie udało się wylogować: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    }
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

        <Link
          to="/notifications"
          className="notifications-nav-link"
        >
          Powiadomienia

          {hasNotifications && (
            <span className="notification-dot" />
          )}
        </Link>
      </nav>

      <div className="nav-actions">
        <Link
          className="account-mini"
          to="/account"
        >
          <span className="account-mini-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
              />
            ) : (
              initial
            )}
          </span>

          <span className="account-mini-name">
            {userName}
          </span>
        </Link>

        <button
          className="btn btn-dark"
          type="button"
          onClick={
            handleLogout
          }
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

  const location =
    useLocation();

  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    if (
      !authLoading &&
      isLoggedIn
    ) {
      const from =
        location.state?.from;

      if (
        typeof from ===
          "string" &&
        from.startsWith("/")
      ) {
        navigate(from, {
          replace: true,
        });
      }
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
    location.state,
  ]);

  function switchToReset() {
    setMode("reset");
    setMessage("");
    setSuccess(false);
    setPassword("");
  }

  function switchToLogin() {
    setMode("login");
    setMessage("");
    setSuccess(false);
  }

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setSuccess(false);
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
        setMessage(
          `Nie udało się zalogować: ${error.message}`
        );

        return;
      }

      if (
        !data?.user ||
        !data?.session
      ) {
        setMessage(
          "Logowanie nie utworzyło aktywnej sesji."
        );

        return;
      }
    } catch (error) {
      setMessage(
        `Nie udało się zalogować: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setMessage(
        "Wpisz adres e-mail."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        );

      if (error) {
        setMessage(
          `Nie udało się wysłać wiadomości: ${error.message}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Link do resetowania hasła został wysłany na podany adres e-mail."
      );
    } catch (error) {
      setMessage(
        `Nie udało się wysłać wiadomości: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    authLoading ||
    isLoggedIn
  ) {
    return <LoadingScreen />;
  }

  if (mode === "reset") {
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
              Odzyskiwanie konta
            </span>

            <h1>
              Reset hasła
            </h1>

            <p>
              Podaj adres e-mail
              przypisany do Twojego
              konta. Wyślemy Ci link
              do ustawienia nowego
              hasła.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={
              handlePasswordReset
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

            {message && (
              <p
                className={
                  success
                    ? "auth-message"
                    : "auth-error"
                }
              >
                {message}
              </p>
            )}

            <button
              className="btn btn-dark btn-large"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Wysyłanie..."
                : "Wyślij link →"}
            </button>
          </form>

          <p className="auth-footer">
            Pamiętasz hasło?{" "}

            <button
              type="button"
              className="auth-link-button"
              onClick={
                switchToLogin
              }
            >
              Wróć do logowania
            </button>
          </p>
        </div>
      </div>
    );
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
            Zaloguj się do swojego
            konta IdeaHire.
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

          <div className="forgot-password-row">
            <button
              type="button"
              className="auth-link-button"
              onClick={
                switchToReset
              }
            >
              Nie pamiętasz hasła?
            </button>
          </div>

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
   RESET PASSWORD
========================================================= */

function ResetPassword() {
  const navigate =
    useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    passwordAgain,
    setPasswordAgain,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [
    recoveryReady,
    setRecoveryReady,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function prepareRecovery() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const code =
          params.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(
              code
            );

          if (error) {
            if (!mounted) return;

            setMessage(
              "Link do resetowania hasła jest nieprawidłowy lub wygasł."
            );

            setLoading(false);

            return;
          }

          window.history.replaceState(
            {},
            document.title,
            "/reset-password"
          );

          if (!mounted) return;

          setRecoveryReady(true);
          setLoading(false);

          return;
        }

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          if (!mounted) return;

          setMessage(
            "Nie udało się przygotować resetowania hasła."
          );

          setLoading(false);

          return;
        }

        if (data?.session) {
          if (!mounted) return;

          setRecoveryReady(true);
          setLoading(false);

          return;
        }

        if (!mounted) return;

        setMessage(
          "Link do resetowania hasła jest nieprawidłowy, wygasł albo został już wykorzystany."
        );

        setLoading(false);
      } catch (error) {
        if (!mounted) return;

        setMessage(
          `Nie udało się przygotować resetowania hasła: ${
            error?.message ||
            "Nieznany błąd"
          }`
        );

        setLoading(false);
      }
    }

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;

          if (
            event ===
              "PASSWORD_RECOVERY" &&
            session
          ) {
            setRecoveryReady(true);
            setLoading(false);
            setMessage("");
          }
        }
      );

    prepareRecovery();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!recoveryReady) {
      setMessage(
        "Sesja resetowania hasła nie jest aktywna. Otwórz ponownie link z wiadomości e-mail."
      );

      return;
    }

    if (password.length < 6) {
      setMessage(
        "Hasło musi mieć co najmniej 6 znaków."
      );

      return;
    }

    if (
      password !== passwordAgain
    ) {
      setMessage(
        "Hasła nie są takie same."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      if (error) {
        setMessage(
          `Nie udało się zmienić hasła: ${error.message}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Hasło zostało zmienione. Za chwilę przejdziesz do logowania."
      );

      setPassword("");
      setPasswordAgain("");

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);
    } catch (error) {
      setMessage(
        `Nie udało się zmienić hasła: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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
            Odzyskiwanie konta
          </span>

          <h1>
            Ustaw nowe hasło
          </h1>

          <p>
            Wpisz nowe hasło do
            swojego konta.
          </p>
        </div>

        {!recoveryReady ? (
          <>
            {message && (
              <p className="auth-error">
                {message}
              </p>
            )}

            <div className="reset-back-button">
              <Link
                className="btn btn-dark btn-large"
                to="/login"
              >
                Wróć do logowania
              </Link>
            </div>
          </>
        ) : (
          <>
            <form
              className="auth-form"
              onSubmit={
                handleUpdatePassword
              }
            >
              <label>
                Nowe hasło

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Wpisz nowe hasło"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              <label>
                Powtórz nowe hasło

                <input
                  type="password"
                  value={passwordAgain}
                  onChange={(event) =>
                    setPasswordAgain(
                      event.target.value
                    )
                  }
                  placeholder="Wpisz hasło ponownie"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              {message && (
                <p
                  className={
                    success
                      ? "auth-message"
                      : "auth-error"
                  }
                >
                  {message}
                </p>
              )}

              <button
                className="btn btn-dark btn-large"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Zapisywanie..."
                  : "Ustaw nowe hasło →"}
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login">
                Wróć do logowania
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REGISTER
========================================================= */

function Register() {
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

  async function handleRegister(
    event
  ) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            email.trim(),
          password,
          options: {
            data: {
              name:
                name.trim(),
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
      }
    } catch (error) {
      setMessage(
        `Nie udało się utworzyć konta: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    authLoading ||
    isLoggedIn
  ) {
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
            Załóż konto i zacznij
            korzystać z IdeaHire.
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
   AVATAR
========================================================= */

async function resizeAndConvertImage(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        const SIZE = 400;

        const sourceWidth =
          image.naturalWidth;

        const sourceHeight =
          image.naturalHeight;

        if (
          !sourceWidth ||
          !sourceHeight
        ) {
          reject(
            new Error(
              "Zdjęcie ma nieprawidłowe wymiary."
            )
          );

          return;
        }

        const sourceSize =
          Math.min(
            sourceWidth,
            sourceHeight
          );

        const sourceX =
          (sourceWidth -
            sourceSize) /
          2;

        const sourceY =
          (sourceHeight -
            sourceSize) /
          2;

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width = SIZE;
        canvas.height = SIZE;

        const context =
          canvas.getContext(
            "2d"
          );

        if (!context) {
          reject(
            new Error(
              "Przeglądarka nie obsługuje Canvas."
            )
          );

          return;
        }

        context.imageSmoothingEnabled =
          true;

        context.imageSmoothingQuality =
          "high";

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          SIZE,
          SIZE
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Nie udało się skonwertować zdjęcia."
                )
              );

              return;
            }

            resolve(
              new File(
                [blob],
                "avatar.jpg",
                {
                  type:
                    "image/jpeg",
                }
              )
            );
          },
          "image/jpeg",
          0.82
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "Nie udało się odczytać zdjęcia."
          )
        );
      };

      image.src = objectUrl;
    }
  );
}

/* =========================================================
   ACCOUNT
========================================================= */

function Account() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [avatarUrl, setAvatarUrl] =
    useState("");

  const [about, setAbout] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [myJobs, setMyJobs] =
    useState([]);

  const [jobsLoading, setJobsLoading] =
    useState(true);

  useEffect(() => {
    if (!user) return;

    setName(
      user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        ""
    );

    setAvatarUrl(
      user.user_metadata?.avatar_url ||
        ""
    );

    setAbout(
      user.user_metadata?.about ||
        ""
    );
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    async function loadMyJobs() {
      setJobsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("jobs")
        .select(
          "id, user_id, title, description, category, budget, created_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "MY JOBS ERROR:",
          error
        );
      } else {
        setMyJobs(
          data || []
        );
      }

      setJobsLoading(false);
    }

    loadMyJobs();
  }, [user?.id]);

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

async function handleAvatarChange(event) {
  const file = event.target.files?.[0];

  if (!file || !user?.id) {
    return;
  }

  setMessage("");

  try {
    /*
      1. Przygotowanie zdjęcia
    */
    const resizedImage =
      await resizeAndConvertImage(file);

    /*
      2. Unikalna ścieżka użytkownika w Storage
    */
    const filePath =
      `${user.id}/avatar-${Date.now()}.jpg`;

    /*
      3. Upload do Supabase Storage
    */
    const {
      error: uploadError,
    } = await supabase.storage
      .from("avatars")
      .upload(
        filePath,
        resizedImage,
        {
          contentType: "image/jpeg",
          upsert: true,
        }
      );

    if (uploadError) {
      setMessage(
        `Nie udało się przesłać zdjęcia: ${uploadError.message}`
      );

      return;
    }

    /*
      4. Pobranie publicznego URL-a
    */
    const {
      data: publicUrlData,
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl =
      publicUrlData?.publicUrl;

    if (!publicUrl) {
      setMessage(
        "Zdjęcie zostało przesłane, ale nie udało się pobrać jego adresu."
      );

      return;
    }

    /*
      5. NAJWAŻNIEJSZE:
         zapisujemy avatar_url bezpośrednio
         do public.profiles.
    */
    const {
      data: profile,
      error: profileReadError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileReadError) {
      console.error(
        "PROFILE READ ERROR:",
        profileReadError
      );

      setMessage(
        `Zdjęcie przesłane, ale nie udało się znaleźć profilu: ${profileReadError.message}`
      );

      return;
    }

    let profileError = null;

    /*
      6. Jeżeli profil istnieje → UPDATE
    */
    if (profile?.id) {
      const {
        error,
      } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("id", user.id);

      profileError = error;
    }

    /*
      7. Jeżeli profilu nie ma → INSERT
    */
    else {
      const {
        error,
      } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name:
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Użytkownik",
          avatar_url: publicUrl,
          about:
            user.user_metadata?.about ||
            null,
        });

      profileError = error;
    }

    /*
      8. Sprawdzamy błąd zapisu do profiles
    */
    if (profileError) {
      console.error(
        "PROFILE AVATAR UPDATE ERROR:",
        profileError
      );

      setMessage(
        `Zdjęcie przesłane, ale nie udało się zapisać go w profilu: ${profileError.message}`
      );

      return;
    }

    /*
      9. Aktualizujemy również Auth metadata,
         żeby właściciel konta od razu widział nowe zdjęcie.
    */
    const {
      error: metadataError,
    } = await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl,
      },
    });

    if (metadataError) {
      console.error(
        "AUTH AVATAR UPDATE ERROR:",
        metadataError
      );

      /*
        Nie cofamy operacji.
        profiles.avatar_url zostało już zapisane.
      */
    }

    /*
      10. Natychmiastowy podgląd nowego zdjęcia
    */
    setAvatarUrl(publicUrl);

    setMessage(
      "Zdjęcie profilowe zostało zapisane."
    );

    /*
      11. Czyścimy input, żeby można było
          ponownie wybrać ten sam plik.
    */
    if (event.target) {
      event.target.value = "";
    }
  } catch (error) {
    console.error(
      "AVATAR CHANGE ERROR:",
      error
    );

    setMessage(
      `Nie udało się zmienić zdjęcia: ${
        error?.message ||
        "Nieznany błąd"
      }`
    );
  }
}

    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanAbout =
      about.trim();

    if (!cleanName) {
      setMessage(
        "Imię / nazwa nie może być puste."
      );

      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.updateUser(
          {
            data: {
              name:
                cleanName,
              avatar_url:
                avatarUrl ||
                null,
              about:
                cleanAbout ||
                null,
            },
          }
        );

      if (error) {
        setMessage(
          `Nie udało się zapisać profilu: ${error.message}`
        );

        return;
      }

      const {
        error: profileSyncError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: cleanName,
            avatar_url: avatarUrl || null,
            about: cleanAbout || null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileSyncError) {
        setMessage(
          `Profil zapisano, ale nie udało się zsynchronizować profilu publicznego: ${profileSyncError.message}`
        );

        return;
      }

      setName(
        data.user.user_metadata
          ?.name ||
          cleanName
      );

      setAvatarUrl(
        data.user.user_metadata
          ?.avatar_url ||
          ""
      );

      setAbout(
        data.user.user_metadata
          ?.about ||
          ""
      );

      setMessage(
        "Profil został zapisany."
      );
    } catch (error) {
      setMessage(
        `Nie udało się zapisać profilu: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteJob(
    jobId
  ) {
    const confirmed =
      window.confirm(
        "Czy na pewno chcesz usunąć to zlecenie?"
      );

    if (!confirmed) return;

    const {
      error,
    } =
      await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      alert(
        `Nie udało się usunąć zlecenia: ${error.message}`
      );

      return;
    }

    setMyJobs(
      (current) =>
        current.filter(
          (job) =>
            job.id !== jobId
        )
    );
  }

  const displayName =
    name ||
    user.email?.split("@")[0] ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Twoje konto
          </span>

          <h1>
            Mój profil
          </h1>

          <p>
            Zarządzaj swoim
            profilem IdeaHire.
          </p>
        </div>

        <section className="account-card">
          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Zdjęcie profilowe"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-placeholder">
                  {initial}
                </div>
              )}
            </div>

            <div className="profile-info">
              <h2>
                {displayName}
              </h2>

              <p>
                {user.email}
              </p>
            </div>
          </div>

          <form
            className="auth-form account-form"
            onSubmit={handleSave}
          >
            <label>
              Zdjęcie profilowe

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleAvatarChange
                }
                disabled={
                  uploading ||
                  saving
                }
              />

              <small>
                JPG, PNG lub WEBP.
                Zdjęcie zostanie
                automatycznie
                przycięte do
                400 × 400 px.
              </small>
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
              O mnie

              <textarea
                rows="5"
                value={about}
                onChange={(event) =>
                  setAbout(
                    event.target.value
                  )
                }
                maxLength={1000}
                placeholder="Napisz kilka słów o sobie..."
              />

              <small>
                Opis będzie widoczny
                na Twoim profilu.
              </small>
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
              <p className="auth-message">
                {message}
              </p>
            )}

            <button
              className="btn btn-dark btn-large"
              type="submit"
              disabled={
                saving ||
                uploading
              }
            >
              {saving
                ? "Zapisywanie..."
                : "Zapisz zmiany →"}
            </button>
          </form>
        </section>

        <section className="account-card my-jobs-section">
          <span className="section-label">
            Moje zlecenia
          </span>

          <h2>
            Zlecenia, które
            opublikowałeś
          </h2>

          {jobsLoading ? (
            <p>
              Ładowanie zleceń...
            </p>
          ) : myJobs.length ===
            0 ? (
            <p>
              Nie masz jeszcze
              żadnych zleceń.
            </p>
          ) : (
            <div className="jobs-list">
              {myJobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={job.id}
                  >
                    <span className="section-label">
                      {job.category}
                    </span>

                    <h2>
                      {job.title}
                    </h2>

                    <p>
                      Budżet:{" "}
                      <strong>
                        {Number(
                          job.budget ||
                            0
                        ).toLocaleString(
                          "pl-PL"
                        )}{" "}
                        zł
                      </strong>
                    </p>

                    <div className="job-actions">
                      <Link
                        className="btn btn-dark"
                        to={`/edit-job/${job.id}`}
                      >
                        Edytuj
                      </Link>

                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() =>
                          handleDeleteJob(
                            job.id
                          )
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   FIND TALENT
========================================================= */

function FindTalent() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState(
      JOB_CATEGORIES[0]
    );

  const [budget, setBudget] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function handleBudgetChange(
    event
  ) {
    setBudget(
      event.target.value.replace(
        /\D/g,
        ""
      )
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const numericBudget =
      Number(budget);

    if (!cleanTitle) {
      setMessage(
        "Wpisz nazwę zlecenia."
      );

      return;
    }

    if (!cleanDescription) {
      setMessage(
        "Opisz krótko swoje zlecenie."
      );

      return;
    }

    if (
      !budget ||
      !Number.isInteger(
        numericBudget
      ) ||
      numericBudget <= 0
    ) {
      setMessage(
        "Budżet musi być większy od 0."
      );

      return;
    }

    if (!user?.id) {
      setMessage(
        "Twoja sesja wygasła."
      );

      return;
    }

    setSaving(true);

    try {
      /*
       * WAŻNE:
       * NIE DODAJEMY jobs.status.
       */

      const {
        error,
      } =
        await supabase
          .from("jobs")
          .insert({
            user_id:
              user.id,
            title:
              cleanTitle,
            description:
              cleanDescription,
            category,
            budget:
              numericBudget,
          });

      if (error) {
        setMessage(
          `Nie udało się opublikować zlecenia: ${error.message}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Zlecenie zostało opublikowane."
      );

      setTitle("");
      setDescription("");
      setCategory(
        JOB_CATEGORIES[0]
      );
      setBudget("");

      setTimeout(() => {
        navigate("/jobs");
      }, 900);
    } catch (error) {
      setMessage(
        `Nie udało się opublikować zlecenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

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
            Opisz projekt, wybierz
            kategorię i ustaw
            prosty budżet.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={handleSubmit}
        >
          <label>
            Czego potrzebujesz?

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              maxLength={120}
              required
            />
          </label>

          <label>
            Kategoria

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              required
            >
              {JOB_CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Opisz swój projekt

            <textarea
              rows="6"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              maxLength={2000}
              required
            />
          </label>

          <label>
            Budżet (zł)

            <input
              type="text"
              value={budget}
              onChange={
                handleBudgetChange
              }
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Np. 3000"
              maxLength={9}
              required
            />

            <small>
              Cena jest ustalana
              przy publikacji
              zlecenia i nie może
              być później zmieniana.
            </small>
          </label>

          {message && (
            <p
              className={
                success
                  ? "auth-message"
                  : "auth-error"
              }
            >
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Publikowanie..."
              : "Opublikuj zlecenie →"}
          </button>
        </form>
      </main>
    </div>
  );
}

/* =========================================================
   EDIT JOB
========================================================= */

function EditJob() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [job, setJob] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState(
      JOB_CATEGORIES[0]
    );

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!user?.id || !id)
      return;

    async function loadJob() {
      const {
        data,
        error,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, user_id, title, description, category, budget, created_at"
          )
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (error) {
        setMessage(
          `Nie udało się pobrać zlecenia: ${error.message}`
        );

        setLoading(false);

        return;
      }

      setJob(data);
      setTitle(
        data.title || ""
      );
      setDescription(
        data.description || ""
      );
      setCategory(
        data.category ||
          JOB_CATEGORIES[0]
      );

      setLoading(false);
    }

    loadJob();
  }, [id, user?.id]);

  async function handleSave(
    event
  ) {
    event.preventDefault();

    if (
      !job ||
      !user?.id
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      /*
       * BUDŻET NIE JEST
       * AKTUALIZOWANY.
       */

      const {
        error,
      } =
        await supabase
          .from("jobs")
          .update({
            title:
              title.trim(),
            description:
              description.trim(),
            category,
          })
          .eq(
            "id",
            job.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          `Nie udało się zapisać zmian: ${error.message}`
        );

        return;
      }

      navigate(
        "/account",
        {
          replace: true,
        }
      );
    } catch (error) {
      setMessage(
        `Nie udało się zapisać zmian: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!job) {
    return (
      <div className="page">
        <AccountNavbar />

        <main className="app-page">
          <p className="auth-error">
            {message ||
              "Nie znaleziono zlecenia."}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Edycja zlecenia
          </span>

          <h1>
            Edytuj zlecenie
          </h1>

          <p>
            Cena zlecenia
            pozostaje bez zmian.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={handleSave}
        >
          <label>
            Tytuł

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              maxLength={120}
              required
            />
          </label>

          <label>
            Kategoria

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >
              {JOB_CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Opis

            <textarea
              rows="7"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              maxLength={2000}
              required
            />
          </label>

          <div className="fixed-budget-note">
            <strong>
              Budżet:
            </strong>{" "}
            {Number(
              job.budget || 0
            ).toLocaleString(
              "pl-PL"
            )}{" "}
            zł

            <br />

            <small>
              Cena została
              ustalona przy
              publikacji i nie
              może być edytowana.
            </small>
          </div>

          {message && (
            <p className="auth-error">
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
      </main>
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile() {
  const { id } =
    useParams();

  const [profile, setProfile] =
    useState(null);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!id) return;

    async function loadProfile() {
      setLoading(true);

      try {
        const {
          data:
            profileData,
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about, completed_jobs, posted_jobs"
            )
            .eq("id", id)
            .single();

        if (profileError) {
          setMessage(
            `Nie udało się pobrać profilu: ${profileError.message}`
          );

          return;
        }

        setProfile(
          profileData
        );

        const {
          data:
            jobsData,
          error:
            jobsError,
        } =
          await supabase
            .from("jobs")
            .select(
              "id, user_id, title, description, category, budget, created_at"
            )
            .eq(
              "user_id",
              id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (jobsError) {
          console.error(
            "PROFILE JOBS ERROR:",
            jobsError
          );
        } else {
          setJobs(
            jobsData || []
          );
        }
      } catch (error) {
        setMessage(
          `Nie udało się pobrać profilu: ${
            error?.message ||
            "Nieznany błąd"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <div className="page">
        <AccountNavbar />

        <main className="app-page">
          <p className="auth-error">
            {message ||
              "Nie znaleziono profilu."}
          </p>
        </main>
      </div>
    );
  }

  const name =
    profile.name ||
    "Użytkownik";

  const initial =
    name
      .charAt(0)
      .toUpperCase();

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <section className="account-card">
          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {profile.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt={name}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-placeholder">
                  {initial}
                </div>
              )}
            </div>

            <div className="profile-info">
              <h1>
                {name}
              </h1>

              {profile.about && (
                <p>
                  {profile.about}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="account-card profile-jobs-section">
          <span className="section-label">
            Zlecenia
          </span>

          <h2>
            Zlecenia tego
            użytkownika
          </h2>

          {jobs.length ===
          0 ? (
            <p>
              Ten użytkownik
              nie ma jeszcze
              opublikowanych
              zleceń.
            </p>
          ) : (
            <div className="jobs-list">
              {jobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={job.id}
                  >
                    <span className="section-label">
                      {job.category}
                    </span>

                    <h2>
                      {job.title}
                    </h2>

                    <p>
                      Budżet:{" "}
                      <strong>
                        {Number(
                          job.budget ||
                            0
                        ).toLocaleString(
                          "pl-PL"
                        )}{" "}
                        zł
                      </strong>
                    </p>

                    <p>
                      <small>
                        Cena została
                        ustalona przy
                        publikacji.
                      </small>
                    </p>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   JOBS
========================================================= */

function Jobs() {
  const { user } =
    useAuth();

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [openJobId, setOpenJobId] =
    useState(null);

  const [
    applyingJobId,
    setApplyingJobId,
  ] = useState(null);

  const [
    appliedJobIds,
    setAppliedJobIds,
  ] = useState([]);

  /* =======================================================
     NOWE:
     WYSZUKIWANIE
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(
    "Wszystkie"
  );

  async function loadJobs() {
    setLoading(true);
    setMessage("");

    try {
      /*
       * NIE MA jobs.status.
       * Pobieramy tylko kolumny,
       * które faktycznie istnieją.
       */

      const {
        data,
        error,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, user_id, title, description, category, budget, created_at"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(
          "LOAD JOBS ERROR:",
          error
        );

        setMessage(
          `Nie udało się pobrać zleceń: ${error.message}`
        );

        return;
      }

      setJobs(
        data || []
      );

      /*
       * Sprawdzamy, do których
       * zleceń użytkownik już
       * się zgłosił.
       */

      if (user?.id) {
        const {
          data:
            applications,
          error:
            applicationsError,
        } =
          await supabase
            .from(
              "job_applications"
            )
            .select(
              "job_id"
            )
            .eq(
              "applicant_id",
              user.id
            );

        if (
          !applicationsError
        ) {
          setAppliedJobIds(
            (applications || []).map(
              (item) =>
                item.job_id
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "LOAD JOBS ERROR:",
        error
      );

      setMessage(
        `Nie udało się pobrać zleceń: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  function formatBudget(
    value
  ) {
    return `${Number(
      value || 0
    ).toLocaleString(
      "pl-PL"
    )} zł`;
  }

  function formatDate(
    value
  ) {
    if (!value) return "";

    return new Date(
      value
    ).toLocaleDateString(
      "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* =======================================================
     ZGŁOSZENIE DO ZLECENIA
  ======================================================= */

  async function handleApply(
    job
  ) {
    if (!user?.id) {
      alert(
        "Musisz być zalogowany."
      );

      return;
    }

    if (
      user.id ===
      job.user_id
    ) {
      alert(
        "Nie możesz zgłosić się do własnego zlecenia."
      );

      return;
    }

    if (
      appliedJobIds.includes(
        job.id
      )
    ) {
      return;
    }

    setApplyingJobId(
      job.id
    );

    try {
      const {
        data: existing,
        error:
          existingError,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .select("id")
          .eq(
            "job_id",
            job.id
          )
          .eq(
            "applicant_id",
            user.id
          )
          .maybeSingle();

      if (existingError) {
        setMessage(
          `Nie udało się sprawdzić zgłoszenia: ${existingError.message}`
        );

        return;
      }

      if (existing) {
        setAppliedJobIds(
          (current) => [
            ...current,
            job.id,
          ]
        );

        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .insert({
            job_id:
              job.id,
            applicant_id:
              user.id,
          });

      if (error) {
        setMessage(
          `Nie udało się wysłać zgłoszenia: ${error.message}`
        );

        return;
      }

      setAppliedJobIds(
        (current) => [
          ...current,
          job.id,
        ]
      );

      alert(
        "Zgłoszenie zostało wysłane do zleceniodawcy."
      );
    } catch (error) {
      setMessage(
        `Nie udało się wysłać zgłoszenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setApplyingJobId(
        null
      );
    }
  }

  /* =======================================================
     WYSZUKIWANIE
  ======================================================= */

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredJobs =
    jobs.filter(
      (job) => {
        const categoryMatches =
          selectedCategory ===
            "Wszystkie" ||
          job.category ===
            selectedCategory;

        if (
          !categoryMatches
        ) {
          return false;
        }

        if (
          !normalizedSearch
        ) {
          return true;
        }

        const title =
          String(
            job.title || ""
          ).toLowerCase();

        const description =
          String(
            job.description ||
              ""
          ).toLowerCase();

        const category =
          String(
            job.category ||
              ""
          ).toLowerCase();

        return (
          title.includes(
            normalizedSearch
          ) ||
          description.includes(
            normalizedSearch
          ) ||
          category.includes(
            normalizedSearch
          )
        );
      }
    );

  function clearFilters() {
    setSearch("");
    setSelectedCategory(
      "Wszystkie"
    );
  }

  const hasFilters =
    search.trim() !== "" ||
    selectedCategory !==
      "Wszystkie";

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
            Przeglądaj zlecenia
            opublikowane przez
            użytkowników
            IdeaHire.
          </p>
        </div>

        {/* =================================================
            WYSZUKIWARKA
        ================================================= */}

        <section
          className="jobs-search"
          aria-label="Wyszukiwarka zleceń"
        >
          <div className="jobs-search-box">
            <span
              className="jobs-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Czego szukasz?"
              aria-label="Szukaj zleceń"
            />

            {search && (
              <button
                type="button"
                className="jobs-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Wyczyść wyszukiwanie"
              >
                ×
              </button>
            )}
          </div>

          {/* =================================================
              FILTRY KATEGORII
          ================================================= */}

          <div className="jobs-filter-row">
            <button
              type="button"
              className={
                selectedCategory ===
                "Wszystkie"
                  ? "jobs-filter active"
                  : "jobs-filter"
              }
              onClick={() =>
                setSelectedCategory(
                  "Wszystkie"
                )
              }
            >
              Wszystkie
            </button>

            {JOB_CATEGORIES.map(
              (category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    selectedCategory ===
                    category
                      ? "jobs-filter active"
                      : "jobs-filter"
                  }
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                >
                  {category}
                </button>
              )
            )}
          </div>
        </section>

        {/* =================================================
            WYNIKI
        ================================================= */}

        {!loading &&
          !message &&
          jobs.length > 0 && (
            <div className="jobs-results-header">
              <div>
                <strong>
                  {
                    filteredJobs.length
                  }
                </strong>{" "}
                {filteredJobs.length ===
                1
                  ? "zlecenie"
                  : filteredJobs.length >=
                      2 &&
                    filteredJobs.length <=
                      4
                  ? "zlecenia"
                  : "zleceń"}
              </div>

              {hasFilters && (
                <button
                  type="button"
                  className="jobs-clear-filters"
                  onClick={
                    clearFilters
                  }
                >
                  Wyczyść filtry
                </button>
              )}
            </div>
          )}

        {loading && (
          <p>
            Ładowanie zleceń...
          </p>
        )}

        {!loading &&
          message && (
            <p className="auth-error">
              {message}
            </p>
          )}

        {!loading &&
          !message &&
          jobs.length === 0 && (
            <section className="account-card">
              <span className="section-label">
                Brak zleceń
              </span>

              <h2>
                Na razie nie ma
                żadnych zleceń.
              </h2>

              <p>
                Dodaj pierwsze
                zlecenie, aby
                pojawiło się tutaj.
              </p>
            </section>
          )}

        {!loading &&
          !message &&
          jobs.length > 0 &&
          filteredJobs.length ===
            0 && (
            <section className="account-card jobs-empty-search">
              <span className="section-label">
                Brak wyników
              </span>

              <h2>
                Nie znaleźliśmy
                takiego zlecenia.
              </h2>

              <p>
                Spróbuj użyć innej
                frazy albo wybierz
                inną kategorię.
              </p>

              <button
                type="button"
                className="btn btn-dark"
                onClick={
                  clearFilters
                }
              >
                Wyczyść wyszukiwanie →
              </button>
            </section>
          )}

        {/* =================================================
            LISTA ZLECEŃ
        ================================================= */}

        <div className="jobs-list">
          {filteredJobs.map(
            (job) => {
              const isOpen =
                openJobId ===
                job.id;

              const isOwner =
                user?.id ===
                job.user_id;

              const alreadyApplied =
                appliedJobIds.includes(
                  job.id
                );

              return (
                <article
                  className="job-card"
                  key={job.id}
                >
                  <div className="job-card-top">
                    <span className="section-label">
                      {job.category}
                    </span>

                    <span className="job-active-badge">
                      Aktywne
                    </span>
                  </div>

                  <h2>
                    {job.title}
                  </h2>

                  <p>
                    <strong>
                      Budżet:
                    </strong>{" "}
                    {formatBudget(
                      job.budget
                    )}
                  </p>

                  <p>
                    <small>
                      Opublikowano:{" "}
                      {formatDate(
                        job.created_at
                      )}
                    </small>
                  </p>

                  {isOpen && (
                    <div className="job-details">
                      <p>
                        {
                          job.description
                        }
                      </p>

                      <Link
                        to={`/profile/${job.user_id}`}
                        className="btn btn-outline"
                      >
                        Zobacz profil zleceniodawcy →
                      </Link>

                      {!isOwner && (
                        <button
                          className="btn btn-dark"
                          type="button"
                          disabled={
                            applyingJobId ===
                              job.id ||
                            alreadyApplied
                          }
                          onClick={() =>
                            handleApply(
                              job
                            )
                          }
                        >
                          {alreadyApplied
                            ? "Zgłoszono ✓"
                            : applyingJobId ===
                                job.id
                            ? "Wysyłanie..."
                            : "Zgłoś się do zlecenia →"}
                        </button>
                      )}

                      {isOwner && (
                        <p className="job-owner-note">
                          <small>
                            To jest Twoje
                            zlecenie.
                          </small>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="job-actions">
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() =>
                        setOpenJobId(
                          isOpen
                            ? null
                            : job.id
                        )
                      }
                    >
                      {isOpen
                        ? "Ukryj szczegóły ↑"
                        : "Zobacz zlecenie →"}
                    </button>

                    {!isOpen &&
                      !isOwner && (
                        <button
                          className="btn btn-outline"
                          type="button"
                          disabled={
                            applyingJobId ===
                              job.id ||
                            alreadyApplied
                          }
                          onClick={() =>
                            handleApply(
                              job
                            )
                          }
                        >
                          {alreadyApplied
                            ? "Zgłoszono ✓"
                            : applyingJobId ===
                                job.id
                            ? "Wysyłanie..."
                            : "Zgłoś się do zlecenia →"}
                        </button>
                      )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function Notifications() {
  const { user } =
    useAuth();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  async function loadNotifications() {
    if (!user?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const {
        data: myJobs,
        error: jobsError,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, title"
          )
          .eq(
            "user_id",
            user.id
          );

      if (jobsError) {
        setMessage(
          `Nie udało się pobrać powiadomień: ${jobsError.message}`
        );

        return;
      }

      const jobIds =
        (myJobs || []).map(
          (job) => job.id
        );

      if (
        jobIds.length === 0
      ) {
        setNotifications([]);

        return;
      }

      const {
        data: applications,
        error:
          applicationsError,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .select(
            "id, job_id, applicant_id, created_at"
          )
          .in(
            "job_id",
            jobIds
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (applicationsError) {
        setMessage(
          `Nie udało się pobrać zgłoszeń: ${applicationsError.message}`
        );

        return;
      }

      if (
        !applications ||
        applications.length ===
          0
      ) {
        setNotifications([]);

        return;
      }

      const applicantIds = [
        ...new Set(
          applications.map(
            (item) =>
              item.applicant_id
          )
        ),
      ];

      const {
        data: profiles,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, name, avatar_url, about"
          )
          .in(
            "id",
            applicantIds
          );

      const profileMap =
        new Map(
          (profiles || []).map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        );

      const jobMap =
        new Map(
          (myJobs || []).map(
            (job) => [
              job.id,
              job,
            ]
          )
        );

      const result =
        applications.map(
          (application) => ({
            ...application,
            applicant:
              profileMap.get(
                application.applicant_id
              ),
            job:
              jobMap.get(
                application.job_id
              ),
          })
        );

      setNotifications(
        result
      );

      const readKey =
        `ideahire_read_notifications_${user.id}`;

      const readIds =
        result.map(
          (item) =>
            item.id
        );

      localStorage.setItem(
        readKey,
        JSON.stringify(
          readIds
        )
      );
    } catch (error) {
      setMessage(
        `Nie udało się pobrać powiadomień: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  function formatDate(
    value
  ) {
    if (!value) return "";

    return new Date(
      value
    ).toLocaleString(
      "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Skrzynka odbiorcza
          </span>

          <h1>
            Powiadomienia
          </h1>

          <p>
            Tutaj znajdziesz osoby,
            które zgłosiły się do
            Twoich zleceń.
          </p>
        </div>

        {loading && (
          <p>
            Ładowanie powiadomień...
          </p>
        )}

        {!loading &&
          message && (
            <p className="auth-error">
              {message}
            </p>
          )}

        {!loading &&
          !message &&
          notifications.length ===
            0 && (
            <section className="account-card">
              <span className="section-label">
                Skrzynka jest pusta
              </span>

              <h2>
                Nie masz nowych
                zgłoszeń.
              </h2>

              <p>
                Gdy ktoś zgłosi się
                do Twojego zlecenia,
                pojawi się tutaj jego
                profil.
              </p>
            </section>
          )}

        <div className="jobs-list">
          {notifications.map(
            (notification) => {
              const applicant =
                notification.applicant;

              const applicantName =
                applicant?.name ||
                "Użytkownik";

              const initial =
                applicantName
                  .charAt(0)
                  .toUpperCase();

              return (
                <article
                  className="job-card"
                  key={
                    notification.id
                  }
                >
                  <Link
                    to={`/profile/${notification.applicant_id}`}
                    className="notification-person"
                  >
                    <div className="notification-avatar">
                      {applicant?.avatar_url ? (
                        <img
                          src={
                            applicant.avatar_url
                          }
                          alt={
                            applicantName
                          }
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    <div>
                      <strong>
                        {
                          applicantName
                        }
                      </strong>

                      <p>
                        chce wykonać
                        Twoje zlecenie
                      </p>
                    </div>
                  </Link>

                  <div className="notification-job">
                    <span className="section-label">
                      Zlecenie
                    </span>

                    <h2>
                      {
                        notification
                          .job
                          ?.title
                      }
                    </h2>

                    <small>
                      Zgłoszenie:{" "}
                      {formatDate(
                        notification.created_at
                      )}
                    </small>
                  </div>

                  <Link
                    className="btn btn-dark"
                    to={`/profile/${notification.applicant_id}`}
                  >
                    Zobacz profil →
                  </Link>
                </article>
              );
            }
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
  const { loading } =
    useAuth();

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
            path="/reset-password"
            element={
              <ResetPassword />
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
            path="/edit-job/:id"
            element={
              <ProtectedRoute>
                <EditJob />
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
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
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
