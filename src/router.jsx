
import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useRef,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
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
   AGE ACCESS
========================================================= */

const MIN_ACCOUNT_AGE = 16;
const FULL_ACCOUNT_AGE = 18;
const AGE_NOTICE_VERSION = "2026-09-03-v1";

const AgeAccessContext = createContext(null);

function parseDateOnly(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day, date };
}

function getAgeAnniversary(birthDate, age) {
  const parsed = parseDateOnly(birthDate);

  if (!parsed) return null;

  const anniversary = new Date(
    parsed.year + age,
    parsed.month - 1,
    parsed.day
  );

  if (anniversary.getMonth() !== parsed.month - 1) {
    anniversary.setDate(0);
  }

  anniversary.setHours(0, 0, 0, 0);
  return anniversary;
}

function hasReachedAge(birthDate, age) {
  const anniversary = getAgeAnniversary(birthDate, age);

  if (!anniversary) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= anniversary;
}

function getDateInputBoundary(yearsAgo = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - yearsAgo);

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getBirthDateValidation(birthDate) {
  const parsed = parseDateOnly(birthDate);

  if (!parsed) {
    return {
      valid: false,
      code: "invalid",
      message: "Wpisz prawidłową datę urodzenia.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oldestAllowed = new Date(today);
  oldestAllowed.setFullYear(today.getFullYear() - 120);

  if (parsed.date > today || parsed.date < oldestAllowed) {
    return {
      valid: false,
      code: "invalid",
      message: "Wpisz prawidłową datę urodzenia.",
    };
  }

  if (!hasReachedAge(birthDate, MIN_ACCOUNT_AGE)) {
    return {
      valid: false,
      code: "under_16",
      message: "Konto IdeaHire można utworzyć po ukończeniu 16 lat.",
    };
  }

  if (!hasReachedAge(birthDate, FULL_ACCOUNT_AGE)) {
    return {
      valid: true,
      code: "minor_limited",
      message: "Utworzysz konto ograniczone. Pełne funkcje zostaną udostępnione po ukończeniu 18 lat.",
    };
  }

  return {
    valid: true,
    code: "adult",
    message: "Spełniasz wymaganie wieku dla pełnego konta IdeaHire.",
  };
}

function AgeAccessProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const activeUserIdRef = useRef(user?.id || null);

  async function loadAgeAccess(requestedUserId = user?.id) {
    if (!requestedUserId) {
      setDateOfBirth("");
      setResolvedUserId(null);
      setErrorMessage("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("ideahire_age_profiles")
        .select("date_of_birth")
        .eq("user_id", requestedUserId)
        .maybeSingle();

      if (error) throw error;

      if (activeUserIdRef.current !== requestedUserId) return;

      setDateOfBirth(data?.date_of_birth || "");
      setResolvedUserId(requestedUserId);
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;

      console.error("AGE ACCESS LOAD ERROR:", error);
      setDateOfBirth("");
      setResolvedUserId(requestedUserId);
      setErrorMessage(
        "Nie udało się sprawdzić uprawnień wiekowych konta."
      );
    } finally {
      if (activeUserIdRef.current === requestedUserId) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (authLoading) return;

    const nextUserId = user?.id || null;
    activeUserIdRef.current = nextUserId;

    if (nextUserId !== resolvedUserId) {
      setDateOfBirth("");
      setErrorMessage("");
    }

    loadAgeAccess(nextUserId);
  }, [authLoading, user?.id]);

  const validation = dateOfBirth
    ? getBirthDateValidation(dateOfBirth)
    : null;

  const ageRequired = Boolean(user?.id && !dateOfBirth);
  const isLimited = validation?.code === "minor_limited";
  const isAdult = validation?.code === "adult";

  return (
    <AgeAccessContext.Provider
      value={{
        dateOfBirth,
        status: validation?.code || (ageRequired ? "age_required" : "unknown"),
        ageRequired,
        isLimited,
        isAdult,
        canTransact: isAdult,
        loading:
          authLoading ||
          loading ||
          Boolean(user?.id && resolvedUserId !== user.id),
        errorMessage,
        refreshAgeAccess: loadAgeAccess,
      }}
    >
      {children}
    </AgeAccessContext.Provider>
  );
}

function useAgeAccess() {
  return useContext(AgeAccessContext) || {
    dateOfBirth: "",
    status: "unknown",
    ageRequired: false,
    isLimited: false,
    isAdult: false,
    canTransact: false,
    loading: true,
    errorMessage: "",
    refreshAgeAccess: async () => {},
  };
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
    user,
  } = useAuth();

  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);

  if (
    loading ||
    (isLoggedIn && staffLoading)
  ) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return (
      <Navigate
        to={
          isStaff
            ? "/admin"
            : "/account"
        }
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ACCOUNT MODE ROUTES
========================================================= */

function UserOnlyRoute({ children, allowLimited = false }) {
  const { user } = useAuth();
  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);
  const {
    ageRequired,
    isLimited,
    loading: ageLoading,
  } = useAgeAccess();

  if (staffLoading || ageLoading) {
    return <LoadingScreen />;
  }

  if (isStaff) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (ageRequired) {
    return <AgeCompletionScreen />;
  }

  if (isLimited && !allowLimited) {
    return (
      <Navigate
        to="/account"
        replace
        state={{ ageRestricted: true }}
      />
    );
  }

  return children;
}

function AgeCompletionScreen() {
  const { refreshAgeAccess, errorMessage } = useAgeAccess();
  const [birthDate, setBirthDate] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const validation = birthDate
    ? getBirthDateValidation(birthDate)
    : null;

  async function handleCompleteAge(event) {
    event.preventDefault();

    if (saving) return;

    if (!validation?.valid) {
      setMessage(
        validation?.message || "Wpisz prawidłową datę urodzenia."
      );
      return;
    }

    if (!acknowledged) {
      setMessage("Potwierdź prawidłowość podanej daty urodzenia.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "complete_ideahire_age_profile",
        {
          p_date_of_birth: birthDate,
          p_age_notice_acknowledged: acknowledged,
        }
      );

      if (error) throw error;
      await refreshAgeAccess();
    } catch (error) {
      setMessage(
        error?.message || "Nie udało się zapisać daty urodzenia."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page age-access-page">
      <AccountNavbar />

      <main className="age-access-shell">
        <section className="age-access-card">
          <span className="section-label">Bezpieczeństwo konta</span>
          <h1>Uzupełnij datę urodzenia</h1>
          <p>
            Potrzebujemy jej wyłącznie do przyznania właściwych uprawnień
            konta. Data nie będzie widoczna na Twoim profilu.
          </p>

          <form className="age-access-form" onSubmit={handleCompleteAge}>
            <label>
              Data urodzenia
              <input
                type="date"
                value={birthDate}
                min={getDateInputBoundary(120)}
                max={getDateInputBoundary()}
                onChange={(event) => {
                  setBirthDate(event.target.value);
                  setMessage("");
                }}
                autoComplete="bday"
                required
              />
            </label>

            {validation && (
              <div
                className={`age-access-result is-${validation.code}`}
                role="status"
              >
                <strong>
                  {validation.code === "adult"
                    ? "Pełne konto 18+"
                    : validation.code === "minor_limited"
                    ? "Konto ograniczone 16–17"
                    : "Konto niedostępne"}
                </strong>
                <span>{validation.message}</span>
              </div>
            )}

            <label className="age-access-confirmation">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => {
                  setAcknowledged(event.target.checked);
                  setMessage("");
                }}
                required
              />
              <span>
                <strong>Potwierdzam prawidłowość daty urodzenia.</strong>
                <small>
                  Po zapisaniu samodzielna zmiana daty nie będzie możliwa.
                </small>
              </span>
            </label>

            {(message || errorMessage) && (
              <p className="auth-error" role="alert">
                {message || errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-dark btn-large"
              disabled={saving || !validation?.valid || !acknowledged}
            >
              {saving ? "Zapisywanie..." : "Zapisz i kontynuuj →"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function StaffOnlyRoute({ children }) {
  const { user } = useAuth();
  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);

  if (staffLoading) {
    return <LoadingScreen />;
  }

  if (!isStaff) {
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

const MAX_JOB_BUDGET = 15000;

const MAX_JOB_BUDGET_MESSAGE =
  "Nie możesz wpisać wyższej ceny. Maksymalny budżet jednego zlecenia to 15 000 zł.";

const DISPUTE_STATUS_LABELS = {
  awaiting_response: "Oczekiwanie na odpowiedź",
  evidence_collection: "Zbieranie wyjaśnień",
  under_review: "Analiza administratora",
  decision_issued: "Decyzja wydana",
  appealed: "Odwołanie w toku",
  closed: "Sprawa zamknięta",
  cancelled: "Sprawa wycofana",
};

const DISPUTE_REASON_OPTIONS = [
  ["work_not_delivered", "Praca nie została dostarczona"],
  ["work_incomplete", "Praca jest niekompletna"],
  ["quality_issue", "Jakość nie odpowiada ustaleniom"],
  ["deadline_missed", "Nie dotrzymano terminu"],
  ["requirements_dispute", "Spór dotyczący zakresu prac"],
  ["communication_problem", "Problem z komunikacją"],
  ["cancellation", "Anulowanie współpracy"],
  ["payment_issue", "Problem dotyczący płatności"],
  ["other", "Inny powód"],
];

const DISPUTE_OUTCOME_OPTIONS = [
  ["complete_or_correct_work", "Dokończenie lub poprawienie pracy"],
  ["extend_deadline", "Ustalenie nowego terminu"],
  ["cancel_cooperation", "Anulowanie współpracy"],
  ["full_refund", "Pełny zwrot środków"],
  ["partial_refund", "Częściowy zwrot środków"],
  ["release_payment", "Przekazanie płatności wykonawcy"],
  ["other", "Inne rozwiązanie"],
];

const ADMIN_DECISION_OPTIONS = [
  ["work_continue", "Kontynuacja lub poprawienie pracy"],
  ["deadline_extension", "Przedłużenie terminu"],
  ["cancel_no_refund", "Anulowanie bez zwrotu"],
  ["full_refund", "Pełny zwrot"],
  ["partial_refund", "Częściowy zwrot"],
  ["release_payment", "Przekazanie płatności wykonawcy"],
  ["no_action", "Brak dodatkowych działań"],
  ["other", "Inna decyzja"],
];

function getDisputeStatusLabel(status) {
  return DISPUTE_STATUS_LABELS[status] || "Nieznany status";
}

function getOptionLabel(options, value) {
  return options.find(([key]) => key === value)?.[1] || value || "—";
}

function formatDisputeNumber(caseNumber) {
  return `IH-${String(caseNumber || 0).padStart(8, "0")}`;
}

function formatDisputeDate(value, includeTime = true) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  });
}

function cleanSupabaseError(error, fallback) {
  return error?.message || fallback;
}

function useStaffRole(userId) {
  const [staffRole, setStaffRole] = useState(null);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStaffRole(null);
      setStaffLoading(false);
      return;
    }

    let mounted = true;

    async function loadStaffRole() {
      setStaffLoading(true);

      const { data, error } = await supabase
        .from("ideahire_staff")
        .select("role, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("STAFF ROLE ERROR:", error);
        setStaffRole(null);
      } else {
        setStaffRole(data?.role || null);
      }

      setStaffLoading(false);
    }

    loadStaffRole();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return {
    staffRole,
    staffLoading,
    isStaff: staffRole === "owner" || staffRole === "admin",
    isOwner: staffRole === "owner",
  };
}

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

  const {
    isLimited,
    ageRequired,
    loading: ageAccessLoading,
  } = useAgeAccess();

  const hasRestrictedAgeAccess =
    !ageAccessLoading &&
    (isLimited || ageRequired);

  const [
    hasNotifications,
    setHasNotifications,
  ] = useState(false);

  const [
    hasDisputeNotifications,
    setHasDisputeNotifications,
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

    if (hasRestrictedAgeAccess) {
      setHasNotifications(false);
      setHasDisputeNotifications(false);
      return;
    }

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

      const {
        data: disputeNotifications,
        error: disputeNotificationsError,
      } = await supabase
        .from("dispute_notifications")
        .select("id")
        .eq("user_id", user.id)
        .is("read_at", null)
        .limit(1);

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

      if (disputeNotificationsError) {
        console.error(
          "DISPUTE NOTIFICATION ERROR:",
          disputeNotificationsError
        );
      }

      setHasDisputeNotifications(
        !disputeNotificationsError &&
          (disputeNotifications || []).length > 0
      );

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

    function handleDisputeNotificationsRead(event) {
      if (
        !event?.detail?.userId ||
        event.detail.userId === user?.id
      ) {
        setHasDisputeNotifications(false);
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

    window.addEventListener(
      "ideahire:dispute-notifications-read",
      handleDisputeNotificationsRead
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

      window.removeEventListener(
        "ideahire:dispute-notifications-read",
        handleDisputeNotificationsRead
      );
    };
  }, [user?.id, hasRestrictedAgeAccess]);

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
    <header className="navbar account-navbar">
      <div className="account-navbar-brand">
        <Link
          className="navbar-home-back"
          to="/"
          aria-label="Wróć na stronę główną"
          title="Wróć na stronę główną"
        >
          ←
        </Link>

        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>
      </div>

      <nav className="nav-links">
        <NavLink
          to="/account"
          end
          className={({
            isActive,
          }) =>
            isActive
              ? "is-active"
              : ""
          }
        >
          Moje konto
        </NavLink>

        {!hasRestrictedAgeAccess && (
          <NavLink
            to="/find-talent"
            className={({
              isActive,
            }) =>
              isActive
                ? "is-active"
                : ""
            }
          >
            Dodaj zlecenie
          </NavLink>
        )}

        <NavLink
          to="/jobs"
          className={({
            isActive,
          }) =>
            isActive
              ? "is-active"
              : ""
          }
        >
          Znajdź zlecenie
        </NavLink>

        {!hasRestrictedAgeAccess && (
          <>
            <NavLink
              to="/messages"
              className={({
                isActive,
              }) =>
                isActive
                  ? "is-active"
                  : ""
              }
            >
              Wiadomości
            </NavLink>

            <NavLink
              to="/disputes"
              className={({ isActive }) =>
                `notifications-nav-link${
                  isActive ? " is-active" : ""
                }`
              }
            >
              Spory

              {hasDisputeNotifications && (
                <span className="notification-dot" />
              )}
            </NavLink>

            <NavLink
              to="/notifications"
              className={({
                isActive,
              }) =>
                `notifications-nav-link${
                  isActive
                    ? " is-active"
                    : ""
                }`
              }
            >
              Powiadomienia

              {hasNotifications && (
                <span className="notification-dot" />
              )}
            </NavLink>
          </>
        )}
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

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Administracja";

  async function handleAdminLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      navigate("/login", { replace: true });
    } catch (error) {
      alert(
        `Nie udało się wylogować: ${
          error?.message || "Nieznany błąd"
        }`
      );
    }
  }

  return (
    <header className="navbar admin-navbar">
      <Link className="admin-navbar-brand" to="/admin">
        <span className="logo">
          Idea<span>Hire</span>
        </span>
        <span className="admin-navbar-label">Administracja</span>
      </Link>

      <nav className="admin-nav-links" aria-label="Nawigacja administracji">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive || location.pathname.startsWith("/disputes/")
              ? "is-active"
              : ""
          }
        >
          Spory
        </NavLink>

        <NavLink
          to="/admin/jobs"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Zlecenia
        </NavLink>

        <NavLink
          to="/admin/messages"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Wiadomości dowodowe
        </NavLink>
      </nav>

      <div className="admin-navbar-actions">
        <div className="admin-navbar-identity">
          <strong>{displayName}</strong>
          <span>
            {staffRole === "owner" ? "Właściciel" : "Administrator"}
          </span>
        </div>

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleAdminLogout}
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

  const [birthDate, setBirthDate] =
    useState("");

  const [ageNoticeAcknowledged, setAgeNoticeAcknowledged] =
    useState(false);

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

    const birthDateValidation =
      getBirthDateValidation(birthDate);

    if (!birthDateValidation.valid) {
      setMessage(birthDateValidation.message);
      return;
    }

    if (!ageNoticeAcknowledged) {
      setMessage("Potwierdź prawidłowość podanej daty urodzenia.");
      return;
    }

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
              date_of_birth:
                birthDate,
              age_notice_acknowledged:
                true,
              age_notice_version:
                AGE_NOTICE_VERSION,
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
            Data urodzenia

            <input
              type="date"
              value={birthDate}
              min={getDateInputBoundary(120)}
              max={getDateInputBoundary()}
              onChange={(event) => {
                setBirthDate(event.target.value);
                setMessage("");
              }}
              autoComplete="bday"
              required
            />

            <small>
              Data pozostaje prywatna i służy wyłącznie do ustalenia
              uprawnień konta.
            </small>
          </label>

          {birthDate && (
            <div
              className={`registration-age-result is-${
                getBirthDateValidation(birthDate).code
              }`}
              role="status"
            >
              <strong>
                {getBirthDateValidation(birthDate).code === "adult"
                  ? "Pełne konto 18+"
                  : getBirthDateValidation(birthDate).code === "minor_limited"
                  ? "Konto ograniczone 16–17"
                  : "Konto niedostępne"}
              </strong>
              <span>{getBirthDateValidation(birthDate).message}</span>
            </div>
          )}

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

          <label className="age-access-confirmation">
            <input
              type="checkbox"
              checked={ageNoticeAcknowledged}
              onChange={(event) => {
                setAgeNoticeAcknowledged(event.target.checked);
                setMessage("");
              }}
              required
            />
            <span>
              <strong>Potwierdzam prawidłowość daty urodzenia.</strong>
              <small>
                Osoby w wieku 16–17 lat otrzymują konto ograniczone. Pełne
                funkcje płatnych zleceń są dostępne od 18 lat.
              </small>
            </span>
          </label>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading || !ageNoticeAcknowledged}
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

function AccountEntry() {
  const { isLimited } = useAgeAccess();

  return isLimited ? <LimitedAccount /> : <Account />;
}

function LimitedAccount() {
  const location = useLocation();
  const { dateOfBirth } = useAgeAccess();
  const fullAccessDate = getAgeAnniversary(
    dateOfBirth,
    FULL_ACCOUNT_AGE
  );

  const fullAccessLabel = fullAccessDate
    ? fullAccessDate.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "po ukończeniu 18 lat";

  return (
    <div className="page limited-account-page">
      <AccountNavbar />

      <main className="app-page limited-account-shell">
        <div className="app-page-header">
          <span className="section-label">Twoje konto</span>
          <h1>Konto ograniczone</h1>
          <p>
            Możesz bezpiecznie poznawać IdeaHire. Funkcje związane z umowami
            i płatnymi zleceniami zostaną udostępnione po ukończeniu 18 lat.
          </p>
        </div>

        {location.state?.ageRestricted && (
          <p className="limited-account-route-message" role="status">
            Ta funkcja jest dostępna wyłącznie dla pełnych kont 18+.
          </p>
        )}

        <section className="limited-account-hero">
          <div className="limited-account-status-icon" aria-hidden="true">
            16+
          </div>
          <div>
            <span>Konto młodzieżowe 16–17</span>
            <h2>Pełny dostęp od {fullAccessLabel}</h2>
            <p>
              Nie musisz ponownie zakładać konta. Wiek jest obliczany
              automatycznie na podstawie zapisanej, prywatnej daty urodzenia.
            </p>
          </div>
        </section>

        <div className="limited-account-grid">
          <section className="limited-account-panel is-available">
            <span className="limited-account-panel-icon" aria-hidden="true">✓</span>
            <h2>Dostępne teraz</h2>
            <ul>
              <li>przeglądanie zleceń,</li>
              <li>przeglądanie publicznych profili,</li>
              <li>ustawienia języka i wyglądu strony.</li>
            </ul>
            <Link className="btn btn-dark" to="/jobs">
              Przeglądaj zlecenia →
            </Link>
          </section>

          <section className="limited-account-panel is-locked">
            <span className="limited-account-panel-icon" aria-hidden="true">○</span>
            <h2>Dostępne od 18 lat</h2>
            <ul>
              <li>publikowanie i przyjmowanie zleceń,</li>
              <li>wiadomości i formularze współpracy,</li>
              <li>płatności oraz otwieranie nowych sporów.</li>
            </ul>
          </section>
        </div>

        <section className="limited-account-privacy">
          <strong>Twoja data urodzenia pozostaje prywatna</strong>
          <p>
            Nie wyświetlamy jej na profilu ani innym użytkownikom. Jeżeli
            została podana błędnie, korektę przeprowadzi pomoc IdeaHire.
          </p>
        </section>
      </main>
    </div>
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

  const { isAdult } = useAgeAccess();

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

              {isAdult && (
                <span className="account-age-status">Pełne konto · 18+</span>
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
    const digits =
      event.target.value.replace(
        /\D/g,
        ""
      );

    if (!digits) {
      setBudget("");

      if (
        message ===
        MAX_JOB_BUDGET_MESSAGE
      ) {
        setMessage("");
      }

      return;
    }

    const normalizedDigits =
      digits.replace(
        /^0+(?=\d)/,
        ""
      );

    if (
      Number(normalizedDigits) >
      MAX_JOB_BUDGET
    ) {
      setSuccess(false);
      setMessage(
        MAX_JOB_BUDGET_MESSAGE
      );
      return;
    }

    setBudget(normalizedDigits);

    if (
      message ===
      MAX_JOB_BUDGET_MESSAGE
    ) {
      setMessage("");
    }
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

    if (
      numericBudget >
      MAX_JOB_BUDGET
    ) {
      setMessage(
        MAX_JOB_BUDGET_MESSAGE
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
        if (
          error.code === "23514"
        ) {
          setMessage(
            MAX_JOB_BUDGET_MESSAGE
          );

          return;
        }

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

      <style>{`
        .project-form .job-budget-limit-note {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 13px;
          margin-top: 3px;
          padding: 15px 16px;
          border: 1px solid #e1e1dc;
          border-radius: 15px;
          background: #f5f5f1;
          color: #555550;
        }

        .project-form .job-budget-limit-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #d7d7d1;
          border-radius: 50%;
          background: #ffffff;
          color: #62625d;
          font-size: 15px;
          font-style: normal;
          font-weight: 850;
        }

        .project-form .job-budget-limit-copy {
          min-width: 0;
        }

        .project-form .job-budget-limit-copy strong,
        .project-form .job-budget-limit-copy small {
          display: block;
        }

        .project-form .job-budget-limit-copy strong {
          color: #343431;
          font-size: 19px;
          line-height: 1.25;
          letter-spacing: -0.25px;
        }

        .project-form .job-budget-limit-copy small {
          margin-top: 4px;
          color: #777771;
          font-size: 12px;
          font-weight: 550;
          line-height: 1.5;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-note {
          border-color: #393935;
          background: #20201e;
          color: #b7b7b1;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-icon {
          border-color: #454540;
          background: #2a2a27;
          color: #eeeeea;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-copy strong {
          color: #f1f1ed !important;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-copy small {
          color: #aaa9a3 !important;
        }

        @media (max-width: 600px) {
          .project-form .job-budget-limit-note {
            padding: 13px 14px;
          }

          .project-form .job-budget-limit-copy strong {
            font-size: 17px;
          }
        }
      `}</style>

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
              maxLength={5}
              aria-describedby="job-budget-help"
              aria-label="Budżet zlecenia, maksymalnie 15 000 zł"
              required
            />

            <div
              className="job-budget-limit-note"
              id="job-budget-help"
              role="note"
            >
              <i
                className="job-budget-limit-icon"
                aria-hidden="true"
              >
                i
              </i>

              <span className="job-budget-limit-copy">
                <strong>
                  Maksymalnie 15 000 zł
                </strong>

                <small>
                  Wyższej kwoty nie można wpisać ani opublikować. Cena po publikacji pozostaje zablokowana.
                </small>
              </span>
            </div>
          </label>

          {message && (
            <p
              className={
                success
                  ? "auth-message"
                  : "auth-error"
              }
              role={
                success
                  ? "status"
                  : "alert"
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

  const {
    canTransact,
    isLimited,
  } = useAgeAccess();

  const location =
    useLocation();

  const navigate =
    useNavigate();

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

  useEffect(() => {
    const category =
      new URLSearchParams(
        location.search
      ).get("category");

    setSelectedCategory(
      category &&
        JOB_CATEGORIES.includes(
          category
        )
        ? category
        : "Wszystkie"
    );
  }, [location.search]);

  function chooseCategory(
    category
  ) {
    setSelectedCategory(
      category
    );

    navigate(
      category === "Wszystkie"
        ? "/jobs"
        : `/jobs?category=${encodeURIComponent(
            category
          )}`,
      { replace: true }
    );
  }

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

    if (!canTransact) {
      setMessage(
        "Zgłaszanie się do płatnych zleceń jest dostępne od 18 lat."
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
    navigate("/jobs", {
      replace: true,
    });
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

        {isLimited && (
          <section className="jobs-age-notice">
            <span className="jobs-age-notice-icon" aria-hidden="true">16+</span>
            <div>
              <strong>Przeglądanie dostępne</strong>
              <p>
                Na koncie ograniczonym możesz oglądać zlecenia i profile.
                Zgłaszanie się do płatnych zleceń zostanie odblokowane po
                ukończeniu 18 lat.
              </p>
            </div>
          </section>
        )}

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
                chooseCategory(
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
                    chooseCategory(
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
                              !canTransact ||
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
                            {!canTransact
                              ? "Dostępne od 18 lat"
                              : alreadyApplied
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
                            !canTransact ||
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
                          {!canTransact
                            ? "Dostępne od 18 lat"
                            : alreadyApplied
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

const EMPTY_DISPUTE_FORM = {
  reason: "",
  requestedOutcome: "",
  requestedAmount: "",
  description: "",
  contextNoticeAcknowledged: false,
};

function ChatDisputePanel({
  agreement,
  conversation,
}) {
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_DISPUTE_FORM);

  useEffect(() => {
    if (
      !agreement?.id ||
      agreement.status !== "accepted"
    ) {
      setDispute(null);
      setFormOpen(false);
      return;
    }

    let mounted = true;

    async function loadDispute() {
      setLoading(true);

      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("agreement_id", agreement.id)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setMessage(
          cleanSupabaseError(
            error,
            "Nie udało się sprawdzić statusu sporu."
          )
        );
      } else {
        setDispute(data || null);
      }

      setLoading(false);
    }

    loadDispute();

    return () => {
      mounted = false;
    };
  }, [agreement?.id, agreement?.status]);

  if (
    !conversation?.id ||
    !agreement?.id ||
    agreement.status !== "accepted"
  ) {
    return null;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "requestedOutcome" && value !== "partial_refund"
        ? { requestedAmount: "" }
        : {}),
    }));
    setMessage("");
  }

  async function handleOpenDispute(event) {
    event.preventDefault();

    if (saving) return;

    const description = form.description.trim();

    if (!form.reason) {
      setMessage("Wybierz powód sporu.");
      return;
    }

    if (!form.requestedOutcome) {
      setMessage("Wybierz oczekiwane rozwiązanie.");
      return;
    }

    if (description.length < 20) {
      setMessage("Opisz sytuację w co najmniej 20 znakach.");
      return;
    }

    if (!form.contextNoticeAcknowledged) {
      setMessage(
        "Potwierdź zapoznanie się z informacją o dostępie administratora."
      );
      return;
    }

    let requestedAmount = null;

    if (form.requestedOutcome === "partial_refund") {
      requestedAmount = Number(
        String(form.requestedAmount).replace(",", ".")
      );

      if (
        !Number.isFinite(requestedAmount) ||
        requestedAmount <= 0 ||
        requestedAmount >= Number(agreement.price_amount)
      ) {
        setMessage(
          "Kwota częściowego zwrotu musi być większa od 0 i mniejsza od ceny zlecenia."
        );
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "open_ideahire_dispute_v2",
        {
          p_agreement_id: agreement.id,
          p_reason: form.reason,
          p_description: description,
          p_requested_outcome: form.requestedOutcome,
          p_requested_amount: requestedAmount,
          p_context_notice_acknowledged:
            form.contextNoticeAcknowledged,
        }
      );

      if (error) throw error;

      setForm(EMPTY_DISPUTE_FORM);
      setFormOpen(false);

      if (data) {
        navigate(`/disputes/${data}`);
      }
    } catch (error) {
      setMessage(
        cleanSupabaseError(
          error,
          "Nie udało się otworzyć sporu."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="chat-dispute-card is-loading">
        Sprawdzanie centrum sporu...
      </section>
    );
  }

  if (dispute) {
    return (
      <section className="chat-dispute-card has-dispute">
        <div className="chat-dispute-copy">
          <span className="dispute-eyebrow">
            Centrum sporu
          </span>
          <strong>
            {formatDisputeNumber(dispute.case_number)}
          </strong>
          <small>
            {getDisputeStatusLabel(dispute.status)}
          </small>
        </div>

        <button
          type="button"
          className="dispute-secondary-button"
          onClick={() => navigate(`/disputes/${dispute.id}`)}
        >
          Otwórz sprawę
        </button>
      </section>
    );
  }

  return (
    <section className="chat-dispute-card">
      {!formOpen ? (
        <>
          <div className="chat-dispute-copy">
            <span className="dispute-eyebrow">
              Bezpieczna współpraca
            </span>
            <strong>Problem z realizacją zlecenia?</strong>
            <small>
              Otwórz uporządkowaną sprawę i przedstaw swoje wyjaśnienia.
            </small>
          </div>

          <button
            type="button"
            className="dispute-danger-button"
            onClick={() => {
              setFormOpen(true);
              setMessage("");
            }}
          >
            Zgłoś problem
          </button>
        </>
      ) : (
        <form className="dispute-open-form" onSubmit={handleOpenDispute}>
          <div className="dispute-form-heading">
            <div>
              <span className="dispute-eyebrow">Nowa sprawa</span>
              <h3>Opisz problem</h3>
              <p>
                Druga strona otrzyma Twoje zgłoszenie i będzie mogła odpowiedzieć.
              </p>
            </div>

            <button
              type="button"
              className="dispute-close-form"
              aria-label="Zamknij formularz sporu"
              onClick={() => {
                setFormOpen(false);
                setMessage("");
              }}
            >
              ×
            </button>
          </div>

          <div className="dispute-form-grid">
            <label className="dispute-field">
              <span>Powód sporu</span>
              <select
                value={form.reason}
                onChange={(event) =>
                  updateField("reason", event.target.value)
                }
                required
              >
                <option value="">Wybierz powód</option>
                {DISPUTE_REASON_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="dispute-field">
              <span>Oczekiwane rozwiązanie</span>
              <select
                value={form.requestedOutcome}
                onChange={(event) =>
                  updateField("requestedOutcome", event.target.value)
                }
                required
              >
                <option value="">Wybierz rozwiązanie</option>
                {DISPUTE_OUTCOME_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {form.requestedOutcome === "partial_refund" && (
              <label className="dispute-field">
                <span>Proponowana kwota zwrotu</span>
                <div className="dispute-money-input">
                  <input
                    type="number"
                    min="0.01"
                    max={Math.max(Number(agreement.price_amount) - 0.01, 0.01)}
                    step="0.01"
                    value={form.requestedAmount}
                    onChange={(event) =>
                      updateField("requestedAmount", event.target.value)
                    }
                    required
                  />
                  <span>PLN</span>
                </div>
              </label>
            )}

            <label className="dispute-field dispute-field-wide">
              <span>Opis sytuacji</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                minLength={20}
                maxLength={10000}
                rows={6}
                placeholder="Napisz, co się wydarzyło, kiedy wystąpił problem i które ustalenia nie zostały spełnione."
                required
              />
              <small>{form.description.length}/10 000 znaków</small>
            </label>
          </div>

          <section
            className="dispute-context-notice"
            aria-labelledby="dispute-context-notice-title"
          >
            <div className="dispute-context-notice-heading">
              <span className="dispute-context-notice-icon" aria-hidden="true">
                i
              </span>
              <div>
                <strong id="dispute-context-notice-title">
                  Jak administracja analizuje spór
                </strong>
                <p>
                  Po przejęciu sprawy przypisany administrator IdeaHire otrzyma
                  dostęp do materiałów potrzebnych do jej rozpatrzenia.
                </p>
              </div>
            </div>

            <ul className="dispute-context-notice-list">
              <li>pełna rozmowa dotycząca tego zlecenia,</li>
              <li>wszystkie wersje formularza współpracy,</li>
              <li>wyjaśnienia oraz dowody dołączone do sporu.</li>
            </ul>

            <p className="dispute-context-notice-safety">
              Dostęp ma wyłącznie administrator przypisany do sprawy, tylko do
              odczytu. Każde otwarcie pełnego kontekstu jest zapisywane w
              rejestrze działań.
            </p>

            <label className="dispute-context-acknowledgement">
              <input
                type="checkbox"
                checked={form.contextNoticeAcknowledged}
                onChange={(event) =>
                  updateField(
                    "contextNoticeAcknowledged",
                    event.target.checked
                  )
                }
                required
              />
              <span>
                <strong>
                  Potwierdzam, że zapoznałem się z informacją o dostępie
                  administratora.
                </strong>
                <small>
                  To potwierdzenie dotyczy zasad analizy sporu i zostanie
                  zapisane wraz ze zgłoszeniem.
                </small>
              </span>
            </label>
          </section>

          <p className="dispute-form-notice">
            Zgłoszenie zostanie przypisane do zaakceptowanej wersji ustaleń. Cena i termin nie mogą zostać podmienione.
          </p>

          {message && (
            <p className="dispute-inline-message is-error">{message}</p>
          )}

          <div className="dispute-form-actions">
            <button
              type="button"
              className="dispute-secondary-button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="dispute-primary-button"
              disabled={saving || !form.contextNoticeAcknowledged}
            >
              {saving ? "Wysyłanie..." : "Otwórz spór"}
            </button>
          </div>
        </form>
      )}

      {!formOpen && message && (
        <p className="dispute-inline-message is-error">{message}</p>
      )}
    </section>
  );
}

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

function parseAgreementPrice(value) {
  let normalized = String(value || "")
    .trim()
    .replace(/[\s\u00a0]/g, "")
    .replace(/PLN|EUR|USD|GBP|ZŁ/gi, "");

  const commaIndex =
    normalized.lastIndexOf(",");

  const dotIndex =
    normalized.lastIndexOf(".");

  if (
    commaIndex >= 0 &&
    dotIndex >= 0
  ) {
    normalized =
      commaIndex > dotIndex
        ? normalized
            .replace(/\./g, "")
            .replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(
      ",",
      "."
    );
  } else if (dotIndex >= 0) {
    const parts =
      normalized.split(".");

    if (
      parts.length === 2 &&
      parts[1].length === 3 &&
      parts[0].length <= 3
    ) {
      normalized = parts.join("");
    }
  }

  return Number(normalized);
}

function agreementToForm(
  agreement,
  fallbackTitle = "",
  fallbackPrice = ""
) {
  if (!agreement) {
    return {
      ...EMPTY_AGREEMENT_FORM,
      title: fallbackTitle || "",
      priceAmount:
        fallbackPrice === null ||
        fallbackPrice === undefined
          ? ""
          : String(fallbackPrice),
      priceCurrency: "PLN",
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

  const [expanded, setExpanded] =
    useState(true);

  useEffect(() => {
    setConfirmed(false);
    setExpanded(true);
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
    <section className="agreement-workspace">
      <button
        type="button"
        className="agreement-workspace-toggle"
        onClick={() =>
          setExpanded((current) => !current)
        }
        aria-expanded={expanded}
      >
        <span>
          <strong>Warunki współpracy</strong>
          <small>
            Czat negocjacyjny jest aktywny · realizacja ruszy po wspólnej akceptacji
          </small>
        </span>
        <b aria-hidden="true">
          {expanded ? "−" : "+"}
        </b>
      </button>

      {expanded && (
      <section className="agreement-gate">
      <div className="agreement-gate-heading">
        <span className="agreement-eyebrow">
          Ustalenia przed rozpoczęciem
        </span>

        <h2>Ustalcie warunki współpracy</h2>

        <p>
          Możecie już rozmawiać na czacie. Realizacja zlecenia rozpocznie się, gdy obie strony zaakceptują dokładnie tę samą wersję ustaleń.
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
              <span>Cena zlecenia</span>
              <div className="agreement-price-input">
                <input
                  type="text"
                  value={form.priceAmount}
                  disabled
                  readOnly
                  aria-label="Cena ustalona przy publikacji zlecenia"
                />
                <span className="agreement-price-currency">
                  PLN
                </span>
              </div>
              <small className="agreement-fixed-price-note">
                Cena została ustalona przez zleceniodawcę przy publikacji zlecenia i nie podlega zmianie.
              </small>
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
      ) : (
        <div className="agreement-waiting-card">
          <span
            className="agreement-waiting-icon"
            aria-hidden="true"
          >
            ◷
          </span>

          <div>
            <h3>
              Czekamy na propozycję zleceniodawcy
            </h3>
            <p>
              Zleceniodawca wypełnia pierwszy formularz. Gdy go wyśle, zobaczysz wszystkie warunki i będziesz mógł je zaakceptować albo zaproponować zmiany.
            </p>
          </div>
        </div>
      )}
      </section>
      )}
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

  const [jobBudget, setJobBudget] =
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
    fallbackTitle = "",
    fallbackPrice = ""
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
        if (
          conversationData.client_id ===
          user?.id
        ) {
          setAgreementForm(
            agreementToForm(
              null,
              fallbackTitle,
              fallbackPrice
            )
          );
          setAgreementMode("form");
        } else {
          setAgreementMode("view");
        }
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
            .select("title, budget")
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

        const loadedJobBudget =
          jobResult.data?.budget ?? "";

        setJobTitle(
          loadedJobTitle
        );

        setJobBudget(
          loadedJobBudget
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
          loadedJobTitle,
          loadedJobBudget
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
    setAgreementForm({
      ...agreementToForm(
        agreement,
        jobTitle,
        jobBudget
      ),
      priceAmount:
        jobBudget === null ||
        jobBudget === undefined
          ? ""
          : String(jobBudget),
      priceCurrency: "PLN",
    });
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

    if (
      !agreement &&
      conversation?.client_id !==
        user.id
    ) {
      setAgreementMessage(
        "Pierwszą propozycję warunków wysyła zleceniodawca."
      );
      return;
    }

    const price =
      parseAgreementPrice(
        agreementForm.priceAmount
      );

    const revisions = Number(
      agreementForm.revisions
    );

    const today = new Date();
    const todayLocal = [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(2, "0"),
      String(
        today.getDate()
      ).padStart(2, "0"),
    ].join("-");

    if (
      agreementForm.title.trim().length < 3
    ) {
      setAgreementMessage(
        "Nazwa zlecenia musi mieć co najmniej 3 znaki."
      );
      return;
    }

    if (
      agreementForm.scope.trim().length < 10
    ) {
      setAgreementMessage(
        "Zakres pracy musi mieć co najmniej 10 znaków."
      );
      return;
    }

    if (
      agreementForm.deliverables.trim().length < 3
    ) {
      setAgreementMessage(
        "Opisz rezultat końcowy zlecenia."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      price > MAX_JOB_BUDGET
    ) {
      setAgreementMessage(
        "Nie udało się pobrać ceny ze zlecenia. Odśwież stronę i spróbuj ponownie."
      );
      return;
    }

    if (!agreementForm.deadline) {
      setAgreementMessage(
        "Wybierz termin wykonania."
      );
      return;
    }

    if (
      agreementForm.deadline <
      todayLocal
    ) {
      setAgreementMessage(
        "Termin wykonania nie może być wcześniejszy niż dzisiaj."
      );
      return;
    }

    if (
      !Number.isInteger(revisions) ||
      revisions < 0 ||
      revisions > 100
    ) {
      setAgreementMessage(
        "Wpisz pełną liczbę poprawek od 0 do 100."
      );
      return;
    }

    if (
      agreementForm.deliveryFormat.trim().length < 2
    ) {
      setAgreementMessage(
        "Wpisz format przekazania pracy."
      );
      return;
    }

    if (
      agreementForm.acceptanceMethod.trim().length < 3
    ) {
      setAgreementMessage(
        "Opisz sposób odbioru pracy."
      );
      return;
    }

    if (
      agreementForm.cancellationTerms.trim().length < 3
    ) {
      setAgreementMessage(
        "Opisz warunki anulowania zlecenia."
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
        jobTitle,
        jobBudget
      );

      setAgreementMessage(
        "Propozycja została wysłana. Możecie dalej omawiać ją na czacie."
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
        jobTitle,
        jobBudget
      );

      setAgreementMessage(
        "Warunki zostały zaakceptowane i zablokowane. Zlecenie może rozpocząć realizację."
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
      blockedMe
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

              <ChatDisputePanel
                agreement={agreement}
                conversation={conversation}
              />

              {agreementsRequired &&
                !agreementAccepted && (
                  <p className="agreement-negotiation-banner">
                    Czat negocjacyjny jest otwarty. Możecie omawiać i zmieniać propozycję, ale realizacja zlecenia rozpocznie się dopiero po wspólnej akceptacji warunków.
                  </p>
                )}

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
        </div>
      </main>
    </div>
  );
}


/* =========================================================
   DISPUTES AND ADMINISTRATION
========================================================= */

const DISPUTE_WRITABLE_STATUSES = [
  "awaiting_response",
  "evidence_collection",
  "under_review",
  "appealed",
];

const EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];

const ADMIN_AUDIT_LABELS = {
  owner_bootstrapped: "Utworzono konto właściciela",
  admin_granted: "Nadano rolę administratora",
  admin_revoked: "Odebrano rolę administratora",
  dispute_opened: "Otwarto spór",
  dispute_context_notice_acknowledged:
    "Potwierdzono informację o dostępie administracji",
  statement_added: "Dodano wyjaśnienie",
  first_response_added: "Dodano pierwszą odpowiedź",
  dispute_cancelled: "Wycofano spór",
  evidence_registered: "Dodano plik dowodowy",
  chat_message_attached: "Dołączono wiadomość jako dowód",
  dispute_taken_for_review: "Przejęto sprawę do analizy",
  dispute_viewed: "Wyświetlono sprawę",
  case_context_viewed: "Wyświetlono pełny czat i formularz",
  admin_message_added: "Wysłano wiadomość administratora",
  internal_note_added: "Dodano notatkę wewnętrzną",
  decision_issued: "Wydano decyzję",
  appeal_submitted: "Złożono odwołanie",
  dispute_closed: "Zamknięto sprawę",
};

function formatDisputeMoney(value, currency = "PLN") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return `${amount.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function getDisputeProfileName(profile, fallback) {
  return profile?.name?.trim() || fallback;
}

function DisputeStatusPill({ status }) {
  return (
    <span className={`dispute-status-pill is-${status}`}>
      {getDisputeStatusLabel(status)}
    </span>
  );
}

function DisputeListCard({ dispute, userId, adminView = false }) {
  const participantRole =
    dispute.client_id === userId
      ? "Zleceniodawca"
      : "Wykonawca";

  return (
    <Link
      className="dispute-list-card"
      to={`/disputes/${dispute.id}`}
    >
      <div className="dispute-list-card-main">
        <div className="dispute-list-card-topline">
          <span className="dispute-case-number">
            {formatDisputeNumber(dispute.case_number)}
          </span>
          <DisputeStatusPill status={dispute.status} />
        </div>

        <h2>{dispute.job_title_snapshot}</h2>

        <div className="dispute-card-meta">
          <span>
            {adminView
              ? dispute.assigned_admin_id
                ? "Przypisana do administratora"
                : "Nieprzypisana"
              : `Twoja rola: ${participantRole}`}
          </span>
          <span>{formatDisputeMoney(
            dispute.price_amount_snapshot,
            dispute.price_currency_snapshot
          )}</span>
          <span>Otwarto: {formatDisputeDate(dispute.opened_at)}</span>
        </div>
      </div>

      <span className="dispute-card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function Disputes() {
  const { user } = useAuth();
  const { isStaff } = useStaffRole(user?.id);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState("active");

  async function loadDisputes() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .or(`client_id.eq.${user.id},contractor_id.eq.${user.id}`)
      .order("opened_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    setDisputes(data || []);
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function preparePage() {
      setLoading(true);
      setErrorMessage("");

      try {
        await loadDisputes();

        const { error } = await supabase.rpc(
          "mark_dispute_notifications_read",
          { p_notification_ids: null }
        );

        if (error) {
          console.error("DISPUTE NOTIFICATIONS READ ERROR:", error);
        } else {
          window.dispatchEvent(
            new CustomEvent("ideahire:dispute-notifications-read", {
              detail: { userId: user.id },
            })
          );
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            cleanSupabaseError(error, "Nie udało się pobrać spraw.")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    preparePage();

    const channel = supabase
      .channel(`disputes-list-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes" },
        () => loadDisputes().catch(console.error)
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispute_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadDisputes().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const visibleDisputes = disputes.filter((dispute) => {
    if (filter === "all") return true;
    if (filter === "closed") {
      return ["closed", "cancelled"].includes(dispute.status);
    }

    return !["closed", "cancelled"].includes(dispute.status);
  });

  return (
    <div className="account-page disputes-page">
      <AccountNavbar />

      <main className="disputes-shell">
        <header className="disputes-page-header">
          <div>
            <span className="section-label">Bezpieczna współpraca</span>
            <h1>Centrum sporów</h1>
            <p>
              Tutaj znajdziesz zgłoszone problemy, wyjaśnienia, dowody i decyzje administratora.
            </p>
          </div>

          {isStaff && (
            <Link className="dispute-primary-button" to="/admin">
              Otwórz panel administratora
            </Link>
          )}
        </header>

        <div className="disputes-filter-bar" role="group" aria-label="Filtr spraw">
          {[
            ["active", "Aktywne"],
            ["closed", "Zakończone"],
            ["all", "Wszystkie"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "is-active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="dispute-state-card">Ładowanie spraw...</div>
        ) : errorMessage ? (
          <div className="dispute-state-card is-error">{errorMessage}</div>
        ) : visibleDisputes.length === 0 ? (
          <div className="dispute-state-card">
            <span className="dispute-state-icon" aria-hidden="true">✓</span>
            <h2>Brak spraw w tej sekcji</h2>
            <p>
              Spór można otworzyć z poziomu rozmowy po wspólnej akceptacji warunków współpracy.
            </p>
            <Link className="dispute-secondary-button" to="/messages">
              Przejdź do wiadomości
            </Link>
          </div>
        ) : (
          <div className="dispute-list">
            {visibleDisputes.map((dispute) => (
              <DisputeListCard
                key={dispute.id}
                dispute={dispute}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DisputeDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { staffRole, staffLoading, isStaff } = useStaffRole(user?.id);
  const recordedAccessRef = useRef("");
  const recordedContextAccessRef = useRef("");
  const fileInputRef = useRef(null);

  const [dispute, setDispute] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [statements, setStatements] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [messageEvidence, setMessageEvidence] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminAgreements, setAdminAgreements] = useState([]);
  const [adminContextLoading, setAdminContextLoading] = useState(false);
  const [adminContextError, setAdminContextError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [statementBody, setStatementBody] = useState("");
  const [fileCaption, setFileCaption] = useState("");
  const [showMessagePicker, setShowMessagePicker] = useState(false);
  const [appealBody, setAppealBody] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [adminNotePublic, setAdminNotePublic] = useState(true);
  const [decisionForm, setDecisionForm] = useState({
    outcome: "",
    amount: "",
    rationale: "",
  });

  const isParticipant = Boolean(
    dispute &&
      user?.id &&
      [dispute.client_id, dispute.contractor_id].includes(user.id)
  );

  const canAddEvidence = Boolean(
    !isStaff &&
      isParticipant &&
      DISPUTE_WRITABLE_STATUSES.includes(dispute?.status)
  );

  async function loadCase(showLoader = false) {
    if (!id || !user?.id) return;

    if (showLoader) setLoading(true);

    try {
      const { data: disputeData, error: disputeError } = await supabase
        .from("disputes")
        .select("*")
        .eq("id", id)
        .single();

      if (disputeError) throw disputeError;

      const participant = [
        disputeData.client_id,
        disputeData.contractor_id,
      ].includes(user.id);

      const relatedRequests = [
        supabase
          .from("dispute_statements")
          .select("*")
          .eq("dispute_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_evidence")
          .select("*")
          .eq("dispute_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_message_evidence")
          .select("*")
          .eq("dispute_id", id)
          .order("message_created_at_snapshot", { ascending: true }),
        supabase
          .from("dispute_decisions")
          .select("*")
          .eq("dispute_id", id)
          .order("version", { ascending: false }),
        supabase
          .from("dispute_appeals")
          .select("*")
          .eq("dispute_id", id)
          .order("created_at", { ascending: false }),
      ];

      const [
        statementResult,
        evidenceResult,
        messageEvidenceResult,
        decisionResult,
        appealResult,
      ] = await Promise.all(relatedRequests);

      for (const result of [
        statementResult,
        evidenceResult,
        messageEvidenceResult,
        decisionResult,
        appealResult,
      ]) {
        if (result.error) throw result.error;
      }

      const profileIds = [
        disputeData.client_id,
        disputeData.contractor_id,
        disputeData.assigned_admin_id,
        ...(statementResult.data || []).map((item) => item.author_user_id),
      ].filter(Boolean);

      let profileMap = {};
      const uniqueProfileIds = [...new Set(profileIds)];

      if (uniqueProfileIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", uniqueProfileIds);

        if (profileError) {
          console.error("DISPUTE PROFILES ERROR:", profileError);
        } else {
          profileMap = Object.fromEntries(
            (profileRows || []).map((profile) => [profile.id, profile])
          );
        }
      }

      let conversationMessages = [];
      let fullAdminMessages = [];
      let fullAdminAgreements = [];

      if (participant && !isStaff) {
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("conversation_id", disputeData.conversation_id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("DISPUTE CHAT MESSAGES ERROR:", error);
        } else {
          conversationMessages = data || [];
        }
      }

      const canReadAdminContext = Boolean(
        isStaff && disputeData.assigned_admin_id === user.id
      );

      if (canReadAdminContext) {
        setAdminContextLoading(true);
        setAdminContextError("");

        try {
          const { data: agreementRows, error: agreementError } = await supabase
            .from("conversation_agreements")
            .select("*")
            .eq("conversation_id", disputeData.conversation_id)
            .order("version", { ascending: false });

          if (agreementError) throw agreementError;
          fullAdminAgreements = agreementRows || [];

          const pageSize = 500;
          let from = 0;

          while (true) {
            const { data: messageRows, error: messageError } = await supabase
              .from("messages")
              .select("id, conversation_id, sender_id, content, created_at, read_at")
              .eq("conversation_id", disputeData.conversation_id)
              .order("created_at", { ascending: true })
              .range(from, from + pageSize - 1);

            if (messageError) throw messageError;

            const currentPage = messageRows || [];
            fullAdminMessages.push(...currentPage);

            if (currentPage.length < pageSize) break;
            from += pageSize;
          }
        } catch (contextError) {
          console.error("ADMIN CASE CONTEXT ERROR:", contextError);
          setAdminContextError(
            cleanSupabaseError(
              contextError,
              "Nie udało się pobrać pełnego kontekstu sprawy."
            )
          );
        } finally {
          setAdminContextLoading(false);
        }
      } else {
        setAdminContextError("");
      }

      setDispute(disputeData);
      setProfiles(profileMap);
      setStatements(statementResult.data || []);
      setEvidence(evidenceResult.data || []);
      setMessageEvidence(messageEvidenceResult.data || []);
      setDecisions(decisionResult.data || []);
      setAppeals(appealResult.data || []);
      setChatMessages(conversationMessages);
      setAdminChatMessages(fullAdminMessages);
      setAdminAgreements(fullAdminAgreements);
      setPageMessage("");

      const { data: notificationRows, error: notificationError } = await supabase
        .from("dispute_notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("dispute_id", id)
        .is("read_at", null);

      if (!notificationError && notificationRows?.length) {
        await supabase.rpc("mark_dispute_notifications_read", {
          p_notification_ids: notificationRows.map((item) => item.id),
        });

        window.dispatchEvent(
          new CustomEvent("ideahire:dispute-notifications-read", {
            detail: { userId: user.id },
          })
        );
      }
    } catch (error) {
      setPageMessage(
        cleanSupabaseError(error, "Nie udało się pobrać szczegółów sprawy.")
      );
      setDispute(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (staffLoading) return;
    loadCase(true);
  }, [id, user?.id, isStaff, staffLoading]);

  useEffect(() => {
    if (!id || !user?.id || staffLoading) return;

    const refresh = () => loadCase(false);
    const channel = supabase
      .channel(`dispute-details-${id}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "disputes", filter: `id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_statements", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_evidence", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_message_evidence", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_decisions", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, user?.id, staffLoading, isStaff]);

  useEffect(() => {
    if (
      !id ||
      !user?.id ||
      !isStaff ||
      dispute?.assigned_admin_id !== user.id ||
      !dispute?.conversation_id
    ) {
      return;
    }

    const refreshContext = () => loadCase(false);
    const channel = supabase
      .channel(`admin-case-context-${id}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${dispute.conversation_id}`,
        },
        refreshContext
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_agreements",
          filter: `conversation_id=eq.${dispute.conversation_id}`,
        },
        refreshContext
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [
    id,
    user?.id,
    isStaff,
    dispute?.assigned_admin_id,
    dispute?.conversation_id,
  ]);

  useEffect(() => {
    if (
      !id ||
      staffLoading ||
      !isStaff ||
      recordedAccessRef.current === id
    ) {
      return;
    }

    recordedAccessRef.current = id;
    supabase
      .rpc("admin_record_dispute_access", { p_dispute_id: id })
      .then(({ error }) => {
        if (error) console.error("ADMIN ACCESS LOG ERROR:", error);
      });
  }, [id, isStaff, staffLoading]);

  useEffect(() => {
    if (
      !id ||
      !user?.id ||
      staffLoading ||
      !isStaff ||
      dispute?.assigned_admin_id !== user.id ||
      recordedContextAccessRef.current === id
    ) {
      return;
    }

    recordedContextAccessRef.current = id;
    supabase
      .rpc("admin_record_case_context_access", { p_dispute_id: id })
      .then(({ error }) => {
        if (error) console.error("ADMIN CONTEXT ACCESS LOG ERROR:", error);
      });
  }, [id, user?.id, isStaff, staffLoading, dispute?.assigned_admin_id]);

  async function runAction(actionKey, action, successMessage) {
    if (busy) return false;

    setBusy(actionKey);
    setPageMessage("");

    try {
      await action();
      setPageMessage(successMessage);
      await loadCase(false);
      return true;
    } catch (error) {
      setPageMessage(cleanSupabaseError(error, "Nie udało się wykonać operacji."));
      return false;
    } finally {
      setBusy("");
    }
  }

  async function handleAddStatement(event) {
    event.preventDefault();
    const body = statementBody.trim();

    if (body.length < 3) {
      setPageMessage("Wyjaśnienie musi mieć co najmniej 3 znaki.");
      return;
    }

    const completed = await runAction(
      "statement",
      async () => {
        const { error } = await supabase.rpc("add_dispute_statement", {
          p_dispute_id: id,
          p_body: body,
        });
        if (error) throw error;
      },
      "Wyjaśnienie zostało dodane."
    );

    if (completed) setStatementBody("");
  }

  async function handleEvidenceUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!EVIDENCE_MIME_TYPES.includes(file.type)) {
      setPageMessage("Dozwolone pliki: JPG, PNG, WEBP, PDF lub TXT.");
      return;
    }

    if (file.size <= 0 || file.size > 20 * 1024 * 1024) {
      setPageMessage("Plik dowodowy może mieć maksymalnie 20 MB.");
      return;
    }

    const safeName = file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(-100) || "dowod";
    const uniquePart =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const storagePath = `${id}/${user.id}/${uniquePart}-${safeName}`;

    await runAction(
      "evidence",
      async () => {
        const { error: uploadError } = await supabase.storage
          .from("dispute-evidence")
          .upload(storagePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: registerError } = await supabase.rpc(
          "register_dispute_evidence",
          {
            p_dispute_id: id,
            p_storage_path: storagePath,
            p_caption: fileCaption.trim(),
          }
        );

        if (registerError) throw registerError;
      },
      "Plik dowodowy został bezpiecznie dodany."
    );

    setFileCaption("");
  }

  async function handleAttachMessage(messageId) {
    await runAction(
      `message-${messageId}`,
      async () => {
        const { error } = await supabase.rpc(
          "attach_chat_message_to_dispute",
          { p_dispute_id: id, p_message_id: messageId }
        );
        if (error) throw error;
      },
      "Wiadomość została dołączona jako dowód."
    );
  }

  async function handleOpenEvidence(item) {
    setBusy(`open-${item.id}`);
    setPageMessage("");

    try {
      const { data, error } = await supabase.storage
        .from("dispute-evidence")
        .createSignedUrl(item.storage_path, 60);

      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setPageMessage(cleanSupabaseError(error, "Nie udało się otworzyć pliku."));
    } finally {
      setBusy("");
    }
  }

  async function handleCancelDispute() {
    if (!window.confirm("Czy na pewno chcesz wycofać ten spór?")) return;

    await runAction(
      "cancel",
      async () => {
        const { error } = await supabase.rpc("cancel_ideahire_dispute", {
          p_dispute_id: id,
        });
        if (error) throw error;
      },
      "Spór został wycofany."
    );
  }

  async function handleAppeal(event) {
    event.preventDefault();
    const reason = appealBody.trim();

    if (reason.length < 20) {
      setPageMessage("Uzasadnienie odwołania musi mieć co najmniej 20 znaków.");
      return;
    }

    const completed = await runAction(
      "appeal",
      async () => {
        const { error } = await supabase.rpc("appeal_ideahire_dispute", {
          p_dispute_id: id,
          p_reason: reason,
        });
        if (error) throw error;
      },
      "Odwołanie zostało przekazane do ponownej analizy."
    );

    if (completed) setAppealBody("");
  }

  async function handleTakeDispute() {
    await runAction(
      "take",
      async () => {
        const { error } = await supabase.rpc("admin_take_dispute", {
          p_dispute_id: id,
        });
        if (error) throw error;
      },
      "Sprawa została przypisana do Ciebie."
    );
  }

  async function handleAdminNote(event) {
    event.preventDefault();
    const body = adminNote.trim();

    if (body.length < 3) {
      setPageMessage("Wiadomość administratora musi mieć co najmniej 3 znaki.");
      return;
    }

    const completed = await runAction(
      "admin-note",
      async () => {
        const { error } = await supabase.rpc("admin_add_dispute_note", {
          p_dispute_id: id,
          p_body: body,
          p_visible_to_parties: adminNotePublic,
        });
        if (error) throw error;
      },
      adminNotePublic
        ? "Wiadomość została wysłana obu stronom."
        : "Notatka wewnętrzna została zapisana."
    );

    if (completed) setAdminNote("");
  }

  async function handleDecision(event) {
    event.preventDefault();
    const rationale = decisionForm.rationale.trim();

    if (!decisionForm.outcome) {
      setPageMessage("Wybierz wynik sprawy.");
      return;
    }

    if (rationale.length < 20) {
      setPageMessage("Uzasadnienie decyzji musi mieć co najmniej 20 znaków.");
      return;
    }

    let amount = null;

    if (decisionForm.outcome === "partial_refund") {
      amount = Number(String(decisionForm.amount).replace(",", "."));

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount >= Number(dispute.price_amount_snapshot)
      ) {
        setPageMessage(
          "Częściowy zwrot musi być większy od 0 i mniejszy od ceny zlecenia."
        );
        return;
      }
    }

    const completed = await runAction(
      "decision",
      async () => {
        const { error } = await supabase.rpc("admin_issue_dispute_decision", {
          p_dispute_id: id,
          p_outcome: decisionForm.outcome,
          p_rationale: rationale,
          p_amount: amount,
        });
        if (error) throw error;
      },
      "Decyzja została zapisana i przekazana obu stronom."
    );

    if (completed) {
      setDecisionForm({ outcome: "", amount: "", rationale: "" });
    }
  }

  async function handleCloseDispute() {
    await runAction(
      "close",
      async () => {
        const { error } = await supabase.rpc("admin_close_dispute", {
          p_dispute_id: id,
        });
        if (error) throw error;
      },
      "Sprawa została zamknięta."
    );
  }

  if (staffLoading) {
    return <LoadingScreen />;
  }

  if (loading) {
    return (
      <div className="account-page disputes-page">
        {isStaff ? <AdminNavbar /> : <AccountNavbar />}
        <main className="disputes-shell">
          <div className="dispute-state-card">Ładowanie szczegółów sprawy...</div>
        </main>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="account-page disputes-page">
        {isStaff ? <AdminNavbar /> : <AccountNavbar />}
        <main className="disputes-shell">
          <div className="dispute-state-card is-error">
            <h1>Nie znaleziono sprawy</h1>
            <p>{pageMessage || "Nie masz dostępu do tej sprawy albo nie istnieje."}</p>
            <button
              type="button"
              className="dispute-secondary-button"
              onClick={() => navigate(isStaff ? "/admin" : "/disputes")}
            >
              Wróć do centrum sporów
            </button>
          </div>
        </main>
      </div>
    );
  }

  const clientName = getDisputeProfileName(
    profiles[dispute.client_id],
    "Zleceniodawca"
  );
  const contractorName = getDisputeProfileName(
    profiles[dispute.contractor_id],
    "Wykonawca"
  );
  const currentDecision = decisions.find((item) => item.is_current);
  const alreadyAppealed = appeals.some((item) => item.appealed_by === user.id);
  const appealIsOpen = Boolean(
    !isStaff &&
      isParticipant &&
      dispute.status === "decision_issued" &&
      dispute.appeal_deadline_at &&
      new Date(dispute.appeal_deadline_at).getTime() >= Date.now() &&
      !alreadyAppealed
  );
  const canCancel = Boolean(
    !isStaff &&
      isParticipant &&
      dispute.opened_by === user.id &&
      dispute.status === "awaiting_response" &&
      !statements.some(
        (item) =>
          item.author_user_id &&
          item.author_user_id !== dispute.opened_by &&
          ["response", "comment"].includes(item.statement_type)
      )
  );
  const attachedMessageIds = new Set(
    messageEvidence.map((item) => item.message_id)
  );

  return (
    <div className="account-page disputes-page">
      {isStaff ? <AdminNavbar /> : <AccountNavbar />}

      <main className="disputes-shell dispute-details-shell">
        <div className="dispute-back-row">
          <Link to={isStaff ? "/admin" : "/disputes"}>
            ← {isStaff ? "Panel administratora" : "Centrum sporów"}
          </Link>
        </div>

        <header className="dispute-detail-header">
          <div>
            <span className="dispute-case-number">
              {formatDisputeNumber(dispute.case_number)}
            </span>
            <h1>{dispute.job_title_snapshot}</h1>
            <p>Sprawa otwarta {formatDisputeDate(dispute.opened_at)}</p>
          </div>
          <DisputeStatusPill status={dispute.status} />
        </header>

        {pageMessage && (
          <p className="dispute-page-message" role="status">{pageMessage}</p>
        )}

        <section
          className="dispute-transparency-banner"
          aria-labelledby="dispute-transparency-title"
        >
          <span className="dispute-transparency-icon" aria-hidden="true">i</span>
          <div>
            <strong id="dispute-transparency-title">
              Kontrolowany dostęp do kontekstu sprawy
            </strong>
            <p>
              Pełną rozmowę, formularz współpracy i dowody może wyświetlić
              wyłącznie administrator przypisany do tego sporu. Dostęp jest
              tylko do odczytu, a każde otwarcie zostaje zapisane.
            </p>
            {dispute.context_access_acknowledged_at && (
              <small>
                Informację potwierdzono przy otwarciu sporu: {" "}
                {formatDisputeDate(
                  dispute.context_access_acknowledged_at
                )}
              </small>
            )}
          </div>
        </section>

        <div className="dispute-detail-grid">
          <div className="dispute-detail-main">
            {currentDecision && (
              <section className="dispute-panel dispute-decision-panel">
                <span className="dispute-eyebrow">Aktualna decyzja</span>
                <h2>{getOptionLabel(ADMIN_DECISION_OPTIONS, currentDecision.outcome)}</h2>
                {currentDecision.amount != null && (
                  <strong className="dispute-decision-amount">
                    {formatDisputeMoney(
                      currentDecision.amount,
                      dispute.price_currency_snapshot
                    )}
                  </strong>
                )}
                <p>{currentDecision.rationale}</p>
                <div className="dispute-decision-meta">
                  <span>Wersja {currentDecision.version}</span>
                  <span>Wydano: {formatDisputeDate(currentDecision.issued_at)}</span>
                  <span>
                    Operacja płatnicza: {currentDecision.payment_action_status === "not_connected"
                      ? "operator płatności nie jest jeszcze podłączony"
                      : "nie jest wymagana"}
                  </span>
                </div>
                {dispute.appeal_deadline_at && dispute.status === "decision_issued" && (
                  <p className="dispute-deadline-note">
                    Termin odwołania: {formatDisputeDate(dispute.appeal_deadline_at)}
                  </p>
                )}
              </section>
            )}

            <section className="dispute-panel">
              <div className="dispute-panel-heading">
                <div>
                  <span className="dispute-eyebrow">Historia sprawy</span>
                  <h2>Wyjaśnienia i komunikaty</h2>
                </div>
                <span className="dispute-count-badge">{statements.length}</span>
              </div>

              <div className="dispute-timeline">
                {statements.map((item) => {
                  const authorName = item.author_role === "system"
                    ? "System IdeaHire"
                    : ["admin", "owner"].includes(item.author_role)
                    ? item.visibility === "staff"
                      ? "Notatka administracyjna"
                      : "Administrator IdeaHire"
                    : getDisputeProfileName(
                        profiles[item.author_user_id],
                        item.author_role === "client" ? "Zleceniodawca" : "Wykonawca"
                      );

                  return (
                    <article
                      className={`dispute-timeline-item is-${item.author_role} ${
                        item.visibility === "staff" ? "is-private" : ""
                      }`}
                      key={item.id}
                    >
                      <div className="dispute-timeline-dot" aria-hidden="true" />
                      <div className="dispute-timeline-content">
                        <div className="dispute-timeline-meta">
                          <strong>{authorName}</strong>
                          {item.visibility === "staff" && <span>Tylko administracja</span>}
                          <time>{formatDisputeDate(item.created_at)}</time>
                        </div>
                        <p>{item.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {canAddEvidence && (
                <form className="dispute-inline-form" onSubmit={handleAddStatement}>
                  <label htmlFor="dispute-statement">Dodaj wyjaśnienie</label>
                  <textarea
                    id="dispute-statement"
                    value={statementBody}
                    onChange={(event) => setStatementBody(event.target.value)}
                    placeholder="Opisz nowe okoliczności lub odpowiedz drugiej stronie..."
                    maxLength={10000}
                    disabled={Boolean(busy)}
                  />
                  <div className="dispute-form-footer">
                    <small>{statementBody.length}/10 000</small>
                    <button
                      className="dispute-primary-button"
                      type="submit"
                      disabled={Boolean(busy) || statementBody.trim().length < 3}
                    >
                      {busy === "statement" ? "Dodawanie..." : "Dodaj wyjaśnienie"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {isStaff && (
              <section className="dispute-panel admin-case-context-panel">
                <div className="dispute-panel-heading">
                  <div>
                    <span className="dispute-eyebrow">Pełny kontekst sprawy</span>
                    <h2>Rozmowa i ustalenia współpracy</h2>
                    <p>
                      Materiały są dostępne wyłącznie do analizy sporu. Nie możesz edytować formularza ani pisać na czacie użytkowników.
                    </p>
                  </div>
                  <span className="admin-readonly-badge">Tylko odczyt</span>
                </div>

                {dispute.assigned_admin_id !== user.id ? (
                  <div className="admin-context-locked">
                    <span className="admin-context-lock-icon" aria-hidden="true">⌁</span>
                    <div>
                      <strong>Najpierw przejmij sprawę</strong>
                      <p>
                        Pełny czat i formularz zobaczy tylko administrator przypisany do tej sprawy. Otwarcie tych danych zostanie zapisane w rejestrze działań.
                      </p>
                    </div>
                  </div>
                ) : adminContextLoading ? (
                  <div className="admin-context-loading">Ładowanie pełnego kontekstu...</div>
                ) : adminContextError ? (
                  <div className="admin-context-error" role="alert">
                    <strong>Nie udało się otworzyć kontekstu</strong>
                    <p>{adminContextError}</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-context-access-note">
                      <strong>Dostęp kontrolowany</strong>
                      <span>
                        Jesteś administratorem przypisanym do sprawy. To otwarcie zostało odnotowane.
                      </span>
                    </div>

                    <div className="admin-case-context-grid">
                      <details className="admin-context-section" open>
                        <summary>
                          <span>
                            <small>Dokument sprawy</small>
                            <strong>Formularz współpracy</strong>
                          </span>
                          <span className="dispute-count-badge">
                            {adminAgreements.length}
                          </span>
                        </summary>

                        <div className="admin-context-section-body">
                          {adminAgreements.length === 0 ? (
                            <p className="dispute-empty-copy">
                              Dla tej rozmowy nie zapisano formularza współpracy.
                            </p>
                          ) : (
                            <div className="admin-agreement-history">
                              {adminAgreements.map((agreementItem, index) => (
                                <article
                                  className={`admin-agreement-version ${
                                    agreementItem.status === "accepted" ? "is-accepted" : ""
                                  }`}
                                  key={agreementItem.id}
                                >
                                  <div className="admin-agreement-version-heading">
                                    <div>
                                      <span>Wersja {agreementItem.version}</span>
                                      <strong>
                                        {agreementItem.status === "accepted"
                                          ? "Zaakceptowana przez obie strony"
                                          : agreementItem.status === "superseded"
                                          ? "Poprzednia wersja"
                                          : "Oczekuje na akceptację"}
                                      </strong>
                                    </div>
                                    {index === 0 && (
                                      <span className="admin-current-version-badge">Najnowsza</span>
                                    )}
                                  </div>

                                  <AgreementDetails agreement={agreementItem} />

                                  <div className="admin-agreement-acceptance">
                                    <span>
                                      Zleceniodawca: {agreementItem.client_accepted_at
                                        ? formatDisputeDate(agreementItem.client_accepted_at)
                                        : "brak akceptacji"}
                                    </span>
                                    <span>
                                      Wykonawca: {agreementItem.contractor_accepted_at
                                        ? formatDisputeDate(agreementItem.contractor_accepted_at)
                                        : "brak akceptacji"}
                                    </span>
                                  </div>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>

                      <details className="admin-context-section" open>
                        <summary>
                          <span>
                            <small>Pełny zapis rozmowy</small>
                            <strong>Czat użytkowników</strong>
                          </span>
                          <span className="dispute-count-badge">
                            {adminChatMessages.length}
                          </span>
                        </summary>

                        <div className="admin-context-section-body">
                          {adminChatMessages.length === 0 ? (
                            <p className="dispute-empty-copy">
                              W tej rozmowie nie ma jeszcze wiadomości.
                            </p>
                          ) : (
                            <div className="admin-full-chat" aria-label="Pełna rozmowa użytkowników">
                              {adminChatMessages.map((message) => {
                                const isClientMessage = message.sender_id === dispute.client_id;
                                const authorName = isClientMessage ? clientName : contractorName;

                                return (
                                  <article
                                    className={`admin-chat-message ${
                                      isClientMessage ? "is-client" : "is-contractor"
                                    }`}
                                    key={message.id}
                                  >
                                    <div className="admin-chat-message-meta">
                                      <strong>{authorName}</strong>
                                      <span>{isClientMessage ? "Zleceniodawca" : "Wykonawca"}</span>
                                      <time>{formatDisputeDate(message.created_at)}</time>
                                    </div>
                                    <p>{message.content}</p>
                                  </article>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </section>
            )}

            <section className="dispute-panel">
              <div className="dispute-panel-heading">
                <div>
                  <span className="dispute-eyebrow">Materiały</span>
                  <h2>Dowody w sprawie</h2>
                </div>
                <span className="dispute-count-badge">
                  {evidence.length + messageEvidence.length}
                </span>
              </div>

              {evidence.length === 0 && messageEvidence.length === 0 ? (
                <p className="dispute-empty-copy">Nie dodano jeszcze żadnych dowodów.</p>
              ) : (
                <div className="dispute-evidence-list">
                  {evidence.map((item) => (
                    <article className="dispute-evidence-item" key={item.id}>
                      <span className="dispute-evidence-icon" aria-hidden="true">↗</span>
                      <div>
                        <strong>{item.original_file_name}</strong>
                        <small>
                          Plik · {item.size_bytes
                            ? `${(Number(item.size_bytes) / 1024 / 1024).toFixed(2)} MB`
                            : "rozmiar nieznany"} · {formatDisputeDate(item.created_at)}
                        </small>
                        {item.caption && <p>{item.caption}</p>}
                      </div>
                      <button
                        type="button"
                        className="dispute-text-button"
                        onClick={() => handleOpenEvidence(item)}
                        disabled={busy === `open-${item.id}`}
                      >
                        Otwórz
                      </button>
                    </article>
                  ))}

                  {messageEvidence.map((item) => (
                    <article className="dispute-evidence-item is-message" key={item.id}>
                      <span className="dispute-evidence-icon" aria-hidden="true">“</span>
                      <div>
                        <strong>Wiadomość z rozmowy</strong>
                        <small>{formatDisputeDate(item.message_created_at_snapshot)}</small>
                        <p>{item.message_content_snapshot}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {canAddEvidence && (
                <div className="dispute-evidence-actions">
                  <label htmlFor="dispute-caption">Opis pliku (opcjonalnie)</label>
                  <input
                    id="dispute-caption"
                    type="text"
                    value={fileCaption}
                    onChange={(event) => setFileCaption(event.target.value)}
                    placeholder="Krótko wyjaśnij, co potwierdza plik"
                    maxLength={1000}
                    disabled={Boolean(busy)}
                  />
                  <input
                    ref={fileInputRef}
                    className="dispute-hidden-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
                    onChange={handleEvidenceUpload}
                  />
                  <div className="dispute-action-row">
                    <button
                      type="button"
                      className="dispute-secondary-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={Boolean(busy)}
                    >
                      {busy === "evidence" ? "Przesyłanie..." : "Dodaj plik"}
                    </button>
                    <button
                      type="button"
                      className="dispute-secondary-button"
                      onClick={() => setShowMessagePicker((current) => !current)}
                      disabled={Boolean(busy)}
                    >
                      Dołącz wiadomość z czatu
                    </button>
                  </div>
                  <small>JPG, PNG, WEBP, PDF lub TXT · maksymalnie 20 MB</small>
                </div>
              )}

              {canAddEvidence && showMessagePicker && (
                <div className="dispute-message-picker">
                  <div className="dispute-panel-heading">
                    <div>
                      <h3>Wybierz wiadomość</h3>
                      <p>Administrator zobaczy tylko dołączoną wiadomość, nie cały czat.</p>
                    </div>
                    <button
                      type="button"
                      className="dispute-text-button"
                      onClick={() => setShowMessagePicker(false)}
                    >
                      Zamknij
                    </button>
                  </div>
                  <div className="dispute-message-list">
                    {chatMessages.length === 0 ? (
                      <p>W tej rozmowie nie ma jeszcze wiadomości.</p>
                    ) : (
                      chatMessages.map((message) => {
                        const alreadyAttached = attachedMessageIds.has(message.id);
                        return (
                          <article key={message.id}>
                            <div>
                              <strong>
                                {message.sender_id === user.id ? "Ty" : "Druga strona"}
                              </strong>
                              <time>{formatDisputeDate(message.created_at)}</time>
                              <p>{message.content}</p>
                            </div>
                            <button
                              type="button"
                              className="dispute-text-button"
                              onClick={() => handleAttachMessage(message.id)}
                              disabled={alreadyAttached || Boolean(busy)}
                            >
                              {alreadyAttached ? "Dołączono" : "Dołącz"}
                            </button>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>

            {appealIsOpen && (
              <section className="dispute-panel">
                <span className="dispute-eyebrow">Jedno odwołanie na osobę</span>
                <h2>Odwołaj się od decyzji</h2>
                <p>
                  Wskaż konkretny błąd w ocenie lub nowy istotny dowód. Termin upływa {formatDisputeDate(dispute.appeal_deadline_at)}.
                </p>
                <form className="dispute-inline-form" onSubmit={handleAppeal}>
                  <textarea
                    value={appealBody}
                    onChange={(event) => setAppealBody(event.target.value)}
                    placeholder="Uzasadnij odwołanie..."
                    maxLength={10000}
                    disabled={Boolean(busy)}
                  />
                  <div className="dispute-form-footer">
                    <small>{appealBody.length}/10 000</small>
                    <button
                      className="dispute-danger-button"
                      type="submit"
                      disabled={Boolean(busy) || appealBody.trim().length < 20}
                    >
                      {busy === "appeal" ? "Wysyłanie..." : "Złóż odwołanie"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {isStaff && !["closed", "cancelled"].includes(dispute.status) && (
              <section className="dispute-panel admin-workbench">
                <div className="dispute-panel-heading">
                  <div>
                    <span className="dispute-eyebrow">Tryb administracyjny</span>
                    <h2>Obsługa sprawy</h2>
                  </div>
                  <span className="admin-role-badge">
                    {staffRole === "owner" ? "Właściciel" : "Administrator"}
                  </span>
                </div>

                {dispute.assigned_admin_id !== user.id && (
                  <button
                    type="button"
                    className="dispute-primary-button"
                    onClick={handleTakeDispute}
                    disabled={Boolean(busy)}
                  >
                    {busy === "take" ? "Przypisywanie..." : "Przejmij sprawę do analizy"}
                  </button>
                )}

                <form className="admin-dispute-form" onSubmit={handleAdminNote}>
                  <h3>Wiadomość lub notatka</h3>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Napisz prośbę o informacje albo notatkę dla administracji..."
                    maxLength={10000}
                    disabled={Boolean(busy)}
                  />
                  <label className="dispute-check-row">
                    <input
                      type="checkbox"
                      checked={adminNotePublic}
                      onChange={(event) => setAdminNotePublic(event.target.checked)}
                    />
                    <span>Wiadomość widoczna dla obu stron</span>
                  </label>
                  <button
                    type="submit"
                    className="dispute-secondary-button"
                    disabled={Boolean(busy) || adminNote.trim().length < 3}
                  >
                    {busy === "admin-note" ? "Zapisywanie..." : "Zapisz wiadomość"}
                  </button>
                </form>

                <form className="admin-dispute-form is-decision" onSubmit={handleDecision}>
                  <h3>Wydaj decyzję</h3>
                  <label>
                    Wynik sprawy
                    <select
                      value={decisionForm.outcome}
                      onChange={(event) =>
                        setDecisionForm((current) => ({
                          ...current,
                          outcome: event.target.value,
                          amount: event.target.value === "partial_refund" ? current.amount : "",
                        }))
                      }
                    >
                      <option value="">Wybierz wynik</option>
                      {ADMIN_DECISION_OPTIONS.map(([value, label]) => (
                        <option value={value} key={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  {decisionForm.outcome === "partial_refund" && (
                    <label>
                      Kwota częściowego zwrotu (PLN)
                      <input
                        type="text"
                        inputMode="decimal"
                        value={decisionForm.amount}
                        onChange={(event) =>
                          setDecisionForm((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        placeholder="Np. 500"
                      />
                    </label>
                  )}
                  <label>
                    Pełne uzasadnienie
                    <textarea
                      value={decisionForm.rationale}
                      onChange={(event) =>
                        setDecisionForm((current) => ({
                          ...current,
                          rationale: event.target.value,
                        }))
                      }
                      placeholder="Opisz ustalenia, ocenione dowody i podstawę decyzji..."
                      maxLength={10000}
                    />
                  </label>
                  <p className="dispute-admin-warning">
                    Decyzja zostanie zapisana w historii i przekazana obu stronom. Operacje finansowe pozostają wyłączone do czasu podłączenia operatora płatności.
                  </p>
                  <button
                    type="submit"
                    className="dispute-danger-button"
                    disabled={Boolean(busy)}
                  >
                    {busy === "decision" ? "Zapisywanie decyzji..." : "Wydaj decyzję"}
                  </button>
                </form>

                {dispute.status === "decision_issued" &&
                  dispute.appeal_deadline_at &&
                  new Date(dispute.appeal_deadline_at).getTime() < Date.now() && (
                    <button
                      type="button"
                      className="dispute-secondary-button"
                      onClick={handleCloseDispute}
                      disabled={Boolean(busy)}
                    >
                      {busy === "close" ? "Zamykanie..." : "Zamknij sprawę po terminie odwołania"}
                    </button>
                  )}
              </section>
            )}
          </div>

          <aside className="dispute-detail-sidebar">
            <section className="dispute-panel dispute-summary-card">
              <span className="dispute-eyebrow">Podsumowanie</span>
              <dl>
                <div>
                  <dt>Cena zlecenia</dt>
                  <dd>{formatDisputeMoney(
                    dispute.price_amount_snapshot,
                    dispute.price_currency_snapshot
                  )}</dd>
                </div>
                <div>
                  <dt>Termin wykonania</dt>
                  <dd>{formatDisputeDate(dispute.deadline_snapshot, false)}</dd>
                </div>
                <div>
                  <dt>Powód</dt>
                  <dd>{getOptionLabel(DISPUTE_REASON_OPTIONS, dispute.reason)}</dd>
                </div>
                <div>
                  <dt>Oczekiwane rozwiązanie</dt>
                  <dd>{getOptionLabel(DISPUTE_OUTCOME_OPTIONS, dispute.requested_outcome)}</dd>
                </div>
                {dispute.requested_amount != null && (
                  <div>
                    <dt>Oczekiwana kwota</dt>
                    <dd>{formatDisputeMoney(
                      dispute.requested_amount,
                      dispute.price_currency_snapshot
                    )}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="dispute-panel dispute-parties-card">
              <span className="dispute-eyebrow">Strony</span>
              {isStaff ? (
                <div className="dispute-party-row">
                  <div className="dispute-party-avatar">
                    {profiles[dispute.client_id]?.avatar_url ? (
                      <img src={profiles[dispute.client_id].avatar_url} alt="" />
                    ) : clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Zleceniodawca</small>
                    <strong>{clientName}</strong>
                  </div>
                </div>
              ) : (
                <Link to={`/profile/${dispute.client_id}`}>
                  <div className="dispute-party-avatar">
                    {profiles[dispute.client_id]?.avatar_url ? (
                      <img src={profiles[dispute.client_id].avatar_url} alt="" />
                    ) : clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Zleceniodawca</small>
                    <strong>{clientName}</strong>
                  </div>
                </Link>
              )}

              {isStaff ? (
                <div className="dispute-party-row">
                  <div className="dispute-party-avatar">
                    {profiles[dispute.contractor_id]?.avatar_url ? (
                      <img src={profiles[dispute.contractor_id].avatar_url} alt="" />
                    ) : contractorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Wykonawca</small>
                    <strong>{contractorName}</strong>
                  </div>
                </div>
              ) : (
                <Link to={`/profile/${dispute.contractor_id}`}>
                  <div className="dispute-party-avatar">
                    {profiles[dispute.contractor_id]?.avatar_url ? (
                      <img src={profiles[dispute.contractor_id].avatar_url} alt="" />
                    ) : contractorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Wykonawca</small>
                    <strong>{contractorName}</strong>
                  </div>
                </Link>
              )}
            </section>

            {isParticipant && !isStaff && (
              <Link
                className="dispute-secondary-button is-full"
                to={`/chat/${dispute.conversation_id}`}
              >
                Otwórz rozmowę
              </Link>
            )}

            {canCancel && (
              <button
                type="button"
                className="dispute-text-button is-danger"
                onClick={handleCancelDispute}
                disabled={Boolean(busy)}
              >
                {busy === "cancel" ? "Wycofywanie..." : "Wycofaj spór"}
              </button>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function AdminJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Wszystkie");

  async function loadAdminJobs() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("id, user_id, title, description, category, budget, created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = data || [];
    const ownerIds = [...new Set(rows.map((job) => job.user_id).filter(Boolean))];
    let profileMap = {};

    if (ownerIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", ownerIds);

      if (profileError) {
        console.error("ADMIN JOB PROFILES ERROR:", profileError);
      } else {
        profileMap = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }
    }

    setJobs(rows);
    setProfiles(profileMap);
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadAdminJobs();
      } catch (error) {
        if (mounted) {
          setMessage(
            cleanSupabaseError(error, "Nie udało się pobrać zleceń do podglądu.")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    const channel = supabase
      .channel(`admin-jobs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => loadAdminJobs().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    if (category !== "Wszystkie" && job.category !== category) return false;
    if (!normalizedSearch) return true;

    const ownerName = getDisputeProfileName(
      profiles[job.user_id],
      "Użytkownik"
    );

    return [job.title, job.description, job.category, ownerName]
      .some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch)
      );
  });

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell admin-readonly-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">Tryb tylko do odczytu</span>
            <h1>Zlecenia użytkowników</h1>
            <p>
              Administracja może sprawdzać treść i cenę zleceń, ale nie może ich tworzyć, edytować ani usuwać.
            </p>
          </div>
          <span className="admin-readonly-badge">Tylko podgląd</span>
        </header>

        <section className="admin-catalog-toolbar" aria-label="Wyszukiwanie zleceń">
          <label className="admin-search-field">
            <span>Szukaj</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nazwa, opis, kategoria lub użytkownik..."
            />
          </label>

          <label className="admin-filter-field">
            <span>Kategoria</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Wszystkie">Wszystkie</option>
              {JOB_CATEGORIES.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
        </section>

        {loading ? (
          <div className="dispute-state-card">Ładowanie zleceń...</div>
        ) : message ? (
          <div className="dispute-state-card is-error">{message}</div>
        ) : visibleJobs.length === 0 ? (
          <div className="dispute-state-card">
            <h2>Brak pasujących zleceń</h2>
            <p>Zmień wyszukiwanie albo wybierz inną kategorię.</p>
          </div>
        ) : (
          <div className="admin-jobs-grid">
            {visibleJobs.map((job) => {
              const owner = profiles[job.user_id];
              const ownerName = getDisputeProfileName(owner, "Użytkownik");

              return (
                <article className="admin-job-card" key={job.id}>
                  <div className="admin-job-card-topline">
                    <span className="section-label">{job.category || "Bez kategorii"}</span>
                    <span className="admin-readonly-badge is-small">Podgląd</span>
                  </div>

                  <h2>{job.title}</h2>
                  <p>{job.description}</p>

                  <div className="admin-job-details">
                    <div>
                      <span>Budżet</span>
                      <strong>{formatDisputeMoney(job.budget, "PLN")}</strong>
                    </div>
                    <div>
                      <span>Opublikowano</span>
                      <strong>{formatDisputeDate(job.created_at, false)}</strong>
                    </div>
                  </div>

                  <div className="admin-job-owner">
                    <div className="admin-staff-avatar">
                      {owner?.avatar_url ? (
                        <img src={owner.avatar_url} alt="" />
                      ) : ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <small>Zleceniodawca</small>
                      <strong>{ownerName}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminEvidenceMessages() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [disputesById, setDisputesById] = useState({});
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadEvidenceMessages() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("dispute_message_evidence")
      .select(
        "id, dispute_id, message_id, message_sender_id, message_content_snapshot, message_created_at_snapshot, submitted_by, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = data || [];
    const disputeIds = [...new Set(rows.map((item) => item.dispute_id).filter(Boolean))];
    let disputeMap = {};

    if (disputeIds.length > 0) {
      const { data: disputeRows, error: disputeError } = await supabase
        .from("disputes")
        .select("id, case_number, job_title_snapshot, status, client_id, contractor_id")
        .in("id", disputeIds);

      if (disputeError) throw disputeError;

      disputeMap = Object.fromEntries(
        (disputeRows || []).map((dispute) => [dispute.id, dispute])
      );
    }

    const profileIds = [
      ...rows.flatMap((item) => [item.message_sender_id, item.submitted_by]),
      ...Object.values(disputeMap).flatMap((dispute) => [
        dispute.client_id,
        dispute.contractor_id,
      ]),
    ].filter(Boolean);
    const uniqueProfileIds = [...new Set(profileIds)];
    let profileMap = {};

    if (uniqueProfileIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uniqueProfileIds);

      if (profileError) {
        console.error("ADMIN EVIDENCE PROFILES ERROR:", profileError);
      } else {
        profileMap = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }
    }

    setItems(rows);
    setDisputesById(disputeMap);
    setProfiles(profileMap);
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadEvidenceMessages();
      } catch (error) {
        if (mounted) {
          setMessage(
            cleanSupabaseError(
              error,
              "Nie udało się pobrać wiadomości dołączonych do sporów."
            )
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    const channel = supabase
      .channel(`admin-evidence-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispute_message_evidence",
        },
        () => loadEvidenceMessages().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    if (!normalizedSearch) return true;

    const dispute = disputesById[item.dispute_id];
    const senderName = getDisputeProfileName(
      profiles[item.message_sender_id],
      "Użytkownik"
    );
    const caseNumber = dispute
      ? formatDisputeNumber(dispute.case_number)
      : "";

    return [
      item.message_content_snapshot,
      dispute?.job_title_snapshot,
      senderName,
      caseNumber,
    ].some((value) =>
      String(value || "").toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell admin-readonly-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">Prywatność i dowody</span>
            <h1>Wiadomości w sporach</h1>
            <p>
              Widoczne są wyłącznie wiadomości, które uczestnik świadomie dołączył jako dowód. Administracja nie otrzymuje dostępu do całych rozmów.
            </p>
          </div>
          <span className="admin-readonly-badge">Tylko podgląd</span>
        </header>

        <section className="admin-catalog-toolbar is-single" aria-label="Wyszukiwanie wiadomości">
          <label className="admin-search-field">
            <span>Szukaj wiadomości</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Treść, użytkownik, zlecenie lub numer sprawy..."
            />
          </label>
        </section>

        <div className="admin-privacy-note">
          <strong>Kontrolowany dostęp</strong>
          <p>
            Każda wiadomość poniżej jest niezmienną kopią dołączoną do konkretnej sprawy. Wejście administratora w szczegóły sprawy zapisuje się w rejestrze działań.
          </p>
        </div>

        {loading ? (
          <div className="dispute-state-card">Ładowanie wiadomości dowodowych...</div>
        ) : message ? (
          <div className="dispute-state-card is-error">{message}</div>
        ) : visibleItems.length === 0 ? (
          <div className="dispute-state-card">
            <h2>Brak wiadomości dowodowych</h2>
            <p>Użytkownicy nie dołączyli jeszcze wiadomości do spraw albo nic nie pasuje do wyszukiwania.</p>
          </div>
        ) : (
          <div className="admin-evidence-message-list">
            {visibleItems.map((item) => {
              const dispute = disputesById[item.dispute_id];
              const senderName = getDisputeProfileName(
                profiles[item.message_sender_id],
                "Użytkownik"
              );
              const submitterName = getDisputeProfileName(
                profiles[item.submitted_by],
                "Użytkownik"
              );

              return (
                <article className="admin-evidence-message-card" key={item.id}>
                  <div className="admin-evidence-message-heading">
                    <div>
                      <span className="dispute-case-number">
                        {dispute
                          ? formatDisputeNumber(dispute.case_number)
                          : "Sprawa"}
                      </span>
                      <h2>{dispute?.job_title_snapshot || "Zlecenie"}</h2>
                    </div>
                    {dispute && <DisputeStatusPill status={dispute.status} />}
                  </div>

                  <blockquote>{item.message_content_snapshot}</blockquote>

                  <div className="admin-evidence-message-meta">
                    <span>Autor wiadomości: <strong>{senderName}</strong></span>
                    <span>Dołączył: <strong>{submitterName}</strong></span>
                    <span>Wysłano: {formatDisputeDate(item.message_created_at_snapshot)}</span>
                  </div>

                  <Link
                    className="dispute-secondary-button"
                    to={`/disputes/${item.dispute_id}`}
                  >
                    Otwórz powiązaną sprawę
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminPanel() {
  const { user } = useAuth();
  const { staffRole, staffLoading, isStaff, isOwner } = useStaffRole(user?.id);
  const [disputes, setDisputes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function loadAdminData() {
    if (!user?.id || !isStaff) return;

    const [disputeResult, staffResult, auditResult] = await Promise.all([
      supabase
        .from("disputes")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(300),
      supabase
        .from("ideahire_staff")
        .select("user_id, role, is_active, granted_at, revoked_at")
        .order("granted_at", { ascending: true }),
      supabase
        .from("ideahire_admin_audit_log")
        .select("id, actor_user_id, actor_role, action, dispute_id, target_user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (disputeResult.error) throw disputeResult.error;
    if (staffResult.error) throw staffResult.error;
    if (auditResult.error) throw auditResult.error;

    const profileIds = [
      ...(staffResult.data || []).map((item) => item.user_id),
      ...(auditResult.data || []).flatMap((item) => [
        item.actor_user_id,
        item.target_user_id,
      ]),
    ].filter(Boolean);
    const uniqueIds = [...new Set(profileIds)];
    let profileMap = {};

    if (uniqueIds.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uniqueIds);

      if (!error) {
        profileMap = Object.fromEntries(
          (data || []).map((profile) => [profile.id, profile])
        );
      }
    }

    setDisputes(disputeResult.data || []);
    setStaff(staffResult.data || []);
    setAuditLog(auditResult.data || []);
    setProfiles(profileMap);
  }

  useEffect(() => {
    if (staffLoading) return;

    if (!isStaff) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadAdminData();
      } catch (error) {
        if (mounted) {
          setMessage(cleanSupabaseError(error, "Nie udało się pobrać panelu administratora."));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    const channel = supabase
      .channel(`admin-panel-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes" },
        () => loadAdminData().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, isStaff, staffLoading]);

  async function handleStaffChange(enabled) {
    const email = adminEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setMessage("Wpisz prawidłowy adres e-mail konta IdeaHire.");
      return;
    }

    setBusy(enabled ? "grant" : "revoke");
    setMessage("");

    try {
      const { error } = await supabase.rpc("owner_set_admin_by_email", {
        p_email: email,
        p_enabled: enabled,
      });

      if (error) throw error;

      setMessage(
        enabled
          ? "Rola administratora została nadana."
          : "Rola administratora została odebrana."
      );
      setAdminEmail("");
      await loadAdminData();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zmienić roli administratora."));
    } finally {
      setBusy("");
    }
  }

  if (staffLoading || loading) {
    return (
      <div className="account-page admin-page">
        <AdminNavbar />
        <main className="admin-shell">
          <div className="dispute-state-card">Ładowanie panelu administratora...</div>
        </main>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="account-page admin-page">
        <AccountNavbar />
        <main className="admin-shell">
          <div className="dispute-state-card is-error">
            <h1>Brak uprawnień</h1>
            <p>Ten panel jest dostępny wyłącznie dla aktywnego właściciela i administratorów IdeaHire.</p>
            <Link className="dispute-secondary-button" to="/account">
              Wróć do konta
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const activeDisputes = disputes.filter(
    (item) => !["closed", "cancelled"].includes(item.status)
  );
  const unassignedCount = activeDisputes.filter(
    (item) => !item.assigned_admin_id
  ).length;
  const awaitingCount = activeDisputes.filter(
    (item) => item.status === "awaiting_response"
  ).length;
  const appealedCount = activeDisputes.filter(
    (item) => item.status === "appealed"
  ).length;
  const visibleDisputes = disputes.filter((item) => {
    if (filter === "all") return true;
    if (filter === "mine") return item.assigned_admin_id === user.id;
    if (filter === "unassigned") {
      return !item.assigned_admin_id && !["closed", "cancelled"].includes(item.status);
    }
    if (filter === "closed") return ["closed", "cancelled"].includes(item.status);
    return !["closed", "cancelled"].includes(item.status);
  });

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">IdeaHire · administracja</span>
            <h1>Panel administratora</h1>
            <p>
              Kolejka sporów, udokumentowane decyzje i kontrola dostępu administratorów.
            </p>
          </div>
          <span className="admin-role-badge">
            {staffRole === "owner" ? "Właściciel" : "Administrator"}
          </span>
        </header>

        {message && <p className="dispute-page-message" role="status">{message}</p>}

        <section className="admin-stats-grid" aria-label="Statystyki spraw">
          <article><strong>{activeDisputes.length}</strong><span>Aktywne sprawy</span></article>
          <article><strong>{unassignedCount}</strong><span>Nieprzypisane</span></article>
          <article><strong>{awaitingCount}</strong><span>Czekają na odpowiedź</span></article>
          <article><strong>{appealedCount}</strong><span>Odwołania</span></article>
        </section>

        <div className="admin-content-grid">
          <section className="dispute-panel admin-queue-panel">
            <div className="dispute-panel-heading">
              <div>
                <span className="dispute-eyebrow">Kolejka</span>
                <h2>Sprawy użytkowników</h2>
              </div>
              <span className="dispute-count-badge">{visibleDisputes.length}</span>
            </div>

            <div className="disputes-filter-bar is-compact" role="group" aria-label="Filtr kolejki">
              {[
                ["active", "Aktywne"],
                ["unassigned", "Nieprzypisane"],
                ["mine", "Moje"],
                ["closed", "Zakończone"],
                ["all", "Wszystkie"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "is-active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {visibleDisputes.length === 0 ? (
              <p className="dispute-empty-copy">Brak spraw spełniających wybrany filtr.</p>
            ) : (
              <div className="dispute-list is-admin">
                {visibleDisputes.map((item) => (
                  <DisputeListCard
                    key={item.id}
                    dispute={item}
                    userId={user.id}
                    adminView
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="admin-side-column">
            {isOwner && (
              <section className="dispute-panel owner-access-panel">
                <span className="dispute-eyebrow">Tylko właściciel</span>
                <h2>Dostęp administratorów</h2>
                <p>
                  Użytkownik musi wcześniej utworzyć i potwierdzić zwykłe konto IdeaHire.
                </p>
                <label>
                  Adres e-mail konta
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="admin@firma.pl"
                    disabled={Boolean(busy)}
                  />
                </label>
                <div className="dispute-action-row">
                  <button
                    type="button"
                    className="dispute-primary-button"
                    onClick={() => handleStaffChange(true)}
                    disabled={Boolean(busy)}
                  >
                    {busy === "grant" ? "Nadawanie..." : "Nadaj rolę"}
                  </button>
                  <button
                    type="button"
                    className="dispute-danger-button is-outline"
                    onClick={() => handleStaffChange(false)}
                    disabled={Boolean(busy)}
                  >
                    {busy === "revoke" ? "Odbieranie..." : "Odbierz rolę"}
                  </button>
                </div>

                <div className="admin-staff-list">
                  {staff.map((item) => (
                    <article key={item.user_id} className={!item.is_active ? "is-inactive" : ""}>
                      <div className="admin-staff-avatar">
                        {profiles[item.user_id]?.avatar_url ? (
                          <img src={profiles[item.user_id].avatar_url} alt="" />
                        ) : getDisputeProfileName(
                            profiles[item.user_id],
                            item.role === "owner" ? "W" : "A"
                          ).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{getDisputeProfileName(
                          profiles[item.user_id],
                          item.role === "owner" ? "Właściciel" : "Administrator"
                        )}</strong>
                        <small>
                          {item.role === "owner" ? "Właściciel" : "Administrator"} · {item.is_active ? "aktywny" : "nieaktywny"}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="dispute-panel admin-audit-panel">
              <span className="dispute-eyebrow">Rejestr działań</span>
              <h2>Ostatnia aktywność</h2>
              <div className="admin-audit-list">
                {auditLog.length === 0 ? (
                  <p>Brak zapisanych działań.</p>
                ) : (
                  auditLog.map((item) => (
                    <article key={item.id}>
                      <strong>{ADMIN_AUDIT_LABELS[item.action] || item.action}</strong>
                      <span>
                        {getDisputeProfileName(
                          profiles[item.actor_user_id],
                          item.actor_role === "owner" ? "Właściciel" : "Administrator"
                        )}
                      </span>
                      <time>{formatDisputeDate(item.created_at)}</time>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
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
    user,
  } =
    useAuth();

  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);

  const {
    isLimited,
    ageRequired,
    loading: ageLoading,
  } = useAgeAccess();

  if (
    loading ||
    (user?.id && (staffLoading || ageLoading))
  ) {
    return <LoadingScreen />;
  }

  if (isStaff) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (user?.id && (isLimited || ageRequired)) {
    return <Navigate to="/account" replace />;
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
        <AgeAccessProvider>
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
                <UserOnlyRoute allowLimited>
                  <AccountEntry />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/find-talent"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <FindTalent />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-job/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <EditJob />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <Jobs />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <Profile />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Notifications />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Messages />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Chat />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/disputes"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Disputes />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/disputes/:id"
            element={
              <ProtectedRoute>
                <DisputeDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminPanel />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/jobs"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminJobs />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminEvidenceMessages />
                </StaffOnlyRoute>
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
        </AgeAccessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;
