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

  function adoptSession(newSession) {
    setSession(newSession || null);
    setUser(newSession?.user || null);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    let confirmedSession = false;
    let signedOut = false;
    let signedOutTimer = null;

    function applySession(newSession) {
      if (!mounted) return;

      if (newSession) {
        confirmedSession = true;
        signedOut = false;
      }

      adoptSession(newSession);
    }

    function wait(milliseconds) {
      return new Promise(
        (resolve) => {
          window.setTimeout(
            resolve,
            milliseconds
          );
        }
      );
    }

    async function initializeAuth() {
      try {
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
               * INITIAL_SESSION z prawidłową sesją przyjmujemy od razu.
               * Chwilowego null nie traktujemy jako wylogowania, dopóki
               * initializeAuth nie zakończy bezpiecznych ponownych prób.
               */
              if (
                event ===
                "INITIAL_SESSION"
              ) {
                if (newSession) {
                  applySession(
                    newSession
                  );
                }

                return;
              }

              if (
                event === "SIGNED_OUT"
              ) {
                signedOut = true;
                confirmedSession = false;

                /*
                 * Nie przekierowujemy w tej samej milisekundzie. Najpierw
                 * sprawdzamy, czy zdarzenie nie było chwilowym efektem
                 * synchronizacji karty lub odświeżania tokenu.
                 */
                setLoading(true);

                if (signedOutTimer) {
                  window.clearTimeout(
                    signedOutTimer
                  );
                }

                signedOutTimer =
                  window.setTimeout(
                    async () => {
                      try {
                        const {
                          data,
                          error,
                        } =
                          await supabase.auth.getSession();

                        if (!mounted) return;

                        if (error) {
                          console.error(
                            "AUTH SIGN OUT CHECK ERROR:",
                            error
                          );
                        }

                        if (data?.session) {
                          applySession(
                            data.session
                          );
                          return;
                        }
                      } catch (error) {
                        console.error(
                          "AUTH SIGN OUT CHECK ERROR:",
                          error
                        );
                      }

                      if (mounted) {
                        adoptSession(null);
                      }
                    },
                    240
                  );

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

        /*
         * Na części urządzeń zapis sesji w localStorage może być przez
         * moment niedostępny po przeładowaniu karty. Nie przekierowujemy
         * wtedy od razu do logowania — wykonujemy kilka krótkich odczytów.
         */
        const retryDelays = [
          0,
          180,
          520,
        ];

        for (
          let attempt = 0;
          attempt <
          retryDelays.length;
          attempt += 1
        ) {
          if (
            !mounted ||
            confirmedSession ||
            signedOut
          ) {
            return;
          }

          if (
            retryDelays[attempt] > 0
          ) {
            await wait(
              retryDelays[attempt]
            );
          }

          if (
            !mounted ||
            confirmedSession ||
            signedOut
          ) {
            return;
          }

          const { data, error } =
            await supabase.auth.getSession();

          if (error) {
            console.error(
              "AUTH SESSION ERROR:",
              error
            );
          }

          if (data?.session) {
            applySession(
              data.session
            );
            return;
          }
        }

        if (
          mounted &&
          !confirmedSession &&
          !signedOut
        ) {
          applySession(null);
        }
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

      if (signedOutTimer) {
        window.clearTimeout(
          signedOutTimer
        );
      }

      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        adoptSession,
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

      const {
        data: blockNotifications,
        error: blockNotificationsError,
      } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocked_id", user.id);

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

      if (blockNotificationsError) {
        console.error(
          "BLOCK NOTIFICATION ERROR:",
          blockNotificationsError
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

      const unreadBlock =
        (blockNotifications || []).some(
          (block) =>
            !readIds.includes(
              `blocked:${block.id}`
            )
        );

      setHasNotifications(
        unreadIncoming ||
        unreadRejected ||
        unreadAccepted ||
        unreadBlock
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
    adoptSession,
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

      /*
       * Przekazujemy świeżą sesję do routera przed przejściem na stronę
       * chronioną. Zapobiega to pętli login -> konto -> login na wolniejszych
       * urządzeniach i przy opóźnionym zdarzeniu SIGNED_IN.
       */
      adoptSession(
        data.session
      );

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

  const [
    specialtyCategories,
    setSpecialtyCategories,
  ] = useState([]);

  const [
    specialization,
    setSpecialization,
  ] = useState("");

  const [skills, setSkills] =
    useState([]);

  const [skillDraft, setSkillDraft] =
    useState("");

  const [
    profileDetailsLoading,
    setProfileDetailsLoading,
  ] = useState(true);

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
    if (!user?.id) {
      setSpecialtyCategories([]);
      setSpecialization("");
      setSkills([]);
      setSkillDraft("");
      setProfileDetailsLoading(false);
      return;
    }

    let mounted = true;

    async function loadProfileDetails() {
      setProfileDetailsLoading(true);

      try {
        const { data, error } =
          await supabase
            .from("profiles")
            .select(
              "specialty_categories, specialization, skills"
            )
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
          console.error(
            "PROFILE DETAILS LOAD ERROR:",
            error
          );
          return;
        }

        if (!mounted) return;

        const storedCategories =
          Array.isArray(
            data?.specialty_categories
          )
            ? data.specialty_categories
            : [];

        setSpecialtyCategories(
          storedCategories.filter(
            (category) =>
              JOB_CATEGORIES.includes(
                category
              )
          )
        );

        setSpecialization(
          data?.specialization || ""
        );

        setSkills(
          Array.isArray(data?.skills)
            ? data.skills.filter(
                (skill) =>
                  typeof skill ===
                    "string" &&
                  !!skill.trim()
              )
            : []
        );
      } finally {
        if (mounted) {
          setProfileDetailsLoading(false);
        }
      }
    }

    loadProfileDetails();

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

    const cleanSpecialization =
      specialization.trim();

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
              specialty_categories:
                specialtyCategories,
              specialization:
                cleanSpecialization ||
                null,
              skills,
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
            specialty_categories:
              specialtyCategories,
            specialization:
              cleanSpecialization ||
              null,
            skills,
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
      setSpecialization(
        cleanSpecialization
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

  function toggleSpecialtyCategory(
    category
  ) {
    setMessage("");

    setSpecialtyCategories(
      (current) => {
        if (
          current.includes(
            category
          )
        ) {
          return current.filter(
            (item) =>
              item !== category
          );
        }

        if (current.length >= 3) {
          setMessage(
            "Możesz wybrać maksymalnie 3 kategorie specjalizacji."
          );
          return current;
        }

        return [
          ...current,
          category,
        ];
      }
    );
  }

  function addSkill() {
    const cleanSkill =
      skillDraft
        .trim()
        .replace(/\s+/g, " ");

    setMessage("");

    if (!cleanSkill) return;

    if (skills.length >= 12) {
      setMessage(
        "Możesz dodać maksymalnie 12 umiejętności."
      );
      return;
    }

    if (
      skills.some(
        (skill) =>
          skill.toLocaleLowerCase(
            "pl-PL"
          ) ===
          cleanSkill.toLocaleLowerCase(
            "pl-PL"
          )
      )
    ) {
      setMessage(
        "Ta umiejętność jest już dodana."
      );
      return;
    }

    setSkills((current) => [
      ...current,
      cleanSkill,
    ]);
    setSkillDraft("");
  }

  function handleSkillKeyDown(
    event
  ) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addSkill();
    }
  }

  function removeSkill(skillToRemove) {
    setSkills(
      (current) =>
        current.filter(
          (skill) =>
            skill !== skillToRemove
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

            <fieldset className="profile-specialties-field">
              <legend>
                Kategorie specjalizacji
              </legend>

              <p className="profile-field-hint">
                Wybierz maksymalnie 3 obszary, w których najlepiej się odnajdujesz.
              </p>

              <div className="profile-category-options">
                {JOB_CATEGORIES.map(
                  (category) => {
                    const selected =
                      specialtyCategories.includes(
                        category
                      );

                    return (
                      <button
                        key={category}
                        type="button"
                        className={`profile-category-option ${
                          selected
                            ? "is-selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleSpecialtyCategory(
                            category
                          )
                        }
                        disabled={
                          saving ||
                          uploading ||
                          profileDetailsLoading
                        }
                        aria-pressed={selected}
                      >
                        <span aria-hidden="true">
                          {selected
                            ? "✓"
                            : "+"}
                        </span>

                        {category}
                      </button>
                    );
                  }
                )}
              </div>

              <small>
                Wybrano: {specialtyCategories.length}/3
              </small>
            </fieldset>

            <fieldset className="profile-skills-field">
              <legend>
                Umiejętności
              </legend>

              <p className="profile-field-hint">
                Dodaj konkretne narzędzia i umiejętności. Każda pozycja pojawi się na profilu jako osobny kafelek.
              </p>

              <div className="profile-skill-entry">
                <input
                  type="text"
                  value={skillDraft}
                  onChange={(event) =>
                    setSkillDraft(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleSkillKeyDown
                  }
                  maxLength={40}
                  placeholder="Np. Adobe Illustrator"
                  disabled={
                    saving ||
                    uploading ||
                    profileDetailsLoading
                  }
                />

                <button
                  type="button"
                  className="profile-add-skill"
                  onClick={addSkill}
                  disabled={
                    !skillDraft.trim() ||
                    skills.length >= 12 ||
                    saving ||
                    uploading ||
                    profileDetailsLoading
                  }
                >
                  Dodaj
                </button>
              </div>

              {skills.length > 0 && (
                <div className="profile-edit-skill-chips">
                  {skills.map(
                    (skill) => (
                      <span
                        className="profile-edit-skill-chip"
                        key={skill}
                      >
                        {skill}

                        <button
                          type="button"
                          onClick={() =>
                            removeSkill(
                              skill
                            )
                          }
                          aria-label={`Usuń umiejętność: ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}
                </div>
              )}

              <small>
                Dodano: {skills.length}/12. Naciśnij Enter lub przecinek, aby szybko dodać pozycję.
              </small>
            </fieldset>

            <label>
              W czym się specjalizujesz?

              <textarea
                className="ideahire-multiline-field ideahire-specialization-field"
                rows="5"
                value={specialization}
                onChange={(event) =>
                  setSpecialization(
                    event.target.value
                  )
                }
                maxLength={1200}
                placeholder="Np. tworzę nowoczesne strony internetowe, projektuję identyfikację wizualną i dbam o czytelne doświadczenie użytkownika..."
                disabled={
                  saving ||
                  uploading ||
                  profileDetailsLoading
                }
              />

              <small>
                Opisz konkretnie swoje najmocniejsze umiejętności, doświadczenie i rodzaj projektów, które realizujesz.
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
                uploading ||
                profileDetailsLoading
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

  const { user } =
    useAuth();

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

  const [blockedByMe, setBlockedByMe] =
    useState(false);

  const [blockedMe, setBlockedMe] =
    useState(false);

  const [blockSaving, setBlockSaving] =
    useState(false);

  const [blockMessage, setBlockMessage] =
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
              "id, name, avatar_url, about, specialty_categories, specialization, skills, completed_jobs, disputed_jobs, positive_reviews, neutral_reviews, negative_reviews, posted_jobs"
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

        if (
          user?.id &&
          user.id !== id
        ) {
          const [
            blockedByMeResult,
            blockedMeResult,
          ] = await Promise.all([
            supabase
              .from("user_blocks")
              .select("id")
              .eq("blocker_id", user.id)
              .eq("blocked_id", id)
              .maybeSingle(),

            supabase
              .from("user_blocks")
              .select("id")
              .eq("blocker_id", id)
              .eq("blocked_id", user.id)
              .maybeSingle(),
          ]);

          if (blockedByMeResult.error) {
            console.error(
              "PROFILE BLOCK STATUS ERROR:",
              blockedByMeResult.error
            );
          }

          if (blockedMeResult.error) {
            console.error(
              "PROFILE BLOCKED STATUS ERROR:",
              blockedMeResult.error
            );
          }

          setBlockedByMe(
            !!blockedByMeResult.data?.id
          );

          setBlockedMe(
            !!blockedMeResult.data?.id
          );
        }

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
  }, [id, user?.id]);

  async function handleBlockToggle(
    event
  ) {
    const menu =
      event?.currentTarget?.closest(
        "details"
      );

    if (
      !user?.id ||
      !id ||
      user.id === id ||
      blockSaving
    ) {
      return;
    }

    setBlockSaving(true);
    setBlockMessage("");

    try {
      if (blockedByMe) {
        const { error } =
          await supabase
            .from("user_blocks")
            .delete()
            .eq("blocker_id", user.id)
            .eq("blocked_id", id);

        if (error) {
          throw error;
        }

        setBlockedByMe(false);
        setBlockMessage(
          "Użytkownik został odblokowany."
        );
      } else {
        const { error } =
          await supabase
            .from("user_blocks")
            .insert({
              blocker_id: user.id,
              blocked_id: id,
            });

        if (error) {
          throw error;
        }

        setBlockedByMe(true);
        setBlockMessage(
          "Użytkownik został zablokowany. Nie może już wysyłać Ci wiadomości."
        );
      }
    } catch (error) {
      setBlockMessage(
        `Nie udało się zmienić blokady: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setBlockSaving(false);
      menu?.removeAttribute(
        "open"
      );
    }
  }

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

  const isOtherProfile =
    !!user?.id &&
    user.id !== id;

  const profileHidden =
    isOtherProfile &&
    (blockedByMe || blockedMe);

  const visibleSpecialtyCategories =
    Array.isArray(
      profile.specialty_categories
    )
      ? profile.specialty_categories.filter(
          (category) =>
            JOB_CATEGORIES.includes(
              category
            )
        )
      : [];

  const visibleSkills =
    Array.isArray(profile.skills)
      ? profile.skills.filter(
          (skill) =>
            typeof skill ===
              "string" &&
            !!skill.trim()
        )
      : [];

  const completedJobs =
    Math.max(
      0,
      Number(
        profile.completed_jobs
      ) || 0
    );

  const disputedJobs =
    Math.max(
      0,
      Number(
        profile.disputed_jobs
      ) || 0
    );

  const positiveReviews =
    Math.max(
      0,
      Number(
        profile.positive_reviews
      ) || 0
    );

  const neutralReviews =
    Math.max(
      0,
      Number(
        profile.neutral_reviews
      ) || 0
    );

  const negativeReviews =
    Math.max(
      0,
      Number(
        profile.negative_reviews
      ) || 0
    );

  const totalReviews =
    positiveReviews +
    neutralReviews +
    negativeReviews;

  const hasExpertiseDetails =
    visibleSpecialtyCategories.length > 0 ||
    visibleSkills.length > 0;

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <style>{`
          .profile-card-with-menu {
            position: relative;
          }

          .profile-card-with-menu .profile-preview {
            padding-right: 58px;
          }

          .profile-more-menu {
            position: absolute;
            z-index: 20;
            top: 18px;
            right: 18px;
          }

          .profile-more-menu summary {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border: 1px solid #e2e2de;
            border-radius: 50%;
            background: #fff;
            color: #555550;
            font-size: 21px;
            font-weight: 800;
            line-height: 1;
            letter-spacing: 2px;
            cursor: pointer;
            list-style: none;
            box-shadow: 0 6px 18px rgba(20,20,20,.06);
          }

          .profile-more-menu summary::-webkit-details-marker {
            display: none;
          }

          .profile-more-menu summary:hover,
          .profile-more-menu[open] summary {
            border-color: #cfcfca;
            background: #f7f7f4;
          }

          .profile-more-dropdown {
            position: absolute;
            top: 49px;
            right: 0;
            width: max-content;
            min-width: 210px;
            padding: 7px;
            border: 1px solid #e4e4df;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 16px 38px rgba(20,20,20,.14);
          }

          .profile-more-dropdown button {
            width: 100%;
            min-height: 42px;
            padding: 10px 12px;
            border: 0;
            border-radius: 10px;
            background: transparent;
            color: #8e352b;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
          }

          .profile-more-dropdown button.is-unblock {
            color: #315b35;
          }

          .profile-more-dropdown button:hover {
            background: #f7f7f4;
          }

          .profile-more-dropdown button:disabled {
            cursor: wait;
            opacity: .6;
          }

          .profile-hidden-avatar {
            display: grid;
            place-items: center;
            background: #dfdfda;
            color: #74746f;
            font-size: 38px;
            font-weight: 400;
          }

          .profile-hidden-copy h1 {
            color: #555550;
          }

          .profile-hidden-copy p {
            max-width: 540px;
            margin: 8px 0 0;
            color: #85857f;
            font-size: 13px;
            line-height: 1.6;
          }

          .profile-expertise {
            display: grid;
            grid-template-columns: minmax(0, .9fr) minmax(0, 1.4fr);
            gap: 18px;
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid #ededeb;
          }

          .profile-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 2px;
          }

          .profile-stat-card {
            min-width: 0;
            padding: 19px 20px;
            border: 1px solid #e7e7e2;
            border-radius: 18px;
            background: #fafaf8;
          }

          .profile-stat-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .profile-stat-top strong {
            color: #33332f;
            font-size: 14px;
          }

          .profile-stat-value {
            color: #171717;
            font-size: 27px;
            font-weight: 850;
            line-height: 1;
          }

          .profile-stat-breakdown {
            display: flex;
            flex-wrap: wrap;
            gap: 6px 13px;
            margin-top: 13px;
            color: #85857f;
            font-size: 11px;
            line-height: 1.4;
          }

          .profile-content-card {
            min-width: 0;
            margin-top: 18px;
            padding: 20px;
            border: 1px solid #e8e8e3;
            border-radius: 18px;
            background: #fafaf8;
          }

          .profile-about-copy {
            margin: 0;
            color: #555550;
            font-size: 14px;
            line-height: 1.7;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .profile-expertise-card {
            min-width: 0;
            padding: 20px;
            border: 1px solid #e8e8e3;
            border-radius: 18px;
            background: #fafaf8;
          }

          .profile-expertise-label {
            display: block;
            margin-bottom: 12px;
            color: #888882;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .profile-specialty-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .profile-specialty-chip {
            display: inline-flex;
            align-items: center;
            min-height: 34px;
            padding: 7px 11px;
            border: 1px solid #dcdcd6;
            border-radius: 999px;
            background: #fff;
            color: #33332f;
            font-size: 12px;
            font-weight: 700;
          }

          .profile-specialization-copy {
            margin: 0;
            color: #555550;
            font-size: 14px;
            line-height: 1.7;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .profile-specialization-card {
            margin-top: 18px;
          }

          .profile-block-notice,
          .profile-block-message {
            margin: 14px 0 0;
            padding: 12px 14px;
            border-radius: 12px;
            background: #f7f7f4;
            color: #666;
            font-size: 13px;
            line-height: 1.55;
          }

          @media (max-width: 600px) {
            .profile-card-with-menu .profile-preview {
              padding-right: 46px;
            }

            .profile-more-menu {
              top: 13px;
              right: 13px;
            }

            .profile-more-menu summary {
              width: 38px;
              height: 38px;
            }

            .profile-more-dropdown {
              top: 45px;
            }

            .profile-expertise {
              grid-template-columns: 1fr;
            }

            .profile-expertise-card {
              padding: 17px;
            }

            .profile-stats {
              grid-template-columns: 1fr;
            }

            .profile-stat-card,
            .profile-content-card {
              padding: 17px;
            }
          }
        `}</style>

        <section className={`account-card ${
          isOtherProfile
            ? "profile-card-with-menu"
            : ""
        }`}>
          {isOtherProfile && (
            <details className="profile-more-menu">
              <summary
                aria-label="Więcej opcji profilu"
                title="Więcej opcji"
              >
                ···
              </summary>

              <div className="profile-more-dropdown">
                <button
                  type="button"
                  className={
                    blockedByMe
                      ? "is-unblock"
                      : ""
                  }
                  onClick={
                    handleBlockToggle
                  }
                  disabled={blockSaving}
                >
                  {blockSaving
                    ? "Zapisywanie..."
                    : blockedByMe
                    ? "Odblokuj użytkownika"
                    : "Zablokuj użytkownika"}
                </button>
              </div>
            </details>
          )}

          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {profileHidden ? (
                <div
                  className="profile-avatar profile-hidden-avatar"
                  aria-hidden="true"
                >
                  ×
                </div>
              ) : profile.avatar_url ? (
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

            <div className={`profile-info ${
              profileHidden
                ? "profile-hidden-copy"
                : ""
            }`}>
              <h1>
                {profileHidden
                  ? "Zablokowany użytkownik"
                  : name}
              </h1>

              {!profileHidden &&
                countryCode && (
                <CountryBadge
                  countryCode={countryCode}
                />
              )}

              {profileHidden && (
                <p>
                  Zdjęcie, nazwa, opis i aktywność tego profilu są ukryte.
                </p>
              )}
            </div>
          </div>

          {isOtherProfile && (
              <>
                {blockedMe && (
                  <p className="profile-block-notice">
                    Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości między Wami jest wyłączone.
                  </p>
                )}

                {blockMessage && (
                  <p className="profile-block-message">
                    {blockMessage}
                  </p>
                )}
              </>
            )}

          {!profileHidden && (
            <div className="profile-stats">
              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <strong>
                    Wykonane zlecenia
                  </strong>

                  <span className="profile-stat-value">
                    {completedJobs}
                  </span>
                </div>

                <div className="profile-stat-breakdown">
                  <span>
                    Zakończone: {completedJobs}
                  </span>

                  <span>
                    Sporne: {disputedJobs}
                  </span>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <strong>
                    Opinie
                  </strong>

                  <span className="profile-stat-value">
                    {totalReviews}
                  </span>
                </div>

                <div className="profile-stat-breakdown">
                  <span>
                    Pozytywne: {positiveReviews}
                  </span>

                  <span>
                    Neutralne: {neutralReviews}
                  </span>

                  <span>
                    Negatywne: {negativeReviews}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!profileHidden &&
            profile.about?.trim() && (
              <div className="profile-content-card">
                <span className="profile-expertise-label">
                  O mnie
                </span>

                <p className="profile-about-copy">
                  {profile.about}
                </p>
              </div>
            )}

          {!profileHidden &&
            hasExpertiseDetails && (
              <div className="profile-expertise">
                {visibleSpecialtyCategories.length > 0 && (
                  <div className="profile-expertise-card">
                    <span className="profile-expertise-label">
                      Kategorie specjalizacji
                    </span>

                    <div className="profile-specialty-chips">
                      {visibleSpecialtyCategories.map(
                        (category) => (
                          <span
                            className="profile-specialty-chip"
                            key={category}
                          >
                            {category}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {visibleSkills.length > 0 && (
                  <div className="profile-expertise-card">
                    <span className="profile-expertise-label">
                      Umiejętności
                    </span>

                    <div className="profile-specialty-chips">
                      {visibleSkills.map(
                        (skill) => (
                          <span
                            className="profile-specialty-chip"
                            key={skill}
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {!profileHidden &&
            profile.specialization?.trim() && (
              <div className="profile-expertise-card profile-specialization-card">
                <span className="profile-expertise-label">
                  W czym się specjalizuję
                </span>

                <p className="profile-specialization-copy">
                  {profile.specialization}
                </p>
              </div>
            )}
        </section>

        {!profileHidden && (
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
        )}
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

                      <div className="job-details-actions">
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

                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() =>
                            setOpenJobId(
                              null
                            )
                          }
                        >
                          Ukryj szczegóły ↑
                        </button>
                      </div>

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

                  {!isOpen && (
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
                      Zobacz zlecenie →
                    </button>

                    {!isOwner && (
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
                  )}
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

  const [
    blockNotifications,
    setBlockNotifications,
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
            "id, job_id, client_id, contractor_id, agreements_required, created_at"
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
       * 4. Informacje o zablokowaniu profilu.
       * Osoba zablokowana widzi czytelny status w skrzynce.
       */
      const {
        data: blockRows,
        error: blockRowsError,
      } = await supabase
        .from("user_blocks")
        .select(
          "id, blocker_id, blocked_id, created_at"
        )
        .eq("blocked_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (blockRowsError) {
        throw blockRowsError;
      }

      const visibleBlockRows =
        (blockRows || []).filter(
          (block) =>
            !dismissedIds.includes(
              `blocked:${block.id}`
            )
        );

      let blockResult = [];

      if (visibleBlockRows.length > 0) {
        const blockerIds = [
          ...new Set(
            visibleBlockRows.map(
              (block) =>
                block.blocker_id
            )
          ),
        ];

        const {
          data: blockerProfiles,
          error: blockerProfilesError,
        } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", blockerIds);

        if (blockerProfilesError) {
          console.error(
            "BLOCK NOTIFICATION PROFILE ERROR:",
            blockerProfilesError
          );
        }

        const blockerProfileMap =
          new Map(
            (blockerProfiles || []).map(
              (profile) => [
                profile.id,
                profile,
              ]
            )
          );

        blockResult =
          visibleBlockRows.map(
            (block) => ({
              ...block,
              blocker:
                blockerProfileMap.get(
                  block.blocker_id
                ),
            })
          );
      }

      setBlockNotifications(
        blockResult
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
        ...blockResult.map(
          (item) =>
            `blocked:${item.id}`
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
      ...blockNotifications.map(
        (item) =>
          `blocked:${item.id}`
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
    setBlockNotifications([]);

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
    acceptedDecisions.length === 0 &&
    blockNotifications.length === 0;

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

          .notification-block-card {
            border-color: #e4dedc;
            background:
              linear-gradient(
                180deg,
                #fff 0%,
                #fbf8f7 100%
              );
          }

          .notification-block-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            margin-bottom: 14px;
            border-radius: 50%;
            background: #efe9e7;
            color: #704a43;
            font-size: 17px;
            font-weight: 800;
          }

          .notification-block-card h2 {
            margin: 0 0 9px;
            font-size: 20px;
            line-height: 1.35;
          }

          .notification-block-card p {
            margin: 0;
            color: #666;
            line-height: 1.65;
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
            acceptedDecisions.length > 0 ||
            blockNotifications.length > 0) && (
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
          blockNotifications.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Informacje o profilach
                </span>
              </div>

              <div className="jobs-list">
                {blockNotifications.map(
                  (block) => {
                    const blockerName =
                      block.blocker?.name ||
                      "Użytkownik";

                    return (
                      <article
                        className="job-card notification-block-card"
                        key={`blocked-${block.id}`}
                      >
                        <div className="notification-block-icon">
                          !
                        </div>

                        <span className="section-label">
                          Zmiana możliwości kontaktu
                        </span>

                        <h2>
                          {blockerName} zablokował Twój profil
                        </h2>

                        <p>
                          Nie możecie obecnie wysyłać sobie wiadomości. Informację możesz usunąć przyciskiem „Wyczyść przeczytane”.
                        </p>

                        <Link
                          className="btn btn-outline notification-chat-button"
                          to={`/profile/${block.blocker_id}`}
                        >
                          Zobacz profil →
                        </Link>
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
          statesResult,
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
              "id, conversation_id, sender_id, content, created_at, read_at"
            )
            .in(
              "conversation_id",
              conversationIds
            )
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from(
              "conversation_user_state"
            )
            .select(
              "conversation_id, hidden_at"
            )
            .eq("user_id", user.id)
            .in(
              "conversation_id",
              conversationIds
            ),
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

        if (statesResult.error) {
          throw statesResult.error;
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

        const hiddenAtMap =
          new Map(
            (statesResult.data || []).map(
              (state) => [
                state.conversation_id,
                state.hidden_at,
              ]
            )
          );

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
            .filter((conversation) => {
              const hiddenAt =
                hiddenAtMap.get(
                  conversation.id
                );

              if (!hiddenAt) {
                return true;
              }

              const lastMessage =
                lastMessageMap.get(
                  conversation.id
                );

              return (
                !!lastMessage?.created_at &&
                new Date(
                  lastMessage.created_at
                ).getTime() >
                  new Date(
                    hiddenAt
                  ).getTime()
              );
            })
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

const EMPTY_AGREEMENT_FORM = {
  title: "",
  scope: "",
  deliverables: "",
  priceAmount: "",
  priceCurrency: "PLN",
  deadline: "",
  revisions: "1",
  deliveryFormat: "",
  acceptanceMethod: "",
  cancellationTerms: "",
  additionalTerms: "",
};

function agreementToForm(
  agreement,
  fallbackTitle = ""
) {
  if (!agreement) {
    return {
      ...EMPTY_AGREEMENT_FORM,
      title: fallbackTitle || "",
    };
  }

  return {
    title: agreement.title || "",
    scope: agreement.scope || "",
    deliverables:
      agreement.deliverables || "",
    priceAmount:
      agreement.price_amount == null
        ? ""
        : String(agreement.price_amount),
    priceCurrency:
      agreement.price_currency || "PLN",
    deadline: agreement.deadline || "",
    revisions: String(
      agreement.revisions ?? 0
    ),
    deliveryFormat:
      agreement.delivery_format || "",
    acceptanceMethod:
      agreement.acceptance_method || "",
    cancellationTerms:
      agreement.cancellation_terms || "",
    additionalTerms:
      agreement.additional_terms || "",
  };
}

function AgreementDetails({ agreement }) {
  if (!agreement) return null;

  const price = new Intl.NumberFormat(
    "pl-PL",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(agreement.price_amount)
  );

  const deadline = new Date(
    `${agreement.deadline}T12:00:00`
  ).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="agreement-details">
      <div className="agreement-detail agreement-detail-wide">
        <span>Nazwa zlecenia</span>
        <strong>{agreement.title}</strong>
      </div>

      <div className="agreement-detail">
        <span>Cena</span>
        <strong>
          {price} {agreement.price_currency}
        </strong>
      </div>

      <div className="agreement-detail">
        <span>Termin wykonania</span>
        <strong>{deadline}</strong>
      </div>

      <div className="agreement-detail">
        <span>Liczba poprawek</span>
        <strong>{agreement.revisions}</strong>
      </div>

      <div className="agreement-detail">
        <span>Format przekazania pracy</span>
        <strong>
          {agreement.delivery_format}
        </strong>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Zakres pracy</span>
        <p>{agreement.scope}</p>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Rezultat końcowy</span>
        <p>{agreement.deliverables}</p>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Sposób odbioru pracy</span>
        <p>{agreement.acceptance_method}</p>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Warunki anulowania</span>
        <p>{agreement.cancellation_terms}</p>
      </div>

      {!!agreement.additional_terms && (
        <div className="agreement-detail agreement-detail-wide">
          <span>Dodatkowe ustalenia</span>
          <p>{agreement.additional_terms}</p>
        </div>
      )}
    </div>
  );
}

function AgreementPanel({
  required,
  agreement,
  loading,
  saving,
  mode,
  form,
  message,
  currentUserAccepted,
  otherUserAccepted,
  blocked,
  onFieldChange,
  onOpenForm,
  onCancelForm,
  onSubmit,
  onAccept,
}) {
  const [confirmed, setConfirmed] =
    useState(false);

  useEffect(() => {
    setConfirmed(false);
  }, [mode, agreement?.id]);

  if (!required) return null;

  if (loading) {
    return (
      <section className="agreement-gate agreement-loading">
        <span className="agreement-lock-icon">
          ◌
        </span>
        <p>Ładowanie warunków współpracy...</p>
      </section>
    );
  }

  if (agreement?.status === "accepted") {
    return (
      <details className="agreement-summary">
        <summary>
          <span className="agreement-status-icon">
            ✓
          </span>

          <span className="agreement-summary-copy">
            <strong>
              Warunki współpracy zaakceptowane
            </strong>
            <small>
              Wersja {agreement.version} · Czat jest aktywny
            </small>
          </span>

          <span className="agreement-summary-action">
            Pokaż ustalenia
          </span>
        </summary>

        <div className="agreement-summary-body">
          <AgreementDetails
            agreement={agreement}
          />

          <p className="agreement-legal-note">
            Ta zaakceptowana wersja jest zapisem ustaleń obu stron i pozostaje dostępna w historii rozmowy.
          </p>
        </div>
      </details>
    );
  }

  return (
    <section className="agreement-gate">
      <div className="agreement-gate-heading">
        <span className="agreement-eyebrow">
          Ustalenia przed rozpoczęciem
        </span>

        <h2>Najpierw ustalcie warunki współpracy</h2>

        <p>
          Czat odblokuje się, gdy obie strony zaakceptują dokładnie tę samą wersję ustaleń.
        </p>

        <div className="agreement-progress" aria-label="Postęp akceptacji">
          <span className={currentUserAccepted ? "is-complete" : ""}>
            <i>{currentUserAccepted ? "✓" : "1"}</i>
            Twoja akceptacja
          </span>

          <b aria-hidden="true" />

          <span className={otherUserAccepted ? "is-complete" : ""}>
            <i>{otherUserAccepted ? "✓" : "2"}</i>
            Akceptacja drugiej strony
          </span>
        </div>
      </div>

      {mode === "form" ? (
        <form
          className="agreement-form"
          onSubmit={onSubmit}
        >
          <div className="agreement-form-heading">
            <div>
              <span className="agreement-version-pill">
                {agreement
                  ? `Nowa wersja ${agreement.version + 1}`
                  : "Pierwsza propozycja"}
              </span>
              <h3>Warunki realizacji zlecenia</h3>
            </div>

            <p>
              Pola oznaczone gwiazdką są wymagane.
            </p>
          </div>

          <div className="agreement-form-grid">
            <label className="agreement-field agreement-field-wide">
              <span>Nazwa zlecenia *</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  onFieldChange(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Np. Projekt strony internetowej"
                maxLength={140}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Zakres pracy *</span>
              <textarea
                value={form.scope}
                onChange={(event) =>
                  onFieldChange(
                    "scope",
                    event.target.value
                  )
                }
                placeholder="Opisz dokładnie, co ma zostać wykonane..."
                maxLength={4000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Rezultat końcowy *</span>
              <textarea
                value={form.deliverables}
                onChange={(event) =>
                  onFieldChange(
                    "deliverables",
                    event.target.value
                  )
                }
                placeholder="Wymień pliki, materiały lub funkcje, które mają zostać przekazane..."
                maxLength={2500}
                required
              />
            </label>

            <label className="agreement-field">
              <span>Cena *</span>
              <div className="agreement-price-input">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceAmount}
                  onChange={(event) =>
                    onFieldChange(
                      "priceAmount",
                      event.target.value
                    )
                  }
                  placeholder="1500"
                  required
                />
                <select
                  value={form.priceCurrency}
                  onChange={(event) =>
                    onFieldChange(
                      "priceCurrency",
                      event.target.value
                    )
                  }
                  aria-label="Waluta"
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </label>

            <label className="agreement-field">
              <span>Termin wykonania *</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.deadline}
                onChange={(event) =>
                  onFieldChange(
                    "deadline",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="agreement-field">
              <span>Liczba poprawek *</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.revisions}
                onChange={(event) =>
                  onFieldChange(
                    "revisions",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="agreement-field">
              <span>Format przekazania pracy *</span>
              <input
                type="text"
                value={form.deliveryFormat}
                onChange={(event) =>
                  onFieldChange(
                    "deliveryFormat",
                    event.target.value
                  )
                }
                placeholder="Np. PDF, PNG i pliki źródłowe"
                maxLength={500}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Sposób odbioru pracy *</span>
              <textarea
                value={form.acceptanceMethod}
                onChange={(event) =>
                  onFieldChange(
                    "acceptanceMethod",
                    event.target.value
                  )
                }
                placeholder="Po czym obie strony poznają, że zlecenie zostało wykonane prawidłowo?"
                maxLength={2000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Warunki anulowania *</span>
              <textarea
                value={form.cancellationTerms}
                onChange={(event) =>
                  onFieldChange(
                    "cancellationTerms",
                    event.target.value
                  )
                }
                placeholder="Opisz zasady rezygnacji przed ukończeniem pracy..."
                maxLength={2000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Dodatkowe ustalenia</span>
              <textarea
                value={form.additionalTerms}
                onChange={(event) =>
                  onFieldChange(
                    "additionalTerms",
                    event.target.value
                  )
                }
                placeholder="Opcjonalne informacje, które warto zapisać..."
                maxLength={2500}
              />
            </label>
          </div>

          <label className="agreement-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) =>
                setConfirmed(
                  event.target.checked
                )
              }
            />
            <span>
              Potwierdzam, że zapoznałem się z warunkami współpracy i akceptuję treść wysyłanej propozycji.
            </span>
          </label>

          {message && (
            <p className="agreement-message">
              {message}
            </p>
          )}

          <div className="agreement-form-actions">
            {agreement && (
              <button
                type="button"
                className="agreement-secondary-button"
                onClick={onCancelForm}
                disabled={saving}
              >
                Anuluj zmiany
              </button>
            )}

            <button
              type="submit"
              className="agreement-primary-button"
              disabled={
                saving ||
                !confirmed ||
                blocked
              }
            >
              {saving
                ? "Zapisywanie..."
                : agreement
                ? "Wyślij nową propozycję"
                : "Wyślij propozycję"}
            </button>
          </div>
        </form>
      ) : agreement ? (
        <div className="agreement-proposal-card">
          <div className="agreement-proposal-topline">
            <div>
              <span className="agreement-version-pill">
                Wersja {agreement.version}
              </span>
              <h3>Propozycja warunków</h3>
            </div>

            <span className="agreement-pending-pill">
              Oczekuje na wspólną akceptację
            </span>
          </div>

          <AgreementDetails
            agreement={agreement}
          />

          {message && (
            <p className="agreement-message is-success">
              {message}
            </p>
          )}

          {blocked ? (
            <p className="agreement-blocked-note">
              Ustalenia są wstrzymane, ponieważ jeden z użytkowników jest zablokowany.
            </p>
          ) : (
            <div className="agreement-proposal-actions">
              <button
                type="button"
                className="agreement-secondary-button"
                onClick={onOpenForm}
                disabled={saving}
              >
                Zaproponuj zmiany
              </button>

              {!currentUserAccepted ? (
                <button
                  type="button"
                  className="agreement-primary-button"
                  onClick={onAccept}
                  disabled={saving}
                >
                  {saving
                    ? "Akceptowanie..."
                    : "Akceptuję warunki"}
                </button>
              ) : (
                <span className="agreement-waiting-note">
                  ✓ Zaakceptowałeś tę wersję. Czekamy na drugą stronę.
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

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

  const [deleting, setDeleting] =
    useState(false);

  const [blockedByMe, setBlockedByMe] =
    useState(false);

  const [blockedMe, setBlockedMe] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [jobTitle, setJobTitle] =
    useState("");

  const [agreement, setAgreement] =
    useState(null);

  const [agreementLoading, setAgreementLoading] =
    useState(true);

  const [agreementSaving, setAgreementSaving] =
    useState(false);

  const [agreementMode, setAgreementMode] =
    useState("view");

  const [agreementMessage, setAgreementMessage] =
    useState("");

  const [agreementForm, setAgreementForm] =
    useState(EMPTY_AGREEMENT_FORM);

  async function loadAgreement(
    conversationData,
    fallbackTitle = ""
  ) {
    if (
      !conversationData?.agreements_required
    ) {
      setAgreement(null);
      setAgreementLoading(false);
      return null;
    }

    setAgreementLoading(true);

    try {
      const { data, error } =
        await supabase
          .from(
            "conversation_agreements"
          )
          .select("*")
          .eq(
            "conversation_id",
            conversationData.id
          )
          .order("version", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (error) {
        throw error;
      }

      setAgreement(data || null);

      if (!data) {
        setAgreementForm(
          agreementToForm(
            null,
            fallbackTitle
          )
        );
        setAgreementMode("form");
      } else {
        setAgreementMode("view");
      }

      return data || null;
    } finally {
      setAgreementLoading(false);
    }
  }

  async function markIncomingMessagesAsRead(
    messageRows
  ) {
    const unreadIds =
      (messageRows || [])
        .filter(
          (message) =>
            message.sender_id !==
              user?.id &&
            !message.read_at
        )
        .map(
          (message) =>
            message.id
        );

    if (unreadIds.length === 0) {
      return messageRows || [];
    }

    const readAt =
      new Date().toISOString();

    const { error } =
      await supabase
        .from("messages")
        .update({
          read_at: readAt,
        })
        .in("id", unreadIds)
        .eq(
          "conversation_id",
          id
        );

    if (error) {
      console.error(
        "MESSAGE READ ERROR:",
        error
      );

      return messageRows || [];
    }

    return (messageRows || []).map(
      (message) =>
        unreadIds.includes(
          message.id
        )
          ? {
              ...message,
              read_at: readAt,
            }
          : message
    );
  }

  async function loadMessages() {
    if (!id) return;

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, created_at, read_at"
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

    const preparedMessages =
      await markIncomingMessagesAsRead(
        data || []
      );

    setMessages(preparedMessages);
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
            "id, job_id, client_id, contractor_id, agreements_required, created_at"
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

        const [
          profileResult,
          blockedByMeResult,
          blockedMeResult,
          jobResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url"
            )
            .eq(
              "id",
              otherUserId
            )
            .maybeSingle(),

          supabase
            .from("user_blocks")
            .select("id")
            .eq(
              "blocker_id",
              user.id
            )
            .eq(
              "blocked_id",
              otherUserId
            )
            .maybeSingle(),

          supabase
            .from("user_blocks")
            .select("id")
            .eq(
              "blocker_id",
              otherUserId
            )
            .eq(
              "blocked_id",
              user.id
            )
            .maybeSingle(),

          supabase
            .from("jobs")
            .select("title")
            .eq(
              "id",
              conversationData.job_id
            )
            .maybeSingle(),
        ]);

        const profileData =
          profileResult.data;

        const profileError =
          profileResult.error;

        if (profileError) {
          console.error(
            "CHAT PROFILE ERROR:",
            profileError
          );
        }

        if (blockedByMeResult.error) {
          console.error(
            "CHAT BLOCK STATUS ERROR:",
            blockedByMeResult.error
          );
        }

        if (blockedMeResult.error) {
          console.error(
            "CHAT BLOCKED STATUS ERROR:",
            blockedMeResult.error
          );
        }

        if (jobResult.error) {
          console.error(
            "CHAT JOB ERROR:",
            jobResult.error
          );
        }

        const loadedJobTitle =
          jobResult.data?.title || "";

        setJobTitle(
          loadedJobTitle
        );

        if (mounted) {
          setOtherProfile(
            profileData || null
          );

          setBlockedByMe(
            !!blockedByMeResult.data?.id
          );

          setBlockedMe(
            !!blockedMeResult.data?.id
          );
        }

        await loadAgreement(
          conversationData,
          loadedJobTitle
        );

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
            let newMessage =
              payload.new;

            if (
              newMessage.sender_id !==
              user.id
            ) {
              const readAt =
                new Date().toISOString();

              newMessage = {
                ...newMessage,
                read_at: readAt,
              };

              supabase
                .from("messages")
                .update({
                  read_at: readAt,
                })
                .eq("id", newMessage.id)
                .then(({ error }) => {
                  if (error) {
                    console.error(
                      "LIVE MESSAGE READ ERROR:",
                      error
                    );
                  }
                });
            }

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
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            const updatedMessage =
              payload.new;

            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.id ===
                    updatedMessage.id
                      ? {
                          ...message,
                          ...updatedMessage,
                        }
                      : message
                )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "conversation_agreements",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            setAgreement(
              payload.new
            );
            setAgreementMode("view");
            setAgreementMessage("");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table:
              "conversation_agreements",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            if (
              payload.new.status ===
              "superseded"
            ) {
              return;
            }

            setAgreement(
              payload.new
            );
            setAgreementMode("view");
            setAgreementMessage("");
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

  function updateAgreementField(
    field,
    value
  ) {
    setAgreementForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function openAgreementForm() {
    setAgreementMessage("");
    setAgreementForm(
      agreementToForm(
        agreement,
        jobTitle
      )
    );
    setAgreementMode("form");
  }

  async function handleAgreementSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !user?.id ||
      !id ||
      agreementSaving ||
      messagingBlocked
    ) {
      return;
    }

    const price = Number(
      String(
        agreementForm.priceAmount
      ).replace(",", ".")
    );

    const revisions = Number(
      agreementForm.revisions
    );

    if (
      agreementForm.title.trim().length < 3 ||
      agreementForm.scope.trim().length < 10 ||
      agreementForm.deliverables.trim().length < 3 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !agreementForm.deadline ||
      !Number.isInteger(revisions) ||
      revisions < 0 ||
      agreementForm.deliveryFormat.trim().length < 2 ||
      agreementForm.acceptanceMethod.trim().length < 3 ||
      agreementForm.cancellationTerms.trim().length < 3
    ) {
      setAgreementMessage(
        "Uzupełnij wszystkie wymagane pola i sprawdź cenę, termin oraz liczbę poprawek."
      );
      return;
    }

    setAgreementSaving(true);
    setAgreementMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "propose_conversation_agreement",
          {
            p_conversation_id: id,
            p_title:
              agreementForm.title.trim(),
            p_scope:
              agreementForm.scope.trim(),
            p_deliverables:
              agreementForm.deliverables.trim(),
            p_price_amount: price,
            p_price_currency:
              agreementForm.priceCurrency,
            p_deadline:
              agreementForm.deadline,
            p_revisions: revisions,
            p_delivery_format:
              agreementForm.deliveryFormat.trim(),
            p_acceptance_method:
              agreementForm.acceptanceMethod.trim(),
            p_cancellation_terms:
              agreementForm.cancellationTerms.trim(),
            p_additional_terms:
              agreementForm.additionalTerms.trim(),
          }
        );

      if (error) {
        throw error;
      }

      await loadAgreement(
        conversation,
        jobTitle
      );

      setAgreementMessage(
        "Propozycja została wysłana. Czat odblokuje się po akceptacji drugiej strony."
      );
    } catch (error) {
      setAgreementMessage(
        error?.message ||
          "Nie udało się zapisać warunków współpracy."
      );
    } finally {
      setAgreementSaving(false);
    }
  }

  async function handleAgreementAccept() {
    if (
      !agreement?.id ||
      agreementSaving ||
      messagingBlocked
    ) {
      return;
    }

    setAgreementSaving(true);
    setAgreementMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "accept_conversation_agreement",
          {
            p_agreement_id:
              agreement.id,
          }
        );

      if (error) {
        throw error;
      }

      await loadAgreement(
        conversation,
        jobTitle
      );

      setAgreementMessage(
        "Warunki zostały zaakceptowane. Możecie rozpocząć rozmowę."
      );
    } catch (error) {
      setAgreementMessage(
        error?.message ||
          "Nie udało się zaakceptować warunków współpracy."
      );
    } finally {
      setAgreementSaving(false);
    }
  }

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
      sending ||
      blockedByMe ||
      blockedMe ||
      !agreementAccepted
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
          "id, conversation_id, sender_id, content, created_at, read_at"
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

  async function handleDeleteConversation() {
    if (
      !user?.id ||
      !id ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Usunąć tę rozmowę z Twojej listy? Druga osoba nadal zachowa historię wiadomości."
      );

    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");

    try {
      const { error } =
        await supabase
          .from(
            "conversation_user_state"
          )
          .upsert(
            {
              conversation_id: id,
              user_id: user.id,
              hidden_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "conversation_id,user_id",
            }
          );

      if (error) {
        throw error;
      }

      navigate(
        "/messages",
        {
          replace: true,
        }
      );
    } catch (error) {
      setErrorMessage(
        `Nie udało się usunąć rozmowy: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setDeleting(false);
    }
  }

  const otherName =
    otherProfile?.name ||
    "Użytkownik";

  const otherInitial =
    otherName
      .charAt(0)
      .toUpperCase();

  const lastReadOwnMessageId =
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.sender_id ===
            user?.id &&
          !!message.read_at
      )?.id || null;

  const messagingBlocked =
    blockedByMe || blockedMe;

  const agreementsRequired =
    !!conversation?.agreements_required;

  const agreementAccepted =
    !agreementsRequired ||
    agreement?.status === "accepted";

  const isClient =
    conversation?.client_id ===
    user?.id;

  const currentUserAccepted =
    !agreementsRequired ||
    (isClient
      ? !!agreement?.client_accepted_at
      : !!agreement?.contractor_accepted_at);

  const otherUserAccepted =
    !agreementsRequired ||
    (isClient
      ? !!agreement?.contractor_accepted_at
      : !!agreement?.client_accepted_at);

  const otherProfileId =
    otherProfile?.id ||
    (conversation
      ? conversation.client_id ===
        user?.id
        ? conversation.contractor_id
        : conversation.client_id
      : null);

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
            flex: 0 0 auto;
            border: 0;
            background: transparent;
            color: #555;
            font: inherit;
            cursor: pointer;
          }

          .chat-profile-link {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            color: inherit;
            text-decoration: none;
          }

          .chat-profile-link:hover .chat-person strong {
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .chat-profile-blocked {
            cursor: pointer;
          }

          .chat-profile-blocked:hover .chat-person strong {
            text-decoration: underline;
            text-underline-offset: 3px;
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

          .chat-avatar-blocked {
            background: #dfdfda;
            color: #74746f;
            font-size: 22px;
            font-weight: 500;
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

          .chat-header-actions {
            flex: 0 0 auto;
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .chat-delete-button {
            flex: 0 0 auto;
            min-height: 38px;
            padding: 8px 12px;
            border-radius: 11px;
            background: #fff;
            font: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .chat-delete-button {
            border: 1px solid #e2d9d6;
            color: #8e352b;
          }

          .chat-delete-button:hover {
            background: #fff7f5;
          }

          .chat-delete-button:disabled {
            cursor: wait;
            opacity: .6;
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

          .chat-read-receipt {
            align-self: flex-end;
            margin: -3px 5px 3px 0;
            color: #92928d;
            font-size: 10px;
            line-height: 1;
          }

          .chat-block-banner {
            margin: 0;
            padding: 12px 18px;
            border-top: 1px solid #eadfdc;
            background: #fff8f6;
            color: #7f4037;
            font-size: 13px;
            line-height: 1.5;
            text-align: center;
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
              gap: 10px;
              flex-wrap: wrap;
            }

            .chat-profile-link {
              gap: 9px;
            }

            .chat-person span {
              display: none;
            }

            .chat-header-actions {
              width: 100%;
              justify-content: flex-end;
            }

            .chat-delete-button {
              padding: 8px 10px;
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

                {messagingBlocked ? (
                  <Link
                    className="chat-profile-link chat-profile-blocked"
                    to={`/profile/${otherProfileId}`}
                    aria-label="Zablokowany użytkownik"
                  >
                    <div
                      className="chat-avatar chat-avatar-blocked"
                      aria-hidden="true"
                    >
                      ×
                    </div>

                    <div className="chat-person">
                      <strong>
                        Zablokowany użytkownik
                      </strong>
                      <span>
                        Kliknij, aby otworzyć ukryty profil
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    className="chat-profile-link"
                    to={`/profile/${otherProfileId}`}
                    aria-label={`Otwórz profil: ${otherName}`}
                  >
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
                        Kliknij, aby zobaczyć profil
                      </span>
                    </div>
                  </Link>
                )}

                <div className="chat-header-actions">
                  <button
                    type="button"
                    className="chat-delete-button"
                    onClick={
                      handleDeleteConversation
                    }
                    disabled={deleting}
                  >
                    {deleting
                      ? "Usuwanie..."
                      : "Usuń rozmowę"}
                  </button>
                </div>
              </header>

              <AgreementPanel
                required={agreementsRequired}
                agreement={agreement}
                loading={agreementLoading}
                saving={agreementSaving}
                mode={agreementMode}
                form={agreementForm}
                message={agreementMessage}
                currentUserAccepted={currentUserAccepted}
                otherUserAccepted={otherUserAccepted}
                blocked={messagingBlocked}
                onFieldChange={updateAgreementField}
                onOpenForm={openAgreementForm}
                onCancelForm={() => {
                  setAgreementMode("view");
                  setAgreementMessage("");
                }}
                onSubmit={handleAgreementSubmit}
                onAccept={handleAgreementAccept}
              />

              {!agreementAccepted &&
                errorMessage && (
                  <p className="chat-error">
                    {errorMessage}
                  </p>
                )}

              {agreementAccepted && (
                <>
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
                      <React.Fragment
                        key={message.id}
                      >
                        <div
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

                        {message.id ===
                          lastReadOwnMessageId && (
                          <span className="chat-read-receipt">
                            Wyświetlono
                          </span>
                        )}
                      </React.Fragment>
                    )
                  )
                )}
              </div>

              {errorMessage && (
                <p className="chat-error">
                  {errorMessage}
                </p>
              )}

              {messagingBlocked && (
                <p className="chat-block-banner">
                  {blockedByMe
                    ? "Zablokowałeś tego użytkownika. Otwórz ukryty profil i użyj menu z trzema kropkami, aby go odblokować."
                    : "Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości w tej rozmowie jest wyłączone."}
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
                  disabled={
                    sending ||
                    messagingBlocked
                  }
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
                    !draft.trim() ||
                    messagingBlocked
                  }
                >
                  {sending
                    ? "Wysyłanie..."
                    : "Wyślij"}
                </button>
              </form>
                </>
              )}
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
            white-space: pre-wrap;
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
