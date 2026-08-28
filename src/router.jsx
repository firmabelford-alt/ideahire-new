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
import Sorts, {
  CountryPicker,
  CountryBadge,
  getCountryByCode,
  saveUserCountry,
  ApplicationActions,
} from "./Sorts";
import {
  passwordRecoveryRequested,
  supabase,
} from "./supabase";
import {
  getLoginErrorMessage,
  getPasswordRecoveryRedirectUrl,
  normalizeEmail,
} from "./auth";

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
    let subscription = null;

    function applySession(newSession) {
      if (!mounted) return;

      setSession(newSession || null);
      setUser(newSession?.user || null);
      setLoading(false);
    }

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

        applySession(
          data?.session || null
        );

        const {
          data: {
            subscription:
              authSubscription,
          },
        } =
          supabase.auth.onAuthStateChange(
            (event, newSession) => {
              if (!mounted) return;

              /*
               * Stan początkowy został już pobrany przez getSession().
               * Ignorujemy powtórne INITIAL_SESSION, ponieważ na części
               * przeglądarek potrafi ono chwilowo zwrócić null i wyrzucić
               * użytkownika z chronionej podstrony.
               */
              if (
                event ===
                "INITIAL_SESSION"
              ) {
                return;
              }

              if (
                event === "SIGNED_OUT"
              ) {
                applySession(null);
                return;
              }

              if (newSession) {
                applySession(
                  newSession
                );
              }
            }
          );

        subscription =
          authSubscription;
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

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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

function getStoredNotificationIds(
  key
) {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) ||
        "[]"
    );

    return Array.isArray(value)
      ? value.filter(
          (item) =>
            typeof item ===
            "string"
        )
      : [];
  } catch {
    return [];
  }
}

function saveNotificationIds(
  key,
  ids
) {
  localStorage.setItem(
    key,
    JSON.stringify([
      ...new Set(ids),
    ])
  );
}

function announceNotificationsRead(
  userId
) {
  window.dispatchEvent(
    new CustomEvent(
      "ideahire:notifications-read",
      {
        detail: {
          userId,
        },
      }
    )
  );
}

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

      let applications = [];

      if (jobIds.length > 0) {
        const {
          data,
          error:
            applicationsError,
        } = await supabase
          .from(
            "job_applications"
          )
          .select(
            "id, job_id, applicant_id, status, created_at"
          )
          .in(
            "job_id",
            jobIds
          )
          .eq(
            "status",
            "pending"
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

        applications =
          data || [];
      }

      const {
        data: rejectedApplications,
        error: rejectedApplicationsError,
      } = await supabase
        .from("job_applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("status", "rejected");

      const {
        data: acceptedApplications,
        error: acceptedApplicationsError,
      } = await supabase
        .from("job_applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("status", "accepted");

      if (rejectedApplicationsError) {
        console.error(
          "REJECTED APPLICATION NOTIFICATION ERROR:",
          rejectedApplicationsError
        );
      }

      if (acceptedApplicationsError) {
        console.error(
          "ACCEPTED APPLICATION NOTIFICATION ERROR:",
          acceptedApplicationsError
        );
      }

      const readKey =
        `ideahire_read_notifications_${user.id}`;

      const readIds =
        getStoredNotificationIds(
          readKey
        );

      const unreadIncoming =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              `incoming:${application.id}`
            )
        );

      const unreadRejected =
        (rejectedApplications || []).some(
          (application) =>
            !readIds.includes(
              `rejected:${application.id}`
            )
        );

      const unreadAccepted =
        (acceptedApplications || []).some(
          (application) =>
            !readIds.includes(
              `accepted:${application.id}`
            )
        );

      setHasNotifications(
        unreadIncoming ||
        unreadRejected ||
        unreadAccepted
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

    function handleNotificationsRead(
      event
    ) {
      if (
        !event?.detail?.userId ||
        event.detail.userId ===
          user?.id
      ) {
        setHasNotifications(false);
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
          `ideahire_read_notifications_${user?.id}` ||
        event.key ===
          `ideahire_dismissed_notifications_${user?.id}`
      ) {
        checkNotifications();
      }
    }

    window.addEventListener(
      "ideahire:notifications-read",
      handleNotificationsRead
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval =
      setInterval(
        checkNotifications,
        10000
      );

    return () => {
      clearInterval(
        interval
      );

      window.removeEventListener(
        "ideahire:notifications-read",
        handleNotificationsRead
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
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

        <Link to="/messages">
          Wiadomości
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
              normalizeEmail(email),
            password,
          }
        );

      if (error) {
        setMessage(
          getLoginErrorMessage(error)
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

      const from =
        location.state?.from;

      navigate(
        typeof from === "string" &&
          from.startsWith("/")
          ? from
          : "/account",
        {
          replace: true,
        }
      );
    } catch (error) {
      setMessage(
        getLoginErrorMessage(error)
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
      normalizeEmail(email);

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
              getPasswordRecoveryRedirectUrl(
                window.location.origin
              ),
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
    let recoveryResolved = false;
    let failureTimer = null;

    function markRecoveryReady() {
      if (!mounted) return;

      recoveryResolved = true;

      if (failureTimer) {
        window.clearTimeout(
          failureTimer
        );
      }

      window.history.replaceState(
        {},
        document.title,
        getPasswordRecoveryRedirectUrl(
          window.location.origin
        )
      );

      setRecoveryReady(true);
      setMessage("");
      setLoading(false);
    }

    function showRecoveryError(error) {
      if (!mounted) return;

      console.error(
        "PASSWORD RECOVERY ERROR:",
        error
      );

      setMessage(
        `Nie udało się aktywować resetowania hasła: ${
          error?.message ||
          "Link jest nieprawidłowy albo wygasł."
        }`
      );
      setLoading(false);
    }

    function scheduleMissingSessionError() {
      failureTimer = window.setTimeout(
        () => {
          if (
            !mounted ||
            recoveryResolved
          ) {
            return;
          }

          setMessage(
            "Nie udało się aktywować linku resetującego. Poproś o nowy link i otwórz najnowszą wiadomość."
          );
          setLoading(false);
        },
        3000
      );
    }

    async function prepareRecovery() {
      try {
        const searchParams =
          new URLSearchParams(
            window.location.search
          );

        const hashParams =
          new URLSearchParams(
            window.location.hash.replace(
              /^#/,
              ""
            )
          );

        const tokenHash =
          searchParams.get(
            "token_hash"
          );

        const type =
          searchParams.get("type");

        const callbackError =
          searchParams.get(
            "error_description"
          ) ||
          hashParams.get(
            "error_description"
          );

        if (callbackError) {
          throw new Error(
            callbackError.replace(
              /\+/g,
              " "
            )
          );
        }

        /*
         * 1. Link oparty o token_hash.
         * Ten wariant jest odporny na otwarcie linku
         * z klienta pocztowego / innej karty.
         */
        if (
          tokenHash &&
          type === "recovery"
        ) {
          const {
            data,
            error,
          } =
            await supabase.auth.verifyOtp(
              {
                token_hash:
                  tokenHash,
                type: "recovery",
              }
            );

          if (error) {
            throw error;
          }

          if (data?.session) {
            markRecoveryReady();
            return;
          }
        }

        /*
         * Dla standardowego linku klient Supabase sam odczytuje
         * tokeny z URL (detectSessionInUrl). Nie przetwarzamy ich
         * drugi raz, bo kod/link odzyskiwania jest jednorazowy.
         */
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (
          passwordRecoveryRequested &&
          sessionData?.session
        ) {
          markRecoveryReady();
          return;
        }

        scheduleMissingSessionError();
      } catch (error) {
        showRecoveryError(error);
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
            markRecoveryReady();
          }
        }
      );

    prepareRecovery();

    return () => {
      mounted = false;

      if (failureTimer) {
        window.clearTimeout(
          failureTimer
        );
      }

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
        "Sesja resetowania hasła nie jest aktywna. Poproś o nowy link resetujący."
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
      const {
        data,
        error,
      } =
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

      if (!data?.user) {
        setMessage(
          "Supabase nie potwierdził zmiany hasła."
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Hasło zostało zmienione. Możesz zalogować się nowym hasłem."
      );

      setPassword("");
      setPasswordAgain("");

      await supabase.auth.signOut();

      window.setTimeout(
        () => {
          navigate(
            "/login",
            {
              replace: true,
            }
          );
        },
        900
      );
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
            normalizeEmail(email),
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

  const [countryCode, setCountryCode] =
    useState("");

  const [countryLoading, setCountryLoading] =
    useState(true);

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

    /*
     * Formularz inicjalizujemy tylko po zmianie konta.
     * Aktualizacje Auth (np. USER_UPDATED po zapisie nazwy,
     * opisu albo avatara) nie mogą nadpisywać wpisywanych
     * właśnie wartości i powodować migania starej nazwy.
     */
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
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setCountryCode("");
      setCountryLoading(false);
      return;
    }

    let mounted = true;

    async function loadCountry() {
      setCountryLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("public_profiles")
          .select("country_code")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "COUNTRY LOAD ERROR:",
            error
          );
          return;
        }

        if (mounted) {
          setCountryCode(
            data?.country_code || ""
          );
        }
      } finally {
        if (mounted) {
          setCountryLoading(false);
        }
      }
    }

    loadCountry();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

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

  async function handleAvatarChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setMessage("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setMessage(
        "Wybierz plik graficzny."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "Zdjęcie może mieć maksymalnie 10 MB."
      );

      event.target.value = "";

      return;
    }

    setUploading(true);

    try {
      const convertedFile =
        await resizeAndConvertImage(
          file
        );

      const filePath =
        `${user.id}/avatar-${Date.now()}.jpg`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            convertedFile,
            {
              contentType:
                "image/jpeg",
              cacheControl:
                "3600",
              upsert: false,
            }
          );

      if (uploadError) {
        setMessage(
          `Nie udało się przesłać zdjęcia: ${uploadError.message}`
        );

        return;
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        setMessage(
          "Nie udało się pobrać adresu zdjęcia."
        );

        return;
      }

      const {
        data: updatedUser,
        error:
          metadataError,
      } =
        await supabase.auth.updateUser(
          {
            data: {
              avatar_url:
                publicUrl,
            },
          }
        );

      if (metadataError) {
        setMessage(
          `Zdjęcie przesłane, ale nie udało się zapisać profilu: ${metadataError.message}`
        );

        return;
      }

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name:
              name.trim() ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Użytkownik",
            avatar_url: publicUrl,
            about:
              about.trim() ||
              user.user_metadata?.about ||
              null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(
          "PROFILE AVATAR UPDATE ERROR:",
          profileError
        );

        setMessage(
          `Zdjęcie zostało przesłane, ale nie udało się zaktualizować profilu publicznego: ${profileError.message}`
        );

        return;
      }

      setAvatarUrl(
        updatedUser?.user
          ?.user_metadata
          ?.avatar_url ||
          publicUrl
      );

      setMessage(
        "Zdjęcie profilowe zostało zapisane."
      );
    } catch (error) {
      setMessage(
        `Nie udało się ustawić zdjęcia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSave(
    event
  ) {
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

      /*
       * Synchronizujemy publiczny profil.
       * Inni użytkownicy pobierają opis, nazwę i avatar
       * z tabeli public.profiles, więc samo Auth metadata
       * nie wystarcza.
       */
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: cleanName,
            avatar_url:
              avatarUrl ||
              null,
            about:
              cleanAbout ||
              null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(
          "PROFILE SAVE ERROR:",
          profileError
        );

        setMessage(
          `Dane konta zostały zapisane, ale nie udało się zaktualizować profilu publicznego: ${profileError.message}`
        );

        return;
      }

      try {
        await saveUserCountry(
          user.id,
          getCountryByCode(countryCode)
        );
      } catch (countryError) {
        console.error(
          "COUNTRY SAVE ERROR:",
          countryError
        );

        setMessage(
          `Profil został zapisany, ale nie udało się zapisać kraju: ${countryError.message}`
        );

        return;
      }

      /*
       * Używamy dokładnie wartości zatwierdzonych w formularzu.
       * Nie czekamy na ponowne odświeżenie user_metadata, dzięki
       * czemu interfejs nie przeskakuje przez starsze dane.
       */
      setName(cleanName);
      setAvatarUrl(
        avatarUrl || ""
      );
      setAbout(cleanAbout);

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

              {countryCode && (
                <CountryBadge
                  countryCode={countryCode}
                />
              )}
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
                className="ideahire-multiline-field ideahire-about-field"
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

            <label>
              Skąd jesteś?

              <CountryPicker
                value={countryCode}
                onChange={(country) =>
                  setCountryCode(
                    country?.code || ""
                  )
                }
                disabled={
                  saving ||
                  uploading ||
                  countryLoading
                }
              />

              <small>
                Wybierz kraj, który będzie
                widoczny na Twoim profilu.
              </small>
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

            <textarea
              className="ideahire-multiline-field ideahire-title-field"
              rows="2"
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
              className="ideahire-multiline-field ideahire-description-field"
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

            <textarea
              className="ideahire-multiline-field ideahire-title-field"
              rows="2"
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
              className="ideahire-multiline-field ideahire-description-field"
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

  const [countryCode, setCountryCode] =
    useState("");

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
          data: countryData,
          error: countryError,
        } = await supabase
          .from("public_profiles")
          .select("country_code")
          .eq("user_id", id)
          .maybeSingle();

        if (countryError) {
          console.error(
            "PROFILE COUNTRY ERROR:",
            countryError
          );
        } else {
          setCountryCode(
            countryData?.country_code || ""
          );
        }

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

              {countryCode && (
                <CountryBadge
                  countryCode={countryCode}
                />
              )}

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

        <style>{`
          .jobs-search {
            margin: 0 0 34px;
            padding: 18px;
            background: #fff;
            border: 1px solid #e8e8e5;
            border-radius: 22px;
            box-shadow: 0 12px 35px rgba(17, 17, 17, 0.045);
          }

          .jobs-search-box {
            position: relative;
            display: flex;
            align-items: center;
            min-height: 58px;
            padding: 0 16px 0 18px;
            border: 1px solid #deded9;
            border-radius: 15px;
            background: #fafaf8;
            transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          }

          .jobs-search-box:focus-within {
            border-color: #b9b9b3;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(17, 17, 17, .045);
          }

          .jobs-search-icon {
            width: 20px;
            margin-right: 12px;
            color: #777;
            font-size: 22px;
            line-height: 1;
            transform: translateY(-1px);
          }

          .jobs-search-box input {
            width: 100%;
            min-width: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #111;
            font-size: 15px;
            font-weight: 500;
          }

          .jobs-search-box input::placeholder {
            color: #999;
            font-weight: 400;
          }

          .jobs-search-clear {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            display: grid;
            place-items: center;
            margin-left: 10px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: #ededeb;
            color: #555;
            font-size: 19px;
            line-height: 1;
            transition: background .2s ease, color .2s ease, transform .2s ease;
          }

          .jobs-search-clear:hover {
            background: #deded9;
            color: #111;
            transform: none;
          }

          .jobs-filter-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            padding: 2px 1px;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .jobs-filter-row::-webkit-scrollbar {
            display: none;
          }

          .jobs-filter {
            flex: 0 0 auto;
            min-height: 38px;
            padding: 8px 14px;
            border: 1px solid #e1e1dc;
            border-radius: 999px;
            background: #fff;
            color: #666;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: .1px;
            white-space: nowrap;
            transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
          }

          .jobs-filter:hover {
            border-color: #c8c8c2;
            background: #f7f7f4;
            color: #111;
            transform: none;
          }

          .jobs-filter.active {
            border-color: #111;
            background: #111;
            color: #fff;
          }

          .jobs-filter.active:hover {
            border-color: #111;
            background: #111;
            color: #fff;
          }

          @media (max-width: 600px) {
            .jobs-search {
              margin-bottom: 28px;
              padding: 12px;
              border-radius: 18px;
            }

            .jobs-search-box {
              min-height: 54px;
              padding-left: 15px;
            }

            .jobs-filter-row {
              margin-top: 11px;
            }
          }
        `}</style>

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

  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    rejectedDecisions,
    setRejectedDecisions,
  ] = useState([]);

  const [
    acceptedDecisions,
    setAcceptedDecisions,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  async function loadNotifications() {
    if (!user?.id) return;

    setLoading(true);
    setMessage("");

    const dismissedKey =
      `ideahire_dismissed_notifications_${user.id}`;

    const dismissedIds =
      getStoredNotificationIds(
        dismissedKey
      );

    try {
      /*
       * 1. Zgłoszenia do zleceń, których jesteś właścicielem.
       * Pokazujemy wyłącznie aktywne zgłoszenia "pending".
       */
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
        throw jobsError;
      }

      const jobIds =
        (myJobs || []).map(
          (job) => job.id
        );

      let incomingApplications = [];

      if (jobIds.length > 0) {
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
              "id, job_id, applicant_id, status, created_at"
            )
            .in(
              "job_id",
              jobIds
            )
            .eq(
              "status",
              "pending"
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (applicationsError) {
          throw applicationsError;
        }

        incomingApplications =
          applications || [];
      }

      let incomingResult = [];

      if (
        incomingApplications.length >
        0
      ) {
        const applicantIds = [
          ...new Set(
            incomingApplications.map(
              (item) =>
                item.applicant_id
            )
          ),
        ];

        const {
          data: profiles,
          error: profilesError,
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

        if (profilesError) {
          console.error(
            "NOTIFICATION PROFILE ERROR:",
            profilesError
          );
        }

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

        incomingResult =
          incomingApplications.map(
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
      }

      setNotifications(
        incomingResult
      );

      /*
       * 2. Decyzje dotyczące zgłoszeń wysłanych przez Ciebie.
       * Na tym etapie obsługujemy odrzucenie.
       */
      const {
        data: myRejected,
        error: rejectedError,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .select(
            "id, job_id, applicant_id, status, created_at"
          )
          .eq(
            "applicant_id",
            user.id
          )
          .eq(
            "status",
            "rejected"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (rejectedError) {
        throw rejectedError;
      }

      let rejectedResult = [];

      if (
        myRejected &&
        myRejected.length > 0
      ) {
        const rejectedJobIds = [
          ...new Set(
            myRejected.map(
              (application) =>
                application.job_id
            )
          ),
        ];

        const {
          data: rejectedJobs,
          error: rejectedJobsError,
        } =
          await supabase
            .from("jobs")
            .select(
              "id, title"
            )
            .in(
              "id",
              rejectedJobIds
            );

        if (rejectedJobsError) {
          console.error(
            "REJECTED JOBS ERROR:",
            rejectedJobsError
          );
        }

        const rejectedJobMap =
          new Map(
            (rejectedJobs || []).map(
              (job) => [
                job.id,
                job,
              ]
            )
          );

        rejectedResult =
          myRejected
            .filter(
              (application) =>
                !dismissedIds.includes(
                  `rejected:${application.id}`
                )
            )
            .map(
              (application) => ({
                ...application,
                job:
                  rejectedJobMap.get(
                    application.job_id
                  ),
              })
            );
      }

      setRejectedDecisions(
        rejectedResult
      );

      /*
       * 3. Zaakceptowane zgłoszenia wykonawcy.
       * Rozmowa jest już utworzona, więc od razu dajemy
       * wykonawcy wejście do czatu.
       */
      const {
        data: myAccepted,
        error: acceptedError,
      } = await supabase
        .from("job_applications")
        .select(
          "id, job_id, applicant_id, status, created_at"
        )
        .eq("applicant_id", user.id)
        .eq("status", "accepted")
        .order("created_at", {
          ascending: false,
        });

      if (acceptedError) {
        throw acceptedError;
      }

      let acceptedResult = [];

      if (myAccepted?.length) {
        const acceptedJobIds = [
          ...new Set(
            myAccepted.map(
              (application) =>
                application.job_id
            )
          ),
        ];

        const {
          data: acceptedJobs,
          error: acceptedJobsError,
        } = await supabase
          .from("jobs")
          .select("id, title, user_id")
          .in("id", acceptedJobIds);

        if (acceptedJobsError) {
          console.error(
            "ACCEPTED JOBS ERROR:",
            acceptedJobsError
          );
        }

        const {
          data: acceptedConversations,
          error: acceptedConversationsError,
        } = await supabase
          .from("conversations")
          .select(
            "id, job_id, client_id, contractor_id, created_at"
          )
          .eq("contractor_id", user.id)
          .in("job_id", acceptedJobIds);

        if (acceptedConversationsError) {
          console.error(
            "ACCEPTED CONVERSATIONS ERROR:",
            acceptedConversationsError
          );
        }

        const jobMap = new Map(
          (acceptedJobs || []).map(
            (job) => [job.id, job]
          )
        );

        const conversationMap = new Map(
          (acceptedConversations || []).map(
            (conversation) => [
              conversation.job_id,
              conversation,
            ]
          )
        );

        acceptedResult = myAccepted
          .filter(
            (application) =>
              !dismissedIds.includes(
                `accepted:${application.id}`
              )
          )
          .map(
            (application) => ({
              ...application,
              job: jobMap.get(
                application.job_id
              ),
              conversation:
                conversationMap.get(
                  application.job_id
                ),
            })
          );
      }

      setAcceptedDecisions(
        acceptedResult
      );

      /*
       * Po otwarciu skrzynki zaznaczamy aktualne elementy
       * jako przeczytane dla kropki w navbarze.
       */
      const readKey =
        `ideahire_read_notifications_${user.id}`;

      const readIds = [
        ...incomingResult.map(
          (item) =>
            `incoming:${item.id}`
        ),
        ...rejectedResult.map(
          (item) =>
            `rejected:${item.id}`
        ),
        ...acceptedResult.map(
          (item) =>
            `accepted:${item.id}`
        ),
      ];

      saveNotificationIds(
        readKey,
        [
          ...getStoredNotificationIds(
            readKey
          ),
          ...dismissedIds,
          ...readIds,
        ]
      );

      announceNotificationsRead(
        user.id
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

  function handleClearNotifications() {
    if (!user?.id) return;

    const visibleIds = [
      ...rejectedDecisions.map(
        (item) =>
          `rejected:${item.id}`
      ),
      ...acceptedDecisions.map(
        (item) =>
          `accepted:${item.id}`
      ),
    ];

    if (visibleIds.length === 0) {
      return;
    }

    const dismissedKey =
      `ideahire_dismissed_notifications_${user.id}`;

    const readKey =
      `ideahire_read_notifications_${user.id}`;

    saveNotificationIds(
      dismissedKey,
      [
        ...getStoredNotificationIds(
          dismissedKey
        ),
        ...visibleIds,
      ]
    );

    saveNotificationIds(
      readKey,
      [
        ...getStoredNotificationIds(
          readKey
        ),
        ...visibleIds,
      ]
    );

    setRejectedDecisions([]);
    setAcceptedDecisions([]);

    announceNotificationsRead(
      user.id
    );
  }

  async function handleAccepted(
    applicationId
  ) {
    if (!user?.id) {
      throw new Error("Brak aktywnej sesji użytkownika.");
    }

    const application =
      notifications.find(
        (item) =>
          item.id === applicationId
      );

    if (!application) {
      throw new Error(
        "Nie znaleziono tego zgłoszenia. Odśwież stronę i spróbuj ponownie."
      );
    }

    const jobId =
      application.job_id;

    const contractorId =
      application.applicant_id;

    if (!jobId || !contractorId) {
      throw new Error(
        "Zgłoszenie nie zawiera kompletnych danych."
      );
    }

    /*
     * Najpierw szukamy istniejącej rozmowy.
     * Dzięki temu ponowne kliknięcie nie tworzy duplikatów.
     */
    const {
      data: existingConversation,
      error: existingError,
    } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", jobId)
      .eq("client_id", user.id)
      .eq(
        "contractor_id",
        contractorId
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let conversationId =
      existingConversation?.id || null;

    if (!conversationId) {
      const {
        data: createdConversation,
        error: conversationError,
      } = await supabase
        .from("conversations")
        .insert({
          job_id: jobId,
          client_id: user.id,
          contractor_id:
            contractorId,
        })
        .select("id")
        .single();

      if (conversationError) {
        throw conversationError;
      }

      conversationId =
        createdConversation?.id;
    }

    if (!conversationId) {
      throw new Error(
        "Nie udało się utworzyć rozmowy."
      );
    }

    const {
      data: acceptedApplication,
      error: acceptError,
    } = await supabase
      .from("job_applications")
      .update({
        status: "accepted",
      })
      .eq("id", applicationId)
      .eq("status", "pending")
      .select("id, status")
      .maybeSingle();

    if (acceptError) {
      throw acceptError;
    }

    if (!acceptedApplication?.id) {
      throw new Error(
        "Rozmowa została przygotowana, ale nie udało się zmienić statusu zgłoszenia na accepted."
      );
    }

    setNotifications(
      (current) =>
        current.filter(
          (notification) =>
            notification.id !==
            applicationId
        )
    );

    navigate(
      `/chat/${conversationId}`
    );
  }

  function handleRejected(
    applicationId
  ) {
    setNotifications(
      (current) =>
        current.filter(
          (notification) =>
            notification.id !==
            applicationId
        )
    );
  }

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

  const isInboxEmpty =
    notifications.length === 0 &&
    rejectedDecisions.length === 0 &&
    acceptedDecisions.length === 0;

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
            Tutaj znajdziesz zgłoszenia
            wykonawców oraz decyzje
            dotyczące Twoich własnych
            zgłoszeń.
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
          isInboxEmpty && (
            <section className="account-card">
              <span className="section-label">
                Skrzynka jest pusta
              </span>

              <h2>
                Nie masz nowych
                powiadomień.
              </h2>

              <p>
                Gdy ktoś zgłosi się
                do Twojego zlecenia
                albo pojawi się decyzja
                dotycząca Twojego
                zgłoszenia, zobaczysz
                ją tutaj.
              </p>
            </section>
          )}

        <style>{`
          .notification-person {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
            margin-bottom: 24px;
          }

          .notification-avatar {
            width: 56px;
            height: 56px;
            flex: 0 0 56px;
            display: grid;
            place-items: center;
            overflow: hidden;
            border: 1px solid #e2e2de;
            border-radius: 50%;
            background: #f3f3f0;
            color: #111;
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .notification-avatar img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            object-position: center;
          }

          .notification-person > div:last-child {
            min-width: 0;
          }

          .notification-person strong {
            display: block;
            margin: 0 0 5px;
            color: #111;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }

          .notification-person p {
            margin: 0;
            color: #777;
            font-size: 13px;
            line-height: 1.5;
          }

          .notification-job {
            min-width: 0;
            margin-bottom: 18px;
            padding-top: 20px;
            border-top: 1px solid #ededeb;
          }

          .notification-job .section-label {
            margin-bottom: 8px;
          }

          .notification-job h2 {
            margin: 0 0 9px;
            font-size: 21px;
            line-height: 1.3;
            letter-spacing: -0.5px;
            overflow-wrap: anywhere;
          }

          .notification-job small {
            display: block;
            color: #999;
            font-size: 12px;
            line-height: 1.5;
          }

          .notification-card-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
          }

          .notification-card-actions > .btn {
            width: fit-content;
          }

          .notification-section-title {
            margin: 30px 0 14px;
          }

          .notification-toolbar {
            display: flex;
            justify-content: flex-end;
            margin: 4px 0 10px;
          }

          .notification-clear-button {
            min-height: 42px;
            padding: 10px 16px;
            border: 1px solid #deded9;
            border-radius: 12px;
            background: #fff;
            color: #555;
            font: inherit;
            font-size: 13px;
            font-weight: 650;
            transition:
              color 0.18s ease,
              border-color 0.18s ease,
              background 0.18s ease,
              transform 0.18s ease;
          }

          .notification-clear-button:hover {
            transform: translateY(-1px);
            border-color: #bdbdb7;
            background: #f7f7f4;
            color: #171717;
          }

          .notification-decision-card {
            border-color: #eadfdc;
            background:
              linear-gradient(
                180deg,
                #fff 0%,
                #fffaf8 100%
              );
          }

          .notification-decision-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            margin-bottom: 14px;
            border-radius: 50%;
            background: #f7e9e5;
            color: #9c392d;
            font-size: 18px;
            font-weight: 800;
          }

          .notification-decision-card h2 {
            margin: 0 0 9px;
            font-size: 20px;
            line-height: 1.3;
          }

          .notification-decision-card p {
            margin: 0;
            color: #666;
            line-height: 1.65;
          }

          .notification-decision-job {
            margin-top: 14px;
            color: #333;
            font-size: 14px;
          }

          .notification-accepted-card {
            border-color: #dfe7df;
            background:
              linear-gradient(
                180deg,
                #fff 0%,
                #f8fbf7 100%
              );
          }

          .notification-accepted-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            margin-bottom: 14px;
            border-radius: 50%;
            background: #e8f1e7;
            color: #315b35;
            font-size: 18px;
            font-weight: 800;
          }

          .notification-chat-button {
            display: inline-flex;
            margin-top: 18px;
          }

          @media (max-width: 600px) {
            .notification-person {
              gap: 12px;
              margin-bottom: 20px;
            }

            .notification-avatar {
              width: 48px;
              height: 48px;
              flex-basis: 48px;
            }

            .notification-job {
              margin-bottom: 16px;
              padding-top: 16px;
            }

            .notification-job h2 {
              font-size: 18px;
            }

            .notification-card-actions {
              display: grid;
              grid-template-columns: 1fr;
            }

            .notification-card-actions > .btn {
              width: 100%;
            }

            .notification-toolbar {
              margin-top: 8px;
            }

            .notification-clear-button {
              width: 100%;
            }
          }
        `}</style>

        {!loading &&
          !message &&
          (rejectedDecisions.length > 0 ||
            acceptedDecisions.length > 0) && (
            <div className="notification-toolbar">
              <button
                type="button"
                className="notification-clear-button"
                onClick={
                  handleClearNotifications
                }
              >
                Wyczyść przeczytane
              </button>
            </div>
          )}

        {!loading &&
          !message &&
          notifications.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Zgłoszenia do Twoich zleceń
                </span>
              </div>

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

                        <div className="notification-card-actions">
                          <Link
                            className="btn btn-outline"
                            to={`/profile/${notification.applicant_id}`}
                          >
                            Zobacz profil →
                          </Link>

                          <ApplicationActions
                            applicationId={
                              notification.id
                            }
                            onAccepted={
                              handleAccepted
                            }
                            onRejected={
                              handleRejected
                            }
                          />
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

        {!loading &&
          !message &&
          acceptedDecisions.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Zaakceptowane zgłoszenia
                </span>
              </div>

              <div className="jobs-list">
                {acceptedDecisions.map(
                  (decision) => (
                    <article
                      className="job-card notification-accepted-card"
                      key={
                        `accepted-${decision.id}`
                      }
                    >
                      <div className="notification-accepted-icon">
                        ✓
                      </div>

                      <span className="section-label">
                        Dobra wiadomość
                      </span>

                      <h2>
                        Twoje zgłoszenie zostało zaakceptowane
                      </h2>

                      <p>
                        Zleceniodawca wybrał Cię do realizacji
                        tego zlecenia. Możecie teraz ustalić
                        szczegóły współpracy w prywatnej rozmowie.
                      </p>

                      <div className="notification-decision-job">
                        <strong>Zlecenie:</strong>{" "}
                        {decision.job?.title ||
                          "Zlecenie"}
                      </div>

                      {decision.conversation?.id ? (
                        <Link
                          className="btn btn-dark notification-chat-button"
                          to={`/chat/${decision.conversation.id}`}
                        >
                          Przejdź do rozmowy →
                        </Link>
                      ) : (
                        <p
                          style={{
                            marginTop: "14px",
                            color: "#8a6b24",
                            fontSize: "13px",
                          }}
                        >
                          Rozmowa jest przygotowywana. Odśwież
                          powiadomienia za chwilę.
                        </p>
                      )}
                    </article>
                  )
                )}
              </div>
            </>
          )}

        {!loading &&
          !message &&
          rejectedDecisions.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Decyzje dotyczące Twoich zgłoszeń
                </span>
              </div>

              <div className="jobs-list">
                {rejectedDecisions.map(
                  (decision) => (
                    <article
                      className="job-card notification-decision-card"
                      key={
                        `rejected-${decision.id}`
                      }
                    >
                      <div className="notification-decision-icon">
                        ×
                      </div>

                      <span className="section-label">
                        Decyzja dotycząca zgłoszenia
                      </span>

                      <h2>
                        Twoje zgłoszenie nie zostało zaakceptowane
                      </h2>

                      <p>
                        Zleceniodawca zdecydował się
                        nie kontynuować współpracy
                        w ramach tego zgłoszenia.
                        Możesz nadal przeglądać
                        pozostałe zlecenia i zgłaszać
                        się do kolejnych ofert.
                      </p>

                      <div className="notification-decision-job">
                        <strong>
                          Zlecenie:
                        </strong>{" "}
                        {decision.job?.title ||
                          "Zlecenie"}
                      </div>

                      <small
                        style={{
                          display: "block",
                          marginTop: "10px",
                          color: "#999",
                        }}
                      >
                        Zgłoszenie wysłano:{" "}
                        {formatDate(
                          decision.created_at
                        )}
                      </small>
                    </article>
                  )
                )}
              </div>
            </>
          )}
      </main>
    </div>
  );
}


/* =========================================================
   MESSAGES / CONVERSATION LIST
========================================================= */

function Messages() {
  const { user } =
    useAuth();

  const [conversations, setConversations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function loadConversations() {
      setLoading(true);
      setErrorMessage("");

      try {
        /*
         * RLS w conversations zwraca tylko rozmowy,
         * w których zalogowany użytkownik jest stroną.
         */
        const {
          data: conversationRows,
          error: conversationsError,
        } = await supabase
          .from("conversations")
          .select(
            "id, job_id, client_id, contractor_id, created_at"
          )
          .order("created_at", {
            ascending: false,
          });

        if (conversationsError) {
          throw conversationsError;
        }

        const rows =
          conversationRows || [];

        if (!rows.length) {
          if (mounted) {
            setConversations([]);
          }
          return;
        }

        const otherUserIds = [
          ...new Set(
            rows.map((conversation) =>
              conversation.client_id ===
              user.id
                ? conversation.contractor_id
                : conversation.client_id
            )
          ),
        ];

        const jobIds = [
          ...new Set(
            rows.map(
              (conversation) =>
                conversation.job_id
            )
          ),
        ];

        const conversationIds =
          rows.map(
            (conversation) =>
              conversation.id
          );

        const [
          profilesResult,
          jobsResult,
          messagesResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url"
            )
            .in("id", otherUserIds),

          supabase
            .from("jobs")
            .select("id, title")
            .in("id", jobIds),

          supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, content, created_at"
            )
            .in(
              "conversation_id",
              conversationIds
            )
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (profilesResult.error) {
          console.error(
            "MESSAGES PROFILES ERROR:",
            profilesResult.error
          );
        }

        if (jobsResult.error) {
          console.error(
            "MESSAGES JOBS ERROR:",
            jobsResult.error
          );
        }

        if (messagesResult.error) {
          throw messagesResult.error;
        }

        const profileMap =
          new Map(
            (profilesResult.data || []).map(
              (profile) => [
                profile.id,
                profile,
              ]
            )
          );

        const jobMap =
          new Map(
            (jobsResult.data || []).map(
              (job) => [
                job.id,
                job,
              ]
            )
          );

        const lastMessageMap =
          new Map();

        for (
          const message of
          messagesResult.data || []
        ) {
          if (
            !lastMessageMap.has(
              message.conversation_id
            )
          ) {
            lastMessageMap.set(
              message.conversation_id,
              message
            );
          }
        }

        const result =
          rows
            .map((conversation) => {
              const otherUserId =
                conversation.client_id ===
                user.id
                  ? conversation.contractor_id
                  : conversation.client_id;

              const lastMessage =
                lastMessageMap.get(
                  conversation.id
                );

              return {
                ...conversation,
                otherProfile:
                  profileMap.get(
                    otherUserId
                  ),
                job:
                  jobMap.get(
                    conversation.job_id
                  ),
                lastMessage,
                sortDate:
                  lastMessage?.created_at ||
                  conversation.created_at,
              };
            })
            .sort(
              (a, b) =>
                new Date(
                  b.sortDate
                ).getTime() -
                new Date(
                  a.sortDate
                ).getTime()
            );

        if (mounted) {
          setConversations(
            result
          );
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error?.message ||
              "Nie udało się pobrać rozmów."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConversations();

    const channel =
      supabase
        .channel(
          `messages-list:${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => {
            loadConversations();
          }
        )
        .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, [user?.id]);

  function formatConversationDate(
    value
  ) {
    if (!value) return "";

    const date =
      new Date(value);

    const today =
      new Date();

    if (
      date.toDateString() ===
      today.toDateString()
    ) {
      return date.toLocaleTimeString(
        "pl-PL",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    return date.toLocaleDateString(
      "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );
  }

  return (
    <div className="account-page">
      <AccountNavbar />

      <main className="messages-page">
        <style>{`
          .messages-page {
            width: min(980px, calc(100% - 32px));
            margin: 34px auto 60px;
          }

          .messages-heading {
            margin-bottom: 22px;
          }

          .messages-heading h1 {
            margin: 5px 0 8px;
            font-size: clamp(30px, 5vw, 46px);
            letter-spacing: -1.5px;
          }

          .messages-heading p {
            margin: 0;
            max-width: 600px;
            color: #777;
            line-height: 1.6;
          }

          .messages-list {
            overflow: hidden;
            border: 1px solid rgba(20,20,20,.08);
            border-radius: 22px;
            background: #fff;
            box-shadow: 0 16px 45px rgba(20,20,20,.05);
          }

          .messages-row {
            display: grid;
            grid-template-columns: 54px minmax(0, 1fr) auto;
            align-items: center;
            gap: 14px;
            padding: 16px 18px;
            border-bottom: 1px solid rgba(20,20,20,.07);
            color: inherit;
            text-decoration: none;
            transition: background .16s ease;
          }

          .messages-row:last-child {
            border-bottom: 0;
          }

          .messages-row:hover {
            background: #f8f8f5;
          }

          .messages-avatar {
            width: 54px;
            height: 54px;
            overflow: hidden;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #ecece8;
            font-size: 17px;
            font-weight: 800;
          }

          .messages-avatar img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }

          .messages-content {
            min-width: 0;
          }

          .messages-topline {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .messages-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 800;
          }

          .messages-job {
            margin-top: 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #777;
            font-size: 12px;
          }

          .messages-preview {
            margin-top: 7px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #555;
            font-size: 14px;
          }

          .messages-date {
            align-self: start;
            padding-top: 3px;
            color: #999;
            font-size: 11px;
            white-space: nowrap;
          }

          .messages-empty {
            padding: 54px 24px;
            border: 1px solid rgba(20,20,20,.08);
            border-radius: 22px;
            background: #fff;
            text-align: center;
          }

          .messages-empty h2 {
            margin: 0 0 8px;
          }

          .messages-empty p {
            margin: 0;
            color: #777;
            line-height: 1.6;
          }

          @media (max-width: 600px) {
            .messages-page {
              width: calc(100% - 20px);
              margin: 20px auto 40px;
            }

            .messages-row {
              grid-template-columns: 48px minmax(0, 1fr) auto;
              gap: 11px;
              padding: 14px 12px;
            }

            .messages-avatar {
              width: 48px;
              height: 48px;
            }

            .messages-job {
              max-width: 65vw;
            }
          }
        `}</style>

        <div className="messages-heading">
          <span className="section-label">
            Twoje rozmowy
          </span>

          <h1>Wiadomości</h1>

          <p>
            Tutaj znajdziesz wszystkie rozmowy
            rozpoczęte po zaakceptowaniu wykonawcy.
          </p>
        </div>

        {loading ? (
          <p>Ładowanie rozmów...</p>
        ) : errorMessage ? (
          <p className="auth-error">
            {errorMessage}
          </p>
        ) : conversations.length === 0 ? (
          <section className="messages-empty">
            <h2>
              Nie masz jeszcze rozmów
            </h2>

            <p>
              Gdy zgłoszenie zostanie zaakceptowane,
              rozmowa pojawi się właśnie tutaj.
            </p>
          </section>
        ) : (
          <div className="messages-list">
            {conversations.map(
              (conversation) => {
                const profile =
                  conversation.otherProfile;

                const name =
                  profile?.name ||
                  "Użytkownik";

                const initial =
                  name
                    .charAt(0)
                    .toUpperCase();

                const lastMessage =
                  conversation.lastMessage;

                return (
                  <Link
                    key={
                      conversation.id
                    }
                    className="messages-row"
                    to={`/chat/${conversation.id}`}
                  >
                    <div className="messages-avatar">
                      {profile?.avatar_url ? (
                        <img
                          src={
                            profile.avatar_url
                          }
                          alt=""
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    <div className="messages-content">
                      <div className="messages-topline">
                        <span className="messages-name">
                          {name}
                        </span>
                      </div>

                      <div className="messages-job">
                        {conversation.job?.title ||
                          "Rozmowa dotycząca zlecenia"}
                      </div>

                      <div className="messages-preview">
                        {lastMessage
                          ? `${
                              lastMessage.sender_id ===
                              user.id
                                ? "Ty: "
                                : ""
                            }${lastMessage.content}`
                          : "Rozmowa została otwarta — napisz pierwszą wiadomość."}
                      </div>
                    </div>

                    <time className="messages-date">
                      {formatConversationDate(
                        conversation.sortDate
                      )}
                    </time>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </main>
    </div>
  );
}


/* =========================================================
   CHAT
========================================================= */

function Chat() {
  const { user } =
    useAuth();

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [conversation, setConversation] =
    useState(null);

  const [otherProfile, setOtherProfile] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [draft, setDraft] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function loadMessages() {
    if (!id) return;

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, created_at"
      )
      .eq(
        "conversation_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    setMessages(
      data || []
    );
  }

  useEffect(() => {
    if (!user?.id || !id) return;

    let mounted = true;

    async function loadChat() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: conversationData,
          error: conversationError,
        } = await supabase
          .from("conversations")
          .select(
            "id, job_id, client_id, contractor_id, created_at"
          )
          .eq("id", id)
          .single();

        if (conversationError) {
          throw conversationError;
        }

        if (!mounted) return;

        setConversation(
          conversationData
        );

        const otherUserId =
          conversationData.client_id ===
          user.id
            ? conversationData.contractor_id
            : conversationData.client_id;

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, name, avatar_url"
          )
          .eq(
            "id",
            otherUserId
          )
          .maybeSingle();

        if (profileError) {
          console.error(
            "CHAT PROFILE ERROR:",
            profileError
          );
        }

        if (mounted) {
          setOtherProfile(
            profileData || null
          );
        }

        await loadMessages();
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error?.message ||
            "Nie udało się otworzyć rozmowy."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadChat();

    const channel =
      supabase
        .channel(
          `conversation:${id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            const newMessage =
              payload.new;

            setMessages(
              (current) => {
                if (
                  current.some(
                    (message) =>
                      message.id ===
                      newMessage.id
                  )
                ) {
                  return current;
                }

                return [
                  ...current,
                  newMessage,
                ];
              }
            );
          }
        )
        .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, [user?.id, id]);

  async function handleSend(
    event
  ) {
    event.preventDefault();

    const content =
      draft.trim();

    if (
      !content ||
      !user?.id ||
      !id ||
      sending
    ) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id: id,
          sender_id: user.id,
          content,
        })
        .select(
          "id, conversation_id, sender_id, content, created_at"
        )
        .single();

      if (error) {
        throw error;
      }

      setDraft("");

      /*
       * Dodajemy wiadomość lokalnie od razu.
       * Realtime ma ochronę przed duplikatem po id.
       */
      if (data?.id) {
        setMessages(
          (current) =>
            current.some(
              (message) =>
                message.id === data.id
            )
              ? current
              : [...current, data]
        );
      }
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Nie udało się wysłać wiadomości."
      );
    } finally {
      setSending(false);
    }
  }

  const otherName =
    otherProfile?.name ||
    "Użytkownik";

  const otherInitial =
    otherName
      .charAt(0)
      .toUpperCase();

  return (
    <div className="account-page">
      <AccountNavbar />

      <main className="chat-page">
        <style>{`
          .chat-page {
            width: min(980px, calc(100% - 32px));
            margin: 34px auto 60px;
          }

          .chat-shell {
            min-height: 68vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(20,20,20,.08);
            border-radius: 24px;
            background: #fff;
            box-shadow: 0 18px 55px rgba(20,20,20,.06);
          }

          .chat-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px;
            border-bottom: 1px solid rgba(20,20,20,.07);
            background: rgba(250,250,247,.96);
          }

          .chat-back {
            border: 0;
            background: transparent;
            color: #555;
            font: inherit;
            cursor: pointer;
          }

          .chat-avatar {
            width: 46px;
            height: 46px;
            flex: 0 0 46px;
            overflow: hidden;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #ecece8;
            font-weight: 800;
          }

          .chat-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .chat-person {
            min-width: 0;
          }

          .chat-person strong {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 16px;
          }

          .chat-person span {
            display: block;
            margin-top: 2px;
            color: #8b8b86;
            font-size: 12px;
          }

          .chat-messages {
            flex: 1;
            min-height: 420px;
            max-height: 62vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 9px;
            padding: 22px;
            background: #f7f7f4;
          }

          .chat-empty {
            margin: auto;
            max-width: 420px;
            color: #888;
            text-align: center;
            line-height: 1.6;
          }

          .chat-message {
            max-width: min(72%, 620px);
            padding: 11px 14px 8px;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 2px 10px rgba(20,20,20,.04);
          }

          .chat-message.is-mine {
            align-self: flex-end;
            background: #171717;
            color: #fff;
            border-bottom-right-radius: 6px;
          }

          .chat-message.is-theirs {
            align-self: flex-start;
            border-bottom-left-radius: 6px;
          }

          .chat-message p {
            margin: 0;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            line-height: 1.5;
          }

          .chat-message time {
            display: block;
            margin-top: 5px;
            color: #999;
            font-size: 10px;
            text-align: right;
          }

          .chat-message.is-mine time {
            color: rgba(255,255,255,.58);
          }

          .chat-form {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            padding: 15px;
            border-top: 1px solid rgba(20,20,20,.07);
            background: #fff;
          }

          .chat-form textarea {
            flex: 1;
            min-height: 48px;
            max-height: 140px;
            resize: vertical;
            padding: 13px 15px;
            border: 1px solid rgba(20,20,20,.12);
            border-radius: 15px;
            outline: none;
            background: #f8f8f5;
            color: #171717;
            font: inherit;
            line-height: 1.45;
          }

          .chat-form textarea:focus {
            border-color: #171717;
            box-shadow: 0 0 0 3px rgba(20,20,20,.05);
          }

          .chat-send {
            min-height: 48px;
            padding: 0 18px;
            border: 1px solid #171717;
            border-radius: 14px;
            background: #171717;
            color: #fff;
            font: inherit;
            font-weight: 750;
            cursor: pointer;
          }

          .chat-send:disabled {
            cursor: wait;
            opacity: .55;
          }

          .chat-error {
            margin: 0;
            padding: 10px 18px;
            border-top: 1px solid #f0d6d1;
            background: #fff7f5;
            color: #9b352b;
            font-size: 13px;
          }

          @media (max-width: 600px) {
            .chat-page {
              width: 100%;
              margin: 0;
            }

            .chat-shell {
              min-height: calc(100vh - 70px);
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }

            .chat-header {
              padding: 14px;
            }

            .chat-messages {
              min-height: 0;
              max-height: none;
              padding: 15px 12px;
            }

            .chat-message {
              max-width: 84%;
            }

            .chat-form {
              padding: 10px;
            }

            .chat-send {
              padding: 0 14px;
            }
          }
        `}</style>

        <div className="chat-shell">
          {loading ? (
            <div className="chat-empty">
              Ładowanie rozmowy...
            </div>
          ) : errorMessage &&
            !conversation ? (
            <div className="chat-empty">
              {errorMessage}
            </div>
          ) : (
            <>
              <header className="chat-header">
                <button
                  type="button"
                  className="chat-back"
                  onClick={() =>
                    navigate(
                      "/messages"
                    )
                  }
                >
                  ← Wróć
                </button>

                <div className="chat-avatar">
                  {otherProfile?.avatar_url ? (
                    <img
                      src={
                        otherProfile.avatar_url
                      }
                      alt=""
                    />
                  ) : (
                    otherInitial
                  )}
                </div>

                <div className="chat-person">
                  <strong>
                    {otherName}
                  </strong>
                  <span>
                    Prywatna rozmowa dotycząca zlecenia
                  </span>
                </div>
              </header>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    Rozmowa została otwarta.
                    Napisz pierwszą wiadomość
                    i ustal szczegóły współpracy.
                  </div>
                ) : (
                  messages.map(
                    (message) => (
                      <div
                        key={
                          message.id
                        }
                        className={`chat-message ${
                          message.sender_id ===
                          user.id
                            ? "is-mine"
                            : "is-theirs"
                        }`}
                      >
                        <p>
                          {
                            message.content
                          }
                        </p>

                        <time>
                          {new Date(
                            message.created_at
                          ).toLocaleTimeString(
                            "pl-PL",
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </time>
                      </div>
                    )
                  )
                )}
              </div>

              {errorMessage && (
                <p className="chat-error">
                  {errorMessage}
                </p>
              )}

              <form
                className="chat-form"
                onSubmit={
                  handleSend
                }
              >
                <textarea
                  value={draft}
                  onChange={(event) =>
                    setDraft(
                      event.target.value
                    )
                  }
                  placeholder="Napisz wiadomość..."
                  maxLength={4000}
                  disabled={sending}
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      event.currentTarget
                        .form
                        ?.requestSubmit();
                    }
                  }}
                />

                <button
                  type="submit"
                  className="chat-send"
                  disabled={
                    sending ||
                    !draft.trim()
                  }
                >
                  {sending
                    ? "Wysyłanie..."
                    : "Wyślij"}
                </button>
              </form>
            </>
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
  const {
    loading,
    session,
  } =
    useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <App
      session={session}
      loading={loading}
    />
  );
}

/* =========================================================
   ROUTER
========================================================= */

function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Sorts />

        <style>{`
          .ideahire-multiline-field {
            display: block;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.55;
            resize: vertical;
            overflow-x: hidden;
          }

          .ideahire-title-field {
            min-height: 62px;
          }

          .ideahire-about-field,
          .ideahire-description-field {
            min-height: 150px;
          }

          .job-card,
          .job-card h1,
          .job-card h2,
          .job-card h3,
          .job-card p,
          .profile-about,
          .profile-about p {
            min-width: 0;
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          @media (max-width: 600px) {
            .ideahire-multiline-field {
              width: 100%;
              max-width: 100%;
              font-size: 16px;
              line-height: 1.5;
            }

            .ideahire-title-field {
              min-height: 68px;
            }

            .ideahire-about-field,
            .ideahire-description-field {
              min-height: 175px;
            }
          }
        `}</style>

        <Routes>
          <Route
            path="/"
            element={
              passwordRecoveryRequested
                ? <ResetPassword />
                : <Home />
            }
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
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <Chat />
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
