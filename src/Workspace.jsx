/* P67 — account, work and conversations. Presentation uses existing account data. */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, FileText, FolderOpen, Wallet, Home, Image, LayoutGrid, LogOut, Menu, MessageSquare, Palette, Play, Plus, Search, Settings, ShieldCheck, UserRound, X } from "lucide-react";
import { BrandSignature } from "./Brand";
import LucynaSymbol from "./LucynaSymbol";
import { useSitePreferences } from "./Preferences";
import { IdeaHirePromoFilm } from "./App";
import "./Workspace.css";
import "./WorkspaceAccount.css";
import "./WorkspaceMessages.css";
import "./WorkspaceCatalog.css";
export function WorkspaceIcon({
  kind = "arrow",
  ...props
}) {
  const Icon = {
    home: Home,
    work: BriefcaseBusiness,
    message: MessageSquare,
    calendar: CalendarDays,
    jobs: FileText,
    services: LayoutGrid,
    people: UserRound,
    profile: UserRound,
    portfolio: Image,
    settings: Settings,
    palette: Palette,
    payouts: Wallet,
    arrow: ArrowRight,
    diagonal: ArrowUpRight,
    plus: Plus,
    close: X,
    search: Search,
    down: ChevronDown,
    next: ChevronRight,
    files: FolderOpen,
    bell: Bell,
    lock: ShieldCheck,
    play: Play,
    check: Check
  }[kind] || ArrowRight;
  return <Icon size={20} strokeWidth={1.7} aria-hidden="true" focusable="false" {...props} />;
}
function useCopy() {
  const en = useSitePreferences().language === "en";
  return (pl, english) => en ? english : pl;
}
export function workspaceDate(value, en = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(en ? "en-GB" : "pl-PL", {
    day: "numeric",
    month: "short"
  });
}
function Avatar({
  name = "",
  url,
  className = ""
}) {
  return <span className={`ih67-avatar ${className}`} aria-hidden="true">{url ? <img src={url} alt="" loading="lazy" /> : Array.from(name.trim() || "I")[0].toLocaleUpperCase()}</span>;
}

/* An editorial drawing of a brief, a conversation and a delivered file. */
export function WorkspaceDrawing({
  variant = "work"
}) {
  const t = useCopy();
  return <svg className={`ih67-drawing is-${variant}`} viewBox="0 0 360 214" fill="none" role="img" aria-label={variant === "messages" ? t("Rozmowa i pliki projektu", "Project conversation and files") : t("Opis, rozmowa i gotowy projekt", "Brief, conversation and delivered project")}>
    <path d="M29 182H331" className="ih67-drawing-line" />
    <rect x="40" y="24" width="158" height="154" rx="8" className="ih67-drawing-paper" />
    <path d="M60 49H107M60 65H173M60 78H155M60 104H173M60 117H141" className="ih67-drawing-line" />
    <rect x="59" y="138" width="50" height="20" rx="3" className="ih67-drawing-fill" />
    <path d="M70 148H97" className="ih67-drawing-on" />
    <path d="M169 85H304C308 85 312 89 312 93V140C312 144 308 148 304 148H210L190 165V148H169C165 148 161 144 161 140V93C161 89 165 85 169 85Z" className="ih67-drawing-message" />
    <path d="M181 108H290M181 121H257" className="ih67-drawing-line" />
    <rect x="255" y="139" width="68" height="60" rx="7" className="ih67-drawing-paper" />
    <path d="M277 167L286 176L303 158" className="ih67-drawing-check" />
    <path d="M221 40H250M242 32L250 40L242 48" className="ih67-drawing-line" />
  </svg>;
}
export function WorkspaceNavigation({
  name,
  avatarUrl,
  onLogout,
  limited,
  hasMessages,
  hasNotifications,
  hasDisputes,
  moderationNotice,
  helpUrl,
  assistantEnabled,
  onAssistantOpen
}) {
  const location = useLocation();
  const t = useCopy();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const chat = location.pathname.startsWith("/chat/");
  const view = chat ? "chat" : location.pathname === "/messages" ? "messages" : location.pathname === "/account" ? "account" : location.pathname === "/work" ? "work" : location.pathname.startsWith("/profile/") ? "profile" : location.pathname === "/calendar" ? "calendar" : "catalog";
  const labels = {
    "/account": ["Start", "Overview"],
    "/work": ["Moja praca", "My work"],
    "/messages": ["Wiadomości", "Messages"],
    "/calendar": ["Kalendarz", "Calendar"],
    "/jobs": ["Zlecenia", "Jobs"],
    "/freelancers": ["Freelancerzy", "Freelancers"],
    "/services": ["Usługi", "Services"],
    "/services/mine": ["Moje usługi", "My services"],
    "/services/new": ["Nowa usługa", "New service"],
    "/find-talent": ["Nowe zlecenie", "New job"],
    "/notifications": ["Powiadomienia", "Notifications"],
    "/privacy-center": ["Prywatność i dane", "Privacy & data"],
    "/disputes": ["Sprawy i zgłoszenia", "Disputes & reports"],
    "/account-status": ["Status konta", "Account status"]
  };
  const sectionLabels = {
    "#account-profile-data": ["Dane profilu", "Profile details"],
    "#account-expertise": ["Specjalizacja", "Expertise"],
    "#account-portfolio": ["Portfolio", "Portfolio"],
    "#account-jobs": ["Moje ogłoszenia", "My listings"],
    "#account-preferences": ["Ustawienia", "Settings"],
    "#account-privacy": ["Ustawienia", "Settings"],
    "#account-templates": ["Wygląd", "Appearance"],
    "#account-payouts": ["Wypłaty", "Payouts"]
  };
  const breadcrumb = location.pathname === "/account" && sectionLabels[location.hash] ? sectionLabels[location.hash] : labels[location.pathname] || (chat ? ["Rozmowa", "Conversation"] : location.pathname.startsWith("/profile/") ? ["Profil", "Profile"] : location.pathname.startsWith("/edit-job/") ? ["Edycja zlecenia", "Edit job"] : ["Twoje konto", "Your account"]);
  useLayoutEffect(() => {
    document.body.classList.add("ih67-workspace");
    document.body.dataset.ih67View = view;
    return () => {
      document.body.classList.remove("ih67-workspace");
      delete document.body.dataset.ih67View;
    };
  }, [view]);
  useLayoutEffect(() => {
    const main = document.querySelector("#root main");
    if (!main) return undefined;
    const previousId = main.id;
    const previousTabindex = main.getAttribute("tabindex");
    if (!previousId) main.id = "ih67-content";
    if (previousTabindex == null) main.setAttribute("tabindex", "-1");
    return () => {
      if (!previousId) main.removeAttribute("id");
      if (previousTabindex == null) main.removeAttribute("tabindex");
    };
  }, [location.pathname]);
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const root = document.getElementById("root");
    const previousInert = root?.inert || false;
    const overflow = document.body.style.getPropertyValue("overflow");
    const priority = document.body.style.getPropertyPriority("overflow");
    if (root) root.inert = true;
    document.body.style.setProperty("overflow", "hidden", "important");
    const controls = () => [...(dialogRef.current?.querySelectorAll('a[href],button:not([disabled])') || [])];
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector("button")?.focus());
    function keyboard(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const all = controls(),
        first = all[0],
        last = all[all.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keyboard);
      if (root) root.inert = previousInert;
      if (overflow) document.body.style.setProperty("overflow", overflow, priority);else document.body.style.removeProperty("overflow");
      (previous?.isConnected && previous !== document.body && previous !== root ? previous : triggerRef.current)?.focus?.({
        preventScroll: true
      });
    };
  }, [open]);
  const core = [{
    to: "/account",
    label: t("Start", "Overview"),
    icon: "home",
    exact: true
  }, ...(!limited ? [{
    to: "/work",
    label: t("Moja praca", "My work"),
    icon: "work"
  }, {
    to: "/messages",
    label: t("Wiadomości", "Messages"),
    icon: "message",
    dot: hasMessages
  }] : []), {
    to: "/calendar",
    label: t("Kalendarz", "Calendar"),
    icon: "calendar"
  }, ...(!limited ? [{
    to: "/notifications",
    label: t("Powiadomienia", "Notifications"),
    icon: "bell",
    dot: hasNotifications
  }] : [])];
  const explore = [{
    to: "/jobs",
    label: t("Zlecenia", "Jobs"),
    icon: "jobs"
  }, {
    to: "/services",
    label: t("Usługi", "Services"),
    icon: "services"
  }, {
    to: "/freelancers",
    label: t("Freelancerzy", "Freelancers"),
    icon: "people"
  }];
  const active = item => item.to.includes("#") ? `${location.pathname}${location.hash}` === item.to : item.exact ? location.pathname === item.to && !location.hash : item.to === "/work" ? location.pathname === "/work" || location.pathname.startsWith("/chat/") : item.to === "/services" ? location.pathname === "/services" || /^\/services\/(?!mine|new)[^/]+$/.test(location.pathname) : location.pathname === item.to;
  const navItem = item => <Link key={item.to} to={item.to} className={`ih67-nav-item${active(item) ? " is-current" : ""}`} aria-current={active(item) ? "page" : undefined} onClick={() => setOpen(false)}><WorkspaceIcon kind={item.icon} /><span>{item.label}</span>{item.dot && <i className="ih67-dot" aria-label={t("Nowe wiadomości", "New messages")} />}</Link>;
  const profileLink = <Link className={`ih67-nav-item${location.pathname === "/account" && location.hash ? " is-current" : ""}`} to={limited ? "/account" : "/account#account-profile-data"} onClick={() => setOpen(false)}><WorkspaceIcon kind="profile" /><span>{t("Profil i ustawienia", "Profile & settings")}</span></Link>;
  const menuContents = <>
    <div className="ih67-nav-group"><span className="ih67-nav-label">{t("Twoje konto", "Your account")}</span>{core.map(navItem)}</div>
    <div className="ih67-nav-group"><span className="ih67-nav-label">{t("Odkrywaj", "Explore")}</span>{explore.map(navItem)}</div>
    {!limited && <div className="ih67-nav-group"><span className="ih67-nav-label">{t("Zarządzaj", "Manage")}</span>{navItem({
        to: "/account#account-jobs",
        label: t("Moje ogłoszenia", "My listings"),
        icon: "jobs"
      })}{navItem({
        to: "/services/mine",
        label: t("Moje usługi", "My services"),
        icon: "services"
      })}</div>}
    <div className="ih67-nav-bottom">{profileLink}
      {!limited && navItem({
        to: "/disputes",
        label: t("Sprawy i zgłoszenia", "Disputes & reports"),
        icon: "lock",
        dot: hasDisputes
      })}
      {navItem({
        to: "/privacy-center",
        label: t("Prywatność i dane", "Privacy & data"),
        icon: "settings"
      })}
      {assistantEnabled && <Link to="/lucyna" className="ih67-nav-item" data-no-route-transition="true" onClick={event => {
        onAssistantOpen?.(event);
        setOpen(false);
      }}><LucynaSymbol /><span>Lucyna AI</span></Link>}
      <a className="ih67-nav-item" href={helpUrl} onClick={() => setOpen(false)}><WorkspaceIcon kind="files" /><span>{t("Centrum pomocy", "Help centre")}</span></a>
      <Link className="ih67-nav-item" to="/" onClick={() => setOpen(false)}><ArrowUpRight size={20} strokeWidth={1.7} aria-hidden="true" /><span>{t("Strona główna", "Homepage")}</span></Link>
    </div>
  </>;
  const bottom = limited ? [core[0], explore[0], explore[1], {
    to: "menu",
    menu: true,
    label: "Menu",
    icon: "services"
  }] : [core[0], {
    ...core[1],
    label: t("Praca", "Work")
  }, core[2], {
    to: "/account#account-profile-data",
    label: t("Profil", "Profile"),
    icon: "profile"
  }];
  return <>
    <a href="#ih67-content" className="ih67-skip" onClick={() => document.getElementById("ih67-content")?.focus()}>{t("Przejdź do treści", "Skip to content")}</a>
    <header className="navbar account-navbar ih67-topbar">
      <Link to="/" className="ih67-brand" aria-label="IdeaHire"><BrandSignature /></Link>
      <div className="ih67-top-context"><span>{t("Twoje konto", "Your account")}</span><ChevronRight size={14} aria-hidden="true" /><strong>{t(...breadcrumb)}</strong></div>
      <div className="ih67-top-actions">
        {!limited && <Link to="/find-talent" className="ih67-create"><WorkspaceIcon kind="plus" /><span>{t("Dodaj zlecenie", "Post a job")}</span></Link>}
        {!limited && <Link to="/notifications" className="ih67-icon-button ih67-notifications" aria-label={hasNotifications || hasDisputes ? t("Powiadomienia — nowe", "Notifications — new") : t("Powiadomienia", "Notifications")}><WorkspaceIcon kind="bell" />{(hasNotifications || hasDisputes) && <i className="ih67-dot" />}</Link>}
        <Link to={limited ? "/account" : "/account#account-profile-data"} className="ih67-user-link" aria-label={t("Twój profil", "Your profile")}><Avatar name={name} url={avatarUrl} /></Link>
        {chat && <span className="ih67-appearance-slot" aria-hidden="true" />}
        <button ref={triggerRef} type="button" className="ih67-icon-button ih67-menu-toggle" aria-label={t("Otwórz menu", "Open menu")} aria-expanded={open} aria-controls="ih67-menu" onClick={() => setOpen(true)}><Menu size={22} strokeWidth={1.7} aria-hidden="true" /></button>
      </div>
    </header>
    <aside className="ih67-rail" aria-label={t("Nawigacja konta", "Account navigation")}><nav>{menuContents}</nav><div className="ih67-rail-user"><Avatar name={name} url={avatarUrl} /><div><strong>{name}</strong><span>{limited ? t("Konto 16–17 lat", "Account ages 16–17") : t("Moje konto", "My account")}</span></div><button type="button" className="ih67-icon-button" onClick={onLogout} aria-label={t("Wyloguj się", "Sign out")}><LogOut size={18} aria-hidden="true" /></button></div></aside>
    {!chat && <nav className="ih67-mobile-nav" aria-label={t("Skróty konta", "Account shortcuts")}>{bottom.map((item, index) => item.menu ? <button key="menu" type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="ih67-menu"><span><Menu size={21} strokeWidth={1.7} aria-hidden="true" /></span><span>{item.label}</span></button> : <Link key={`${item.to}-${index}`} to={item.to} className={active(item) ? "is-current" : ""} aria-current={active(item) ? "page" : undefined}><span><WorkspaceIcon kind={item.icon} />{item.dot && <i className="ih67-dot" />}</span><span>{item.label}</span></Link>)}</nav>}
    {moderationNotice && <div className="ih67-moderation">{typeof moderationNotice === "string" ? moderationNotice : t("Sprawdź status swojego konta.", "Check your account status.")} <Link to="/account-status">{t("Zobacz szczegóły", "View details")}</Link></div>}
    {open && createPortal(<div className="ih67-menu-layer"><button type="button" className="ih67-menu-scrim" tabIndex={-1} aria-label={t("Zamknij menu", "Close menu")} onClick={() => setOpen(false)} /><section id="ih67-menu" className="ih67-menu-panel" role="dialog" aria-modal="true" aria-labelledby="ih67-menu-title" ref={dialogRef}><header><h2 id="ih67-menu-title">{t("Menu konta", "Account menu")}</h2><button type="button" className="ih67-icon-button" onClick={() => setOpen(false)} aria-label={t("Zamknij menu", "Close menu")}><X size={22} aria-hidden="true" /></button></header><nav>{menuContents}</nav><footer><Avatar name={name} url={avatarUrl} /><strong>{name}</strong><button type="button" onClick={() => {
            setOpen(false);
            onLogout();
          }}><LogOut size={18} aria-hidden="true" />{t("Wyloguj się", "Sign out")}</button></footer></section></div>, document.body)}
  </>;
}
const sectionIcons = {
  profile: "profile",
  expertise: "services",
  portfolio: "portfolio",
  jobs: "jobs",
  preferences: "settings",
  templates: "palette",
  payouts: "payouts"
};
const sectionEN = {
  profile: "Profile details",
  expertise: "Skills & expertise",
  portfolio: "Portfolio",
  jobs: "My listings",
  preferences: "Settings",
  templates: "Appearance",
  payouts: "Payouts"
};
export function WorkspaceSectionNav({
  sections,
  active,
  onSelect
}) {
  const t = useCopy();
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef(null);
  useEffect(() => {
    if (!expanded) return undefined;
    const outside = event => {
      if (!navRef.current?.contains(event.target)) setExpanded(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);
  const selected = sections.find(section => section.key === active);
  useEffect(() => {
    setExpanded(false);
  }, [active]);
  return <nav ref={navRef} className={`ih67-section-nav${expanded ? " is-open" : ""}`} aria-label={t("Ustawienia konta", "Account settings")} onKeyDown={event => {
    if (event.key === "Escape") {
      setExpanded(false);
      event.currentTarget.querySelector(".ih67-section-toggle")?.focus();
    }
  }}>
    <button className="ih67-section-toggle" type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="ih67-section-options"><WorkspaceIcon kind={sectionIcons[active]} /><span>{t(selected?.label || "Profil i konto", sectionEN[active] || "Profile & account")}</span><WorkspaceIcon kind="down" /></button>
    <div className="ih67-section-options" id="ih67-section-options">{sections.map(section => <button key={section.key} type="button" onClick={() => {
        setExpanded(false);
        onSelect(section);
      }} aria-current={active === section.key ? "page" : undefined}><WorkspaceIcon kind={sectionIcons[section.key]} /><span>{t(section.key === "templates" ? "Wygląd" : section.label, sectionEN[section.key])}</span></button>)}</div>
  </nav>;
}
function ConversationRows({
  conversations = [],
  user,
  compact = false
}) {
  const t = useCopy(),
    en = useSitePreferences().language === "en";
  return <div className={`ih67-project-rows${compact ? " is-compact" : ""}`}>{conversations.map(item => {
      const title = item.job?.title || t("Zapytanie o współpracę", "Project inquiry");
      const name = item.otherProfile?.name || t("Użytkownik", "User");
      const isClient = item.client_id === user?.id;
      return <Link key={item.id} className="ih67-project-row" to={`/chat/${item.id}`}>
      <Avatar name={name} url={item.otherProfile?.avatar_url} />
      <div className="ih67-project-copy"><strong>{title}</strong><span>{name}<i aria-hidden="true">·</i>{isClient ? t("Ty: zleceniodawca", "You: client") : t("Ty: wykonawca", "You: freelancer")}</span>{!compact && <p>{String(item.lastMessage?.content || "").trim() || t("Otwórz rozmowę, aby ustalić szczegóły.", "Open the conversation to discuss the details.")}</p>}</div>
      <div className="ih67-project-meta"><time dateTime={item.sortDate || undefined}>{workspaceDate(item.sortDate, en)}</time>{item.isUnread ? <span className="ih67-status">{t("Nowa wiadomość", "New message")}</span> : <WorkspaceIcon kind="arrow" />}</div>
    </Link>;
    })}</div>;
}
function WorkspaceFilm() {
  const t = useCopy(),
    trigger = useRef(null);
  const [open, setOpen] = useState(false),
    [origin, setOrigin] = useState(null);
  return <><button type="button" className="ih67-film" ref={trigger} onClick={() => {
      setOrigin(trigger.current?.getBoundingClientRect() || null);
      setOpen(true);
    }}><span className="ih67-film-art" aria-hidden="true"><WorkspaceDrawing /><i><Play size={18} fill="currentColor" /></i></span><span><small>{t("Poznaj platformę", "Meet the platform")}</small><strong>{t("Od pomysłu do współpracy.", "From an idea to a project.")}</strong><span>{t("Obejrzyj film", "Watch the film")} <ArrowUpRight size={16} aria-hidden="true" /></span></span></button>{open && <IdeaHirePromoFilm origin={origin} onClose={() => setOpen(false)} />}</>;
}
export function WorkspaceDashboard({
  name,
  avatarUrl,
  about,
  specialtyCount = 0,
  portfolioCount = 0,
  jobCount = 0,
  jobsLoading,
  sections,
  onSelect,
  inbox
}) {
  const t = useCopy();
  const firstName = (name || "").trim().split(/\s+/)[0];
  const profileItems = [{
    key: "profile",
    icon: "profile",
    title: t("Profil publiczny", "Public profile"),
    copy: t("Zdjęcie, nazwa i opis", "Photo, name and bio"),
    done: Boolean(about?.trim() && avatarUrl)
  }, {
    key: "expertise",
    icon: "services",
    title: t("Specjalizacja", "Expertise"),
    copy: specialtyCount ? t(specialtyCount === 1 ? "1 wybrana dziedzina" : `${specialtyCount} wybrane dziedziny`, specialtyCount === 1 ? "1 selected field" : `${specialtyCount} selected fields`) : t("Dodaj dziedziny i umiejętności", "Add fields and skills"),
    done: specialtyCount > 0
  }, {
    key: "payouts",
    icon: "payouts",
    title: t("Wypłaty", "Payouts"),
    copy: t("Saldo i połączenie ze Stripe", "Balance and Stripe connection"),
    done: false
  }, {
    key: "portfolio",
    icon: "portfolio",
    title: t("Portfolio", "Portfolio"),
    copy: portfolioCount ? t(`${portfolioCount} ${portfolioCount === 1 ? "realizacja" : portfolioCount < 5 ? "realizacje" : "realizacji"}`, portfolioCount === 1 ? "1 project" : `${portfolioCount} projects`) : t("Pokaż swoje realizacje", "Show your past work"),
    done: portfolioCount > 0
  }];
  const conversations = inbox?.conversations || [];
  return <div className="ih67-dashboard">
    <header className="ih67-page-heading"><div><span className="ih67-eyebrow">{t("Moje konto", "My account")}</span><h1 tabIndex={-1} id="ih67-dashboard-title">{firstName ? t(`Cześć, ${firstName}.`, `Hello, ${firstName}.`) : t("Dobrze Cię widzieć.", "Good to see you.")}</h1><p>{t("Tu znajdziesz swoją pracę, rozmowy i profil.", "Your work, conversations and profile, together.")}</p></div><Link to="/calendar" className="ih67-text-link"><WorkspaceIcon kind="calendar" />{t("Mój kalendarz", "My calendar")}<WorkspaceIcon kind="arrow" /></Link></header>
    <section className="ih67-action-band" aria-label={t("Rozpocznij projekt", "Start a project")}><div><span className="ih67-eyebrow">{t("Co chcesz dziś zrobić?", "What would you like to do?")}</span><h2>{t("Dobra praca zaczyna się od konkretu.", "Good work starts with a clear brief.")}</h2><div className="ih67-action-buttons"><Link to="/find-talent" className="ih67-primary"><Plus size={19} aria-hidden="true" />{t("Zleć projekt", "Post a project")}<ArrowUpRight size={18} aria-hidden="true" /></Link><Link to="/jobs" className="ih67-secondary">{t("Znajdź zlecenie", "Find a job")}<ArrowRight size={18} aria-hidden="true" /></Link></div></div><WorkspaceDrawing /></section>
    <div className="ih67-dashboard-columns"><div className="ih67-dashboard-main">
      <section className="ih67-block ih67-recent-work"><header className="ih67-block-heading"><div><span className="ih67-eyebrow">{t("Kontynuuj", "Pick up where you left off")}</span><h2>{t("Ostatnie rozmowy", "Recent conversations")}</h2></div><Link to="/work" className="ih67-text-link">{t("Moja praca", "My work")}<WorkspaceIcon kind="arrow" /></Link></header>
        {inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih67-feedback" role="alert">{inbox.errorMessage}</p> : conversations.length ? <ConversationRows conversations={conversations.slice(0, 4)} user={inbox?.user} compact /> : <div className="ih67-empty-work"><span className="ih67-empty-symbol"><MessageSquare size={24} aria-hidden="true" /></span><div><h3>{t("Tu wrócisz do swoich projektów.", "Your projects will be here.")}</h3><p>{t("Rozmowy z klientami i wykonawcami pojawią się w tym miejscu.", "Conversations with clients and freelancers will appear here.")}</p><Link to="/freelancers" className="ih67-text-link">{t("Znajdź osobę do projektu", "Find someone for your project")}<WorkspaceIcon kind="arrow" /></Link></div></div>}
      </section>
      <section className="ih67-listings-strip"><div><WorkspaceIcon kind="jobs" /><div><strong>{t("Twoje ogłoszenia", "Your listings")}</strong><span>{jobsLoading ? t("Ładowanie…", "Loading…") : t(`${jobCount} na Twoim koncie`, `${jobCount} in your account`)}</span></div></div><button type="button" className="ih67-text-link" onClick={() => onSelect(sections.find(s => s.key === "jobs"))}>{t("Zarządzaj", "Manage")}<WorkspaceIcon kind="arrow" /></button></section>
      <section className="ih67-services-strip"><div><span className="ih67-eyebrow">{t("Oferujesz usługi?", "Offering services?")}</span><h2>{t("Daj się znaleźć.", "Let clients find you.")}</h2><p>{t("Opisz, co wykonujesz, w jakim zakresie i za ile.", "Explain what you do, what is included and how much it costs.")}</p></div><div><Link to="/services/new" className="ih67-secondary"><WorkspaceIcon kind="plus" />{t("Dodaj usługę", "Add a service")}</Link><Link to="/services/mine" className="ih67-text-link">{t("Moje usługi", "My services")}<WorkspaceIcon kind="arrow" /></Link></div></section>
    </div><aside className="ih67-dashboard-side" aria-label={t("Twój profil i ustawienia", "Your profile and settings")}>
      <section className="ih67-profile-summary"><header><Avatar name={name} url={avatarUrl} /><div><span className="ih67-eyebrow">{t("Twój profil", "Your profile")}</span><h2>{name}</h2></div></header><div className="ih67-profile-steps">{profileItems.map(item => <button key={item.key} type="button" onClick={() => onSelect(sections.find(s => s.key === item.key))}><WorkspaceIcon kind={item.icon} /><span><strong>{item.title}</strong><small>{item.copy}</small></span>{item.done ? <Check size={17} aria-label={t("Uzupełniono", "Added")} /> : <ChevronRight size={17} aria-hidden="true" />}</button>)}</div><footer>{sections.filter(s => ["preferences", "templates"].includes(s.key)).map(s => <button key={s.key} type="button" onClick={() => onSelect(s)}><WorkspaceIcon kind={sectionIcons[s.key]} />{t(s.key === "templates" ? "Wygląd" : s.label, sectionEN[s.key])}</button>)}</footer></section>
      <WorkspaceFilm />
    </aside></div>
  </div>;
}
export function WorkspaceLoading() {
  const t = useCopy();
  return <div className="ih67-loading" role="status"><span>{t("Ładowanie…", "Loading…")}</span><i /><i /><i /></div>;
}
export function WorkspaceWork({
  inbox
}) {
  const t = useCopy();
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const conversations = inbox?.conversations || [];
  const visible = useMemo(() => conversations.filter(item => {
    if (filter === "client" && item.client_id !== inbox?.user?.id) return false;
    if (filter === "contractor" && item.contractor_id !== inbox?.user?.id) return false;
    const term = search.trim().toLocaleLowerCase();
    return !term || [item.job?.title, item.otherProfile?.name, item.lastMessage?.content].filter(Boolean).join(" ").toLocaleLowerCase().includes(term);
  }), [conversations, inbox?.user?.id, filter, search]);
  return <main className="ih67-work-page" id="ih67-content"><header className="ih67-page-heading"><div><span className="ih67-eyebrow">{t("Projekty i współpraca", "Projects & collaboration")}</span><h1>{t("Moja praca", "My work")}</h1><p>{t("Wróć do rozmowy, ustaleń i plików konkretnego projektu.", "Return to a project’s conversation, terms and files.")}</p></div><Link to="/find-talent" className="ih67-primary"><WorkspaceIcon kind="plus" />{t("Nowe zlecenie", "New job")}</Link></header>
    <div className="ih67-work-toolbar"><div className="ih67-filter-tabs" aria-label={t("Twoja rola", "Your role")}>{[["all", t("Wszystkie", "All")], ["client", t("Zlecam", "Hiring")], ["contractor", t("Realizuję", "Providing")]].map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><label className="ih67-search"><WorkspaceIcon kind="search" /><span className="ih67-sr-only">{t("Szukaj projektu lub osoby", "Search projects or people")}</span><input type="search" placeholder={t("Projekt lub osoba…", "Project or person…")} value={search} onChange={event => setSearch(event.target.value)} maxLength={160} /></label></div>
    <section className="ih67-work-ledger" aria-label={t("Lista współprac", "Project conversations")}><header><h2>{t("Rozmowy o projektach", "Project conversations")}</h2><span aria-live="polite">{inbox?.loading ? "…" : visible.length}</span></header>{inbox?.loading ? <WorkspaceLoading /> : inbox?.errorMessage ? <p className="ih67-feedback" role="alert">{inbox.errorMessage}</p> : visible.length ? <ConversationRows conversations={visible} user={inbox?.user} /> : <div className="ih67-work-empty"><WorkspaceDrawing /><h2>{conversations.length ? t("Brak pasujących rozmów", "No matching conversations") : t("Pierwszy projekt przed Tobą.", "Your first project is ahead.")}</h2><p>{conversations.length ? t("Zmień frazę lub wybraną rolę.", "Change your search or role filter.") : t("Odpowiedz na zlecenie albo porozmawiaj z freelancerem. Tutaj wrócisz do szczegółów współpracy.", "Reply to a job or talk to a freelancer. Return here for project details.")}</p>{conversations.length ? <button type="button" className="ih67-secondary" onClick={() => {
          setSearch("");
          setFilter("all");
        }}>{t("Wyczyść filtry", "Clear filters")}</button> : <Link to="/jobs" className="ih67-primary">{t("Przeglądaj zlecenia", "Browse jobs")}<WorkspaceIcon kind="arrow" /></Link>}</div>}</section>
    <nav className="ih67-work-links" aria-label={t("Zarządzanie ofertą", "Manage your listings")}><Link to="/account#account-jobs"><WorkspaceIcon kind="jobs" /><span><strong>{t("Moje ogłoszenia", "My listings")}</strong><small>{t("Publikacja i zgłoszenia wykonawców", "Posts and freelancer applications")}</small></span><WorkspaceIcon kind="arrow" /></Link><Link to="/services/mine"><WorkspaceIcon kind="services" /><span><strong>{t("Moje usługi", "My services")}</strong><small>{t("Oferta, zakres i dostępność", "Offer, scope and availability")}</small></span><WorkspaceIcon kind="arrow" /></Link></nav>
  </main>;
}
export function WorkspaceLimitedHome({
  fullAccessLabel,
  ageRestricted,
  settings,
  helpUrl
}) {
  const t = useCopy();
  return <main className="ih67-limited-home" id="ih67-content"><header className="ih67-page-heading"><div><span className="ih67-account-badge">{t("Konto 16–17 lat", "Account ages 16–17")}</span><h1>{t("Poznaj swoje możliwości.", "Explore what you can do.")}</h1><p>{t("Przeglądaj projekty, usługi i profile. Wybierz dziedziny, które Cię interesują.", "Browse projects, services and profiles. Discover fields that interest you.")}</p></div></header>{ageRestricted && <p className="ih67-feedback" role="status">{t("Ta funkcja jest dostępna na pełnym koncie. Możesz dalej przeglądać platformę.", "This feature requires a full account. You can continue browsing the platform.")}</p>}<section className="ih67-limited-explore"><div><span className="ih67-eyebrow">{t("Rozejrzyj się", "Take a look")}</span><h2>{t("Zobacz, nad czym pracują inni.", "See what others are working on.")}</h2><p>{t("Dostęp do katalogów masz już teraz.", "The catalogues are available to you now.")}</p><Link to="/jobs" className="ih67-primary">{t("Przeglądaj zlecenia", "Browse jobs")}<WorkspaceIcon kind="arrow" /></Link></div><WorkspaceDrawing /></section><nav className="ih67-limited-links" aria-label={t("Katalogi platformy", "Platform catalogues")}>{[["/services", "services", t("Usługi", "Services"), t("Sprawdź oferty i zakres prac", "Explore offers and their scope")], ["/freelancers", "people", t("Freelancerzy", "Freelancers"), t("Poznaj specjalistów i ich realizacje", "Discover specialists and their work")], ["/calendar", "calendar", t("Kalendarz", "Calendar"), t("Zaplanuj własne zadania", "Plan your own tasks")]].map(([to, icon, title, copy]) => <Link key={to} to={to}><WorkspaceIcon kind={icon} /><span><strong>{title}</strong><small>{copy}</small></span><WorkspaceIcon kind="arrow" /></Link>)}</nav><section className="ih67-age-info"><WorkspaceIcon kind="lock" /><div><h2>{t("Funkcje płatnej współpracy — od 18 lat", "Paid collaboration — from age 18")}</h2><p>{t("Publikowanie płatnych ofert, zawieranie umów, płatności i wypłaty pozostają zablokowane. Pozostałe dostępne widoki otworzysz z menu.", "Paid listings, agreements, payments and payouts remain locked. Open other available views from the menu.")}</p><span>{t("Pełne konto:", "Full account:")} <strong>{fullAccessLabel === "po ukończeniu 18 lat" ? t("po ukończeniu 18 lat", "after turning 18") : fullAccessLabel}</strong></span><small>{t("Zachowujesz to samo konto.", "You keep the same account.")}</small></div></section><details className="ih67-limited-settings"><summary><WorkspaceIcon kind="palette" /><span>{t("Wygląd strony", "Appearance")}</span><WorkspaceIcon kind="down" /></summary>{settings}</details><a className="ih67-text-link" href={helpUrl}>{t("Potrzebujesz pomocy?", "Need help?")}<WorkspaceIcon kind="arrow" /></a></main>;
}
export function WorkspaceMessengerStart() {
  const t = useCopy();
  return <section className="ih12-inbox-welcome ih67-messenger-start" aria-label={t("Otwórz rozmowę", "Open a conversation")}><div><WorkspaceDrawing variant="messages" /><span className="ih67-eyebrow">{t("Rozmowa. Ustalenia. Pliki.", "Conversation. Terms. Files.")}</span><h2>{t("Dobra współpraca ma swój wątek.", "Every project has a conversation.")}</h2><p>{t("Wybierz osobę z listy. W rozmowie ustalicie zakres, zapiszecie warunki i przekażecie materiały.", "Choose a person from the list. Discuss the scope, agree on terms and share materials in the conversation.")}</p></div><nav aria-label={t("Rozpocznij współpracę", "Start a project")}><Link to="/freelancers" className="ih67-primary">{t("Znajdź freelancera", "Find a freelancer")}<WorkspaceIcon kind="arrow" /></Link><Link to="/jobs" className="ih67-text-link">{t("Przeglądaj zlecenia", "Browse jobs")}<WorkspaceIcon kind="arrow" /></Link></nav></section>;
}
