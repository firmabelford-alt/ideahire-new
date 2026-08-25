
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
            "AUTH INITIALIZATION ERROR:",
            error
          );

          if (!mounted) return;

          setSession(null);
          setUser(null);
          setLoading(false);

          return;
        }

        if (!mounted) return;

        const currentSession =
          data?.session || null;

        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      } catch (error) {
        console.error(
          "AUTH INITIALIZATION ERROR:",
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
    } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        console.log("AUTH EVENT:", event);

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

function PublicOnlyRoute({ children }) {
  const { loading, isLoggedIn } = useAuth();

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
   ACCOUNT NAVBAR
========================================================= */

function AccountNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] =
    useState(0);

  const userName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    "";

  const initial =
    userName
      .charAt(0)
      .toUpperCase();

  async function loadUnreadNotifications() {
    if (!user?.id) return;

    try {
      const { count, error } =
        await supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .eq("read", false);

      if (error) {
        console.error(
          "LOAD UNREAD NOTIFICATIONS ERROR:",
          error
        );

        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error(
        "LOAD UNREAD NOTIFICATIONS ERROR:",
        error
      );
    }
  }

  useEffect(() => {
    loadUnreadNotifications();

    if (!user?.id) return;

    const channel =
      supabase
        .channel(
          `notifications-navbar-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadUnreadNotifications();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function handleLogout() {
    try {
      const { error } =
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
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

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

        {/* =================================================
            POWIADOMIENIA
            Tylko dla zalogowanych użytkowników.
        ================================================= */}
        <Link
          to="/notifications"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          Powiadomienia

          {unreadCount > 0 && (
            <span
              style={{
                minWidth: "20px",
                height: "20px",
                padding: "0 6px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
                background: "#111",
                color: "#fff",
              }}
            >
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
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

  const location = useLocation();

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
        typeof from === "string" &&
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

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        console.error(
          "LOGIN ERROR:",
          error
        );

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
      console.error(
        "LOGIN ERROR:",
        error
      );

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

  async function handlePasswordReset(event) {
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
        console.error(
          "PASSWORD RESET ERROR:",
          error
        );

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
      console.error(
        "PASSWORD RESET ERROR:",
        error
      );

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

            <h1>Reset hasła</h1>

            <p>
              Podaj adres e-mail przypisany
              do Twojego konta. Wyślemy Ci
              link do ustawienia nowego hasła.
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
              onClick={
                switchToLogin
              }
              className="auth-link-button"
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

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginTop: "-8px",
              marginBottom: "4px",
            }}
          >
            <button
              type="button"
              onClick={
                switchToReset
              }
              className="auth-link-button"
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
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [passwordAgain, setPasswordAgain] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [recoveryReady, setRecoveryReady] =
    useState(false);

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
            console.error(
              "RECOVERY CODE ERROR:",
              error
            );

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

        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "RECOVERY SESSION ERROR:",
            error
          );

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
        console.error(
          "RECOVERY ERROR:",
          error
        );

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
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        console.error(
          "UPDATE PASSWORD ERROR:",
          error
        );

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
      console.error(
        "UPDATE PASSWORD ERROR:",
        error
      );

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

          <h1>Ustaw nowe hasło</h1>

          <p>
            Wpisz nowe hasło do swojego konta.
          </p>
        </div>

        {!recoveryReady ? (
          <>
            {message && (
              <p className="auth-error">
                {message}
              </p>
            )}

            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
              }}
            >
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

  async function handleRegister(event) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setLoading(true);

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim();

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

        return;
      }
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

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

          <h1>Utwórz konto</h1>

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
   AVATAR
========================================================= */

async function resizeAndConvertImage(file) {
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
        console.error(
          "AVATAR UPLOAD ERROR:",
          uploadError
        );

        setMessage(
          `Nie udało się przesłać zdjęcia: ${uploadError.message}`
        );

        return;
      }

      const {
        data: publicUrlData,
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
        error: metadataError,
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
        console.error(
          "AVATAR METADATA ERROR:",
          metadataError
        );

        setMessage(
          `Zdjęcie przesłane, ale nie udało się zapisać profilu: ${metadataError.message}`
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
      console.error(
        "AVATAR ERROR:",
        error
      );

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

  async function handleSave(event) {
    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanAbout =
      about.trim();

    setMessage("");

    if (!cleanName) {
      setMessage(
        "Imię / nazwa nie może być puste."
      );

      return;
    }

    setSaving(true);

    try {
      const { data, error } =
        await supabase.auth.updateUser({
          data: {
            name: cleanName,
            avatar_url:
              avatarUrl || null,
            about:
              cleanAbout || null,
          },
        });

      if (error) {
        console.error(
          "PROFILE UPDATE ERROR:",
          error
        );

        setMessage(
          `Nie udało się zapisać profilu: ${error.message}`
        );

        return;
      }

      if (!data?.user) {
        setMessage(
          "Profil nie został zaktualizowany."
        );

        return;
      }

      setName(
        data.user.user_metadata?.name ||
          cleanName
      );

      setAvatarUrl(
        data.user.user_metadata
          ?.avatar_url || ""
      );

      setAbout(
        data.user.user_metadata
          ?.about || ""
      );

      setMessage(
        "Profil został zapisany."
      );
    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

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

          <h1>Mój profil</h1>

          <p>
            Zarządzaj swoim profilem IdeaHire.
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
                Zdjęcie zostanie automatycznie
                przycięte do 400 × 400 px.
              </small>
            </label>

            {uploading && (
              <div className="profile-upload-status">
                Przetwarzanie i zapisywanie zdjęcia...
              </div>
            )}

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
                placeholder="Np. Jan Kowalski"
                autoComplete="name"
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
                placeholder="Napisz kilka słów o sobie, swoich umiejętnościach i specjalizacji..."
                maxLength={1000}
              />

              <small>
                Opis będzie widoczny na Twoim profilu.
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
      </main>
    </div>
  );
}

/* =========================================================
   JOB CONSTANTS
========================================================= */

const JOB_CATEGORIES = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
];

const JOB_STATUSES = {
  open: {
    label: "Aktywne",
  },

  in_progress: {
    label: "W trakcie",
  },

  completed: {
    label: "Zakończone",
  },
};

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

  const [description, setDescription] =
    useState("");

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

  function handleBudgetChange(event) {
    setBudget(
      event.target.value.replace(
        /\D/g,
        ""
      )
    );
  }

  async function handleSubmit(event) {
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
        "Budżet musi zawierać wyłącznie cyfry i być większy od 0."
      );

      return;
    }

    if (!user?.id) {
      setMessage(
        "Twoja sesja wygasła. Zaloguj się ponownie."
      );

      return;
    }

    setSaving(true);

    try {
      const { error } =
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
            status: "open",
          });

      if (error) {
        console.error(
          "CREATE JOB ERROR:",
          error
        );

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
      console.error(
        "CREATE JOB ERROR:",
        error
      );

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
            Opisz projekt, wybierz kategorię
            i ustaw prosty budżet.
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
              placeholder="Np. nowoczesna strona internetowa"
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
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
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
              Wpisz tylko cyfry,
              bez zł, spacji i kropek.
            </small>

            <small
              style={{
                display: "block",
                marginTop: "6px",
                opacity: 0.7,
              }}
            >
              Cena jest ustalana przy tworzeniu
              zlecenia i nie może być później
              edytowana.
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

  const [applyingJobId, setApplyingJobId] =
    useState(null);

  const [applicationMessage, setApplicationMessage] =
    useState("");

  const [appliedJobIds, setAppliedJobIds] =
    useState(new Set());

  async function loadJobs() {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } =
        await supabase
          .from("jobs")
          .select(
            "id, user_id, title, description, category, budget, status, created_at"
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

      setJobs(data || []);
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

  async function loadApplications() {
    if (!user?.id) return;

    try {
      const { data, error } =
        await supabase
          .from("job_applications")
          .select("job_id")
          .eq(
            "applicant_id",
            user.id
          );

      if (error) {
        console.error(
          "LOAD APPLICATIONS ERROR:",
          error
        );

        return;
      }

      setAppliedJobIds(
        new Set(
          (data || []).map(
            (item) => item.job_id
          )
        )
      );
    } catch (error) {
      console.error(
        "LOAD APPLICATIONS ERROR:",
        error
      );
    }
  }

  useEffect(() => {
    loadJobs();
    loadApplications();
  }, [user?.id]);

  function formatBudget(value) {
    return `${Number(
      value || 0
    ).toLocaleString(
      "pl-PL"
    )} zł`;
  }

  function formatDate(value) {
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

  function getStatusLabel(status) {
    return (
      JOB_STATUSES[status]
        ?.label ||
      "Aktywne"
    );
  }

  async function handleApply(job) {
    setApplicationMessage("");

    if (!user?.id) {
      setApplicationMessage(
        "Musisz być zalogowany, aby zgłosić się do zlecenia."
      );

      return;
    }

    if (user.id === job.user_id) {
      setApplicationMessage(
        "Nie możesz zgłosić się do własnego zlecenia."
      );

      return;
    }

    if (
      appliedJobIds.has(
        job.id
      )
    ) {
      setApplicationMessage(
        "Już zgłosiłeś się do tego zlecenia."
      );

      return;
    }

    setApplyingJobId(job.id);
    setApplicationMessage("");

    try {
      const {
        data: application,
        error: applicationError,
      } =
        await supabase
          .from("job_applications")
          .insert({
            job_id:
              job.id,
            applicant_id:
              user.id,
            status:
              "pending",
          })
          .select()
          .single();

      if (applicationError) {
        console.error(
          "CREATE APPLICATION ERROR:",
          applicationError
        );

        if (
          applicationError.code ===
          "23505"
        ) {
          setApplicationMessage(
            "Już zgłosiłeś się do tego zlecenia."
          );

          setAppliedJobIds(
            (previous) =>
              new Set([
                ...previous,
                job.id,
              ])
          );

          return;
        }

        setApplicationMessage(
          `Nie udało się wysłać zgłoszenia: ${applicationError.message}`
        );

        return;
      }

      const {
        data: applicantProfile,
      } =
        await supabase
          .from("profiles")
          .select(
            "name, avatar_url"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      const applicantName =
        applicantProfile?.name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Użytkownik";

      const {
        error: notificationError,
      } =
        await supabase
          .from("notifications")
          .insert({
            user_id:
              job.user_id,
            type:
              "job_application",
            title:
              "Nowe zgłoszenie do zlecenia",
            message:
              `${applicantName} zgłosił się do zlecenia „${job.title}”.`,
            job_id:
              job.id,
            application_id:
              application?.id ||
              null,
            sender_id:
              user.id,
            read: false,
          });

      if (notificationError) {
        console.error(
          "CREATE NOTIFICATION ERROR:",
          notificationError
        );
      }

      setAppliedJobIds(
        (previous) =>
          new Set([
            ...previous,
            job.id,
          ])
      );

      setApplicationMessage(
        "Zgłoszenie zostało wysłane. Zleceniodawca otrzyma powiadomienie."
      );
    } catch (error) {
      console.error(
        "APPLICATION ERROR:",
        error
      );

      setApplicationMessage(
        `Nie udało się zgłosić do zlecenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setApplyingJobId(null);
    }
  }

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
            Przeglądaj prawdziwe zlecenia
            opublikowane przez użytkowników IdeaHire.
          </p>
        </div>

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
                Na razie nie ma żadnych zleceń.
              </h2>

              <p>
                Dodaj pierwsze zlecenie,
                aby pojawiło się tutaj
                dla innych użytkowników.
              </p>
            </section>
          )}

        <div className="jobs-list">
          {jobs.map((job) => {
            const isOpen =
              openJobId ===
              job.id;

            const isOwner =
              user?.id ===
              job.user_id;

            const alreadyApplied =
              appliedJobIds.has(
                job.id
              );

            return (
              <article
                className="job-card"
                key={job.id}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "16px",
                    marginBottom:
                      "12px",
                  }}
                >
                  <span className="section-label">
                    {job.category}
                  </span>

                  <span
                    style={{
                      fontSize:
                        "13px",
                      fontWeight:
                        "600",
                      padding:
                        "6px 10px",
                      borderRadius:
                        "999px",
                      background:
                        job.status ===
                        "completed"
                          ? "#e8f5e9"
                          : job.status ===
                            "in_progress"
                          ? "#fff4d6"
                          : "#eef4ff",
                    }}
                  >
                    {getStatusLabel(
                      job.status
                    )}
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
                  <div
                    style={{
                      marginTop:
                        "18px",
                    }}
                  >
                    <p>
                      {job.description}
                    </p>

                    {isOwner && (
                      <p
                        style={{
                          marginTop:
                            "12px",
                        }}
                      >
                        <small>
                          To jest Twoje zlecenie.
                        </small>
                      </p>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap:
                      "wrap",
                    gap: "10px",
                    marginTop:
                      "16px",
                  }}
                >
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

                  {!isOwner &&
                    job.status ===
                      "open" && (
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
                        {applyingJobId ===
                        job.id
                          ? "Wysyłanie..."
                          : alreadyApplied
                          ? "Zgłoszenie wysłane ✓"
                          : "Zgłoś się do zlecenia →"}
                      </button>
                    )}
                </div>

                {applicationMessage && (
                  <p
                    className="auth-message"
                    style={{
                      marginTop:
                        "14px",
                    }}
                  >
                    {applicationMessage}
                  </p>
                )}
              </article>
            );
          })}
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

  const [notifications, setNotifications] =
    useState([]);

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
        data,
        error,
      } =
        await supabase
          .from("notifications")
          .select(
            "id, user_id, type, title, message, job_id, application_id, sender_id, read, created_at"
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
          "LOAD NOTIFICATIONS ERROR:",
          error
        );

        setMessage(
          `Nie udało się pobrać powiadomień: ${error.message}`
        );

        return;
      }

      const notificationRows =
        data || [];

      const senderIds = [
        ...new Set(
          notificationRows
            .map(
              (item) =>
                item.sender_id
            )
            .filter(Boolean)
        ),
      ];

      const jobIds = [
        ...new Set(
          notificationRows
            .map(
              (item) =>
                item.job_id
            )
            .filter(Boolean)
        ),
      ];

      let profiles = [];
      let jobs = [];

      if (senderIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about"
            )
            .in(
              "id",
              senderIds
            );

        if (!profileError) {
          profiles =
            profileData || [];
        } else {
          console.error(
            "LOAD NOTIFICATION PROFILES ERROR:",
            profileError
          );
        }
      }

      if (jobIds.length > 0) {
        const {
          data: jobData,
          error: jobError,
        } =
          await supabase
            .from("jobs")
            .select(
              "id, title, category, budget"
            )
            .in(
              "id",
              jobIds
            );

        if (!jobError) {
          jobs =
            jobData || [];
        } else {
          console.error(
            "LOAD NOTIFICATION JOBS ERROR:",
            jobError
          );
        }
      }

      const profileMap =
        Object.fromEntries(
          profiles.map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        );

      const jobMap =
        Object.fromEntries(
          jobs.map(
            (job) => [
              job.id,
              job,
            ]
          )
        );

      const enriched =
        notificationRows.map(
          (notification) => ({
            ...notification,
            sender:
              notification.sender_id
                ? profileMap[
                    notification
                      .sender_id
                  ] || null
                : null,
            job:
              notification.job_id
                ? jobMap[
                    notification.job_id
                  ] || null
                : null,
          })
        );

      setNotifications(
        enriched
      );
    } catch (error) {
      console.error(
        "LOAD NOTIFICATIONS ERROR:",
        error
      );

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

  async function markAsRead(id) {
    try {
      const { error } =
        await supabase
          .from("notifications")
          .update({
            read: true,
          })
          .eq(
            "id",
            id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        console.error(
          "MARK NOTIFICATION READ ERROR:",
          error
        );

        return;
      }

      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification.id ===
              id
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
          )
      );
    } catch (error) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        error
      );
    }
  }

  async function markAllAsRead() {
    try {
      const { error } =
        await supabase
          .from("notifications")
          .update({
            read: true,
          })
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "read",
            false
          );

      if (error) {
        console.error(
          "MARK ALL READ ERROR:",
          error
        );

        return;
      }

      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              read: true,
            })
          )
      );
    } catch (error) {
      console.error(
        "MARK ALL READ ERROR:",
        error
      );
    }
  }

  function formatDate(value) {
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

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

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
            osób zainteresowanych Twoimi zleceniami.
          </p>
        </div>

        {unreadCount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginBottom:
                "18px",
            }}
          >
            <button
              type="button"
              className="auth-link-button"
              onClick={
                markAllAsRead
              }
            >
              Oznacz wszystkie jako przeczytane
            </button>
          </div>
        )}

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
                Nie masz jeszcze powiadomień.
              </h2>

              <p>
                Gdy ktoś zgłosi się do Twojego
                zlecenia, informacja pojawi się tutaj.
              </p>
            </section>
          )}

        {!loading &&
          notifications.length >
            0 && (
            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "14px",
              }}
            >
              {notifications.map(
                (notification) => {
                  const sender =
                    notification.sender;

                  const senderName =
                    sender?.name ||
                    "Użytkownik";

                  const senderInitial =
                    senderName
                      .charAt(0)
                      .toUpperCase();

                  return (
                    <article
                      key={
                        notification.id
                      }
                      className="account-card"
                      style={{
                        position:
                          "relative",
                        border:
                          notification.read
                            ? undefined
                            : "1px solid #111",
                      }}
                    >
                      {!notification.read && (
                        <span
                          style={{
                            position:
                              "absolute",
                            top: "20px",
                            right:
                              "20px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "700",
                            padding:
                              "5px 9px",
                            borderRadius:
                              "999px",
                            background:
                              "#111",
                            color:
                              "#fff",
                          }}
                        >
                          NOWE
                        </span>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "14px",
                          marginBottom:
                            "18px",
                        }}
                      >
                        <div
                          style={{
                            width:
                              "52px",
                            height:
                              "52px",
                            minWidth:
                              "52px",
                            borderRadius:
                              "50%",
                            overflow:
                              "hidden",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#f1f1f1",
                            fontWeight:
                              "700",
                            fontSize:
                              "18px",
                          }}
                        >
                          {sender?.avatar_url ? (
                            <img
                              src={
                                sender.avatar_url
                              }
                              alt=""
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                objectFit:
                                  "cover",
                              }}
                            />
                          ) : (
                            senderInitial
                          )}
                        </div>

                        <div>
                          <span className="section-label">
                            Nowe zgłoszenie
                          </span>

                          <h3
                            style={{
                              margin:
                                "4px 0 0",
                            }}
                          >
                            {notification.title}
                          </h3>
                        </div>
                      </div>

                      <p>
                        {notification.message}
                      </p>

                      {notification.job && (
                        <div
                          style={{
                            marginTop:
                              "14px",
                            padding:
                              "14px",
                            borderRadius:
                              "12px",
                            background:
                              "#f7f7f5",
                          }}
                        >
                          <strong>
                            {notification.job.title}
                          </strong>

                          <small
                            style={{
                              display:
                                "block",
                              marginTop:
                                "5px",
                              opacity:
                                0.7,
                            }}
                          >
                            {notification.job.category}
                            {" · "}
                            {Number(
                              notification
                                .job
                                .budget ||
                                0
                            ).toLocaleString(
                              "pl-PL"
                            )}{" "}
                            zł
                          </small>
                        </div>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          alignItems:
                            "center",
                          gap: "10px",
                          marginTop:
                            "18px",
                        }}
                      >
                        {sender?.id && (
                          <Link
                            className="btn btn-dark"
                            to={`/profile/${sender.id}`}
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                          >
                            Zobacz profil →
                          </Link>
                        )}

                        {!notification.read && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                          >
                            Oznacz jako przeczytane
                          </button>
                        )}
                      </div>

                      <small
                        style={{
                          display:
                            "block",
                          marginTop:
                            "14px",
                          opacity:
                            0.55,
                        }}
                      >
                        {formatDate(
                          notification.created_at
                        )}
                      </small>
                    </article>
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
   PUBLIC PROFILE
========================================================= */

function PublicProfile() {
  const { id } =
    useParams();

  const { user } =
    useAuth();

  const [profile, setProfile] =
    useState(null);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: profileData,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about"
            )
            .eq(
              "id",
              id
            )
            .maybeSingle();

        if (profileError) {
          console.error(
            "LOAD PUBLIC PROFILE ERROR:",
            profileError
          );

          if (!mounted) return;

          setMessage(
            `Nie udało się pobrać profilu: ${profileError.message}`
          );

          return;
        }

        if (!profileData) {
          if (!mounted) return;

          setMessage(
            "Nie znaleziono tego profilu."
          );

          return;
        }

        const {
          data: jobsData,
          error: jobsError,
        } =
          await supabase
            .from("jobs")
            .select(
              "id, title, description, category, budget, status, created_at"
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
            "LOAD PROFILE JOBS ERROR:",
            jobsError
          );
        }

        if (!mounted) return;

        setProfile(
          profileData
        );

        setJobs(
          jobsData || []
        );
      } catch (error) {
        console.error(
          "PUBLIC PROFILE ERROR:",
          error
        );

        if (!mounted) return;

        setMessage(
          `Nie udało się pobrać profilu: ${
            error?.message ||
            "Nieznany błąd"
          }`
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  const displayName =
    profile?.name ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  const isOwnProfile =
    user?.id ===
    profile?.id;

  function formatBudget(value) {
    return `${Number(
      value || 0
    ).toLocaleString(
      "pl-PL"
    )} zł`;
  }

  function formatDate(value) {
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

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        {message ? (
          <section className="account-card">
            <p className="auth-error">
              {message}
            </p>

            <Link
              className="btn btn-dark"
              to="/jobs"
            >
              Wróć do zleceń
            </Link>
          </section>
        ) : (
          <>
            <div className="app-page-header">
              <span className="section-label">
                Profil użytkownika
              </span>

              <h1>
                {displayName}
              </h1>

              <p>
                Profil użytkownika IdeaHire.
              </p>
            </div>

            <section className="account-card">
              <div
                className="profile-preview"
                style={{
                  marginBottom:
                    "20px",
                }}
              >
                <div className="profile-avatar-wrapper">
                  {profile?.avatar_url ? (
                    <img
                      src={
                        profile.avatar_url
                      }
                      alt={`Profil ${displayName}`}
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

                  {isOwnProfile && (
                    <Link to="/account">
                      Edytuj swój profil →
                    </Link>
                  )}
                </div>
              </div>

              {profile?.about && (
                <div>
                  <span className="section-label">
                    O mnie
                  </span>

                  <p
                    style={{
                      marginTop:
                        "8px",
                    }}
                  >
                    {profile.about}
                  </p>
                </div>
              )}
            </section>

            <section
              style={{
                marginTop:
                  "32px",
              }}
            >
              <div className="app-page-header">
                <span className="section-label">
                  Zlecenia
                </span>

                <h2>
                  Zlecenia użytkownika
                </h2>

                <p>
                  Zlecenia opublikowane przez tego użytkownika.
                </p>
              </div>

              {jobs.length ===
              0 ? (
                <section className="account-card">
                  <p>
                    Ten użytkownik nie ma jeszcze
                    opublikowanych zleceń.
                  </p>
                </section>
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

                        <span
                          style={{
                            display:
                              "inline-flex",
                            marginTop:
                              "8px",
                            fontSize:
                              "13px",
                            fontWeight:
                              "600",
                            padding:
                              "6px 10px",
                            borderRadius:
                              "999px",
                            background:
                              job.status ===
                              "completed"
                                ? "#e8f5e9"
                                : job.status ===
                                  "in_progress"
                                ? "#fff4d6"
                                : "#eef4ff",
                          }}
                        >
                          {JOB_STATUSES[
                            job.status
                          ]?.label ||
                            "Aktywne"}
                        </span>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}
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
          {/* PUBLIC */}
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

          {/* PROTECTED */}
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

          {/* =================================================
              NOWA SKRZYNKA POWIADOMIEŃ
          ================================================= */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              PUBLICZNY PROFIL UŻYTKOWNIKA
          ================================================= */}
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <PublicProfile />
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
