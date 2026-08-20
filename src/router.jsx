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
  const { user } = useAuth();

  const userName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user?.user_metadata?.avatar_url || "";

  const initial =
    userName.charAt(0).toUpperCase();

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

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

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

  async function handlePasswordReset(event) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanEmail = email.trim();

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

  /* =======================================================
     RESET PASSWORD REQUEST
  ======================================================= */

  if (mode === "reset") {
    return (
      <div className="page">
        <div className="auth-card">
          <Link className="logo" to="/">
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
              Podaj adres e-mail przypisany do
              Twojego konta. Wyślemy Ci link,
              za pomocą którego ustawisz nowe hasło.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handlePasswordReset}
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
              onClick={switchToLogin}
              className="auth-link-button"
            >
              Wróć do logowania
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NORMAL LOGIN
  ======================================================= */

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

          <h1>
            Zaloguj się
          </h1>

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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "-8px",
              marginBottom: "4px",
            }}
          >
            <button
              type="button"
              onClick={switchToReset}
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
   RESET PASSWORD — USTAWIENIE NOWEGO HASŁA
========================================================= */

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
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
    let recoveryTimeout = null;

    async function prepareRecovery() {
      try {
        /*
         * Supabase może przekazać kod w parametrze ?code=...
         * W takim przypadku wymieniamy go na sesję.
         */
        const params =
          new URLSearchParams(
            window.location.search
          );

        const code = params.get("code");

        if (code) {
          const {
            error,
          } =
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

          /*
           * Usuwamy ?code=... z adresu.
           * Użytkownik zostaje normalnie na /reset-password.
           */
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

        /*
         * Jeśli Supabase już utworzył sesję
         * z linku recovery, możemy od razu pokazać formularz.
         */
        const {
          data,
          error,
        } =
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

        /*
         * Dajemy Supabase chwilę na przetworzenie
         * parametrów recovery z adresu.
         */
        recoveryTimeout = setTimeout(
          async () => {
            const {
              data: latestData,
            } =
              await supabase.auth.getSession();

            if (!mounted) return;

            if (latestData?.session) {
              setRecoveryReady(true);
            } else {
              setMessage(
                "Link do resetowania hasła jest nieprawidłowy, wygasł albo został już wykorzystany."
              );
            }

            setLoading(false);
          },
          1200
        );
      } catch (error) {
        console.error(
          "RECOVERY PREPARE ERROR:",
          error
        );

        if (!mounted) return;

        setMessage(
          `Nie udało się przygotować resetowania hasła: ${
            error?.message || "Nieznany błąd"
          }`
        );

        setLoading(false);
      }
    }

    /*
     * Najważniejsze:
     * PASSWORD_RECOVERY oznacza, że użytkownik
     * wszedł przez prawidłowy link resetujący.
     */
    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;

          if (
            event === "PASSWORD_RECOVERY" &&
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

      if (recoveryTimeout) {
        clearTimeout(recoveryTimeout);
      }

      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(event) {
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

    if (password !== passwordAgain) {
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

      /*
       * Po zmianie hasła wylogowujemy bieżącą sesję recovery.
       * Dzięki temu użytkownik faktycznie loguje się
       * nowym hasłem jak w klasycznym systemie.
       */
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1800);
    } catch (error) {
      console.error(
        "UPDATE PASSWORD ERROR:",
        error
      );

      setMessage(
        `Nie udało się zmienić hasła: ${
          error?.message || "Nieznany błąd"
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
        <Link className="logo" to="/">
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
              onSubmit={handleUpdatePassword}
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

          <h1>
            Utwórz konto
          </h1>

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
   AVATAR
========================================================= */

async function resizeAndConvertImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl =
      URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const SIZE = 400;

      const sourceWidth =
        image.naturalWidth;

      const sourceHeight =
        image.naturalHeight;

      if (!sourceWidth || !sourceHeight) {
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
        (sourceWidth - sourceSize) / 2;

      const sourceY =
        (sourceHeight - sourceSize) / 2;

      const canvas =
        document.createElement("canvas");

      canvas.width = SIZE;
      canvas.height = SIZE;

      const context =
        canvas.getContext("2d");

      if (!context) {
        reject(
          new Error(
            "Przeglądarka nie obsługuje Canvas."
          )
        );

        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

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
                type: "image/jpeg",
              }
            )
          );
        },
        "image/jpeg",
        0.82
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          "Nie udało się odczytać zdjęcia."
        )
      );
    };

    image.src = objectUrl;
  });
}

/* =========================================================
   ACCOUNT
========================================================= */

function Account() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    setName(
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      ""
    );

    setAvatarUrl(
      user.user_metadata?.avatar_url || ""
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

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Wybierz plik graficzny."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "Zdjęcie może mieć maksymalnie 10 MB."
      );

      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const convertedFile =
        await resizeAndConvertImage(file);

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
              contentType: "image/jpeg",
              cacheControl: "3600",
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
          .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        setMessage(
          "Zdjęcie zostało przesłane, ale nie udało się pobrać adresu."
        );

        return;
      }

      const {
        data: updatedUser,
        error: metadataError,
      } =
        await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrl,
          },
        });

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
        updatedUser?.user?.user_metadata
          ?.avatar_url || publicUrl
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
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    const cleanName = name.trim();

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
            avatar_url: avatarUrl || null,
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
        data.user.user_metadata?.avatar_url ||
        ""
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
          error?.message || "Nieznany błąd"
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
    displayName.charAt(0).toUpperCase();

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
                onChange={handleAvatarChange}
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
                  setName(event.target.value)
                }
                placeholder="Np. Jan Kowalski"
                autoComplete="name"
                required
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                value={user.email || ""}
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
   FIND TALENT — DODAWANIE PRAWDZIWEGO ZLECENIA
========================================================= */

const JOB_CATEGORIES = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
];

function FindTalent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleBudgetChange(event) {
    setBudget(event.target.value.replace(/\D/g, ""));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const numericBudget = Number(budget);

    if (!cleanTitle) {
      setMessage("Wpisz nazwę zlecenia.");
      return;
    }

    if (!cleanDescription) {
      setMessage("Opisz krótko swoje zlecenie.");
      return;
    }

    if (!budget || !Number.isInteger(numericBudget) || numericBudget <= 0) {
      setMessage("Budżet musi zawierać wyłącznie cyfry i być większy od 0.");
      return;
    }

    if (!user?.id) {
      setMessage("Twoja sesja wygasła. Zaloguj się ponownie.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: cleanTitle,
        description: cleanDescription,
        category,
        budget: numericBudget,
      });

      if (error) {
        console.error("CREATE JOB ERROR:", error);
        setMessage(`Nie udało się opublikować zlecenia: ${error.message}`);
        return;
      }

      setSuccess(true);
      setMessage("Zlecenie zostało opublikowane.");
      setTitle("");
      setDescription("");
      setCategory(JOB_CATEGORIES[0]);
      setBudget("");

      setTimeout(() => {
        navigate("/jobs");
      }, 900);
    } catch (error) {
      console.error("CREATE JOB ERROR:", error);
      setMessage(`Nie udało się opublikować zlecenia: ${error?.message || "Nieznany błąd"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">Dla zlecających</span>
          <h1>Dodaj zlecenie</h1>
          <p>Opisz projekt, wybierz kategorię i ustaw prosty budżet.</p>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <label>
            Czego potrzebujesz?
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Np. nowoczesna strona internetowa"
              maxLength={120}
              required
            />
          </label>

          <label>
            Kategoria
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              {JOB_CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Opisz swój projekt
            <textarea
              rows="6"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
              onChange={handleBudgetChange}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Np. 3000"
              maxLength={9}
              required
            />
            <small>Wpisz tylko cyfry, bez zł, spacji i kropek.</small>
          </label>

          {message && (
            <p className={success ? "auth-message" : "auth-error"}>{message}</p>
          )}

          <button className="btn btn-dark btn-large" type="submit" disabled={saving}>
            {saving ? "Publikowanie..." : "Opublikuj zlecenie →"}
          </button>
        </form>
      </main>
    </div>
  );
}

/* =========================================================
   JOBS — PRAWDZIWE ZLECENIA Z SUPABASE
========================================================= */

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openJobId, setOpenJobId] = useState(null);

  async function loadJobs() {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, description, category, budget, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("LOAD JOBS ERROR:", error);
        setMessage(`Nie udało się pobrać zleceń: ${error.message}`);
        return;
      }

      setJobs(data || []);
    } catch (error) {
      console.error("LOAD JOBS ERROR:", error);
      setMessage(`Nie udało się pobrać zleceń: ${error?.message || "Nieznany błąd"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function formatBudget(value) {
    return `${Number(value || 0).toLocaleString("pl-PL")} zł`;
  }

  function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">Dla wykonawców</span>
          <h1>Znajdź zlecenie</h1>
          <p>Przeglądaj prawdziwe zlecenia opublikowane przez użytkowników IdeaHire.</p>
        </div>

        {loading && <p>Ładowanie zleceń...</p>}

        {!loading && message && (
          <p className="auth-error">{message}</p>
        )}

        {!loading && !message && jobs.length === 0 && (
          <section className="account-card">
            <span className="section-label">Brak zleceń</span>
            <h2>Na razie nie ma żadnych zleceń.</h2>
            <p>Dodaj pierwsze zlecenie, aby pojawiło się tutaj dla innych użytkowników.</p>
          </section>
        )}

        <div className="jobs-list">
          {jobs.map((job) => {
            const isOpen = openJobId === job.id;

            return (
              <article className="job-card" key={job.id}>
                <span className="section-label">{job.category}</span>
                <h2>{job.title}</h2>
                <p><strong>Budżet:</strong> {formatBudget(job.budget)}</p>
                <p><small>Opublikowano: {formatDate(job.created_at)}</small></p>

                {isOpen && (
                  <div style={{ marginTop: "18px" }}>
                    <p>{job.description}</p>
                  </div>
                )}

                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => setOpenJobId(isOpen ? null : job.id)}
                >
                  {isOpen ? "Ukryj szczegóły ↑" : "Zobacz zlecenie →"}
                </button>
              </article>
            );
          })}
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

          {/* =================================================
              WAŻNE:
              RESET PASSWORD NIE JEST PublicOnlyRoute.
              Dzięki temu link z Gmaila może otworzyć
              tę stronę również wtedy, gdy przeglądarka
              ma już istniejącą sesję.
          ================================================= */}

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
