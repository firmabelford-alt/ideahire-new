import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Camera, Check, ChevronRight, FileText, Image, Layers3, Link2, LockKeyhole, Palette, Plus, Save, Settings2, Trash2, UserRound, Wallet, X } from 'lucide-react';
import { AutoTextarea } from './FormControls';
import './Studio.css';

const copy = en => (pl, english) => en ? english : pl;
const icons = { profile: UserRound, expertise: Layers3, portfolio: Image, jobs: FileText, preferences: Settings2, payouts: Wallet, templates: Palette };

export function StudioNavigation({ sections, active, onSelect, name, avatarUrl, en = false }) {
  const t = copy(en), nav = useRef(null);
  const labels = { profile: t('Dane profilu', 'Profile details'), expertise: t('Umiejętności', 'Skills'), portfolio: 'Portfolio', jobs: t('Moje zlecenia', 'My listings'), preferences: t('Ustawienia', 'Settings'), payouts: t('Wypłaty', 'Payouts'), templates: t('Wygląd', 'Appearance') };
  useEffect(() => {
    const node = nav.current?.querySelector('[aria-current="page"]');
    if (!node || !nav.current || !window.matchMedia('(max-width:850px)').matches) return;
    nav.current.scrollTo({ left: Math.max(0, node.offsetLeft - nav.current.offsetLeft - 16), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [active]);
  return <aside className="ih-studio-navigation">
    <div className="ih-studio-nav-top"><Link to="/account"><ArrowLeft size={17} />{t('Moje konto', 'My account')}</Link><span>{t('Edycja konta', 'Account editor')}</span></div>
    <div className="ih-studio-owner"><StudioAvatar name={name} url={avatarUrl} /><div><strong>{name}</strong><span>{t('Twoja przestrzeń', 'Your space')}</span></div></div>
    <nav ref={nav} className="ih-studio-nav-list" aria-label={t('Sekcje edycji konta', 'Account editor sections')}>
      {sections.map(section => { const Icon = icons[section.key] || Settings2; return <button type="button" key={section.key} aria-current={active === section.key ? 'page' : undefined} onClick={() => onSelect(section)}><Icon size={19} /><span>{labels[section.key] || section.label}</span><ChevronRight size={15} /></button>; })}
    </nav>
  </aside>;
}

export function StudioHeading({ title, description, actions, en = false }) {
  return <header className="ih-studio-heading"><div><p className="ih-studio-kicker">{en ? 'Account editor' : 'Edytor konta'}</p><h1 id="account-section-title" tabIndex={-1}>{title}</h1><p>{description}</p></div>{actions && <div className="ih-studio-heading-actions">{actions}</div>}</header>;
}

function StudioAvatar({ name = '', url }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <span className="ih-studio-avatar" aria-hidden="true">{url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : Array.from(name.trim() || 'I')[0].toLocaleUpperCase()}</span>;
}

function Panel({ id, title, description, children, count, className = '' }) {
  return <section className={`ih-studio-panel ${className}`} aria-labelledby={id}><header className="ih-studio-panel-heading"><div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>{count && <span className="ih-studio-counter">{count}</span>}</header>{children}</section>;
}

function SaveBar({ busy, loading, message, en, section }) {
  const t = copy(en);
  return <footer className="ih-studio-savebar"><div><span>{section}</span><p role="status" aria-live="polite">{message || t('Zapisz, aby zaktualizować profil.', 'Save to update your profile.')}</p></div><button type="submit" className="ih-studio-button is-primary" disabled={busy || loading}><Save size={17} />{busy ? t('Zapisywanie…', 'Saving…') : t('Zapisz zmiany', 'Save changes')}</button></footer>;
}

function ProfilePreview({ name, avatarUrl, about, country, categories, skills, en }) {
  const t = copy(en);
  return <aside className="ih-studio-preview" aria-label={t('Podgląd profilu', 'Profile preview')}><span className="ih-studio-kicker">{t('Tak się przedstawiasz', 'How you appear')}</span><StudioAvatar name={name} url={avatarUrl} /><strong>{name || t('Twoja nazwa', 'Your name')}</strong>{country && <span>{country}</span>}{about && <p>{about}</p>}{categories?.length > 0 && <div className="ih-studio-preview-tags">{categories.map(value => <span key={value}>{value}</span>)}</div>}{skills?.length > 0 && <div className="ih-studio-preview-tags is-skills">{skills.slice(0, 6).map(value => <span key={value}>{value}</span>)}</div>}<div className="ih-studio-preview-note"><UserRound size={16} /><span>{t('Podgląd zmian przed zapisaniem', 'Preview before saving')}</span></div></aside>;
}

export function ProfileDetailsEditor({ name, onName, avatarUrl, onAvatar, about, onAbout, email, countryField, countryLabel, onSubmit, uploading, saving, loading, message, en = false }) {
  const t = copy(en), busy = saving || uploading;
  return <form className="ih-studio-form" onSubmit={onSubmit}>
    <fieldset className="ih-studio-form-body" disabled={busy || loading}>
      <div className="ih-studio-editor-grid">
        <div className="ih-studio-stack">
          <Panel id="studio-identity-title" title={t('Zacznij od siebie', 'Start with you')} description={t('Zdjęcie i nazwa, po których Cię rozpoznają.', 'The photo and name people recognise you by.')}>
            <div className="ih-studio-photo"><StudioAvatar name={name} url={avatarUrl} /><div><label className="ih-studio-photo-upload"><Camera size={18} /><span>{uploading ? t('Przesyłanie…', 'Uploading…') : t('Zmień zdjęcie', 'Change photo')}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatar} aria-label={t('Wybierz zdjęcie profilowe', 'Choose a profile photo')} disabled={busy || loading} /></label><small>JPG, PNG, WEBP · 400 × 400 px</small></div></div>
            <div className="ih-studio-fields"><label className="ih-studio-field">{t('Imię lub nazwa', 'Name or display name')}<input type="text" value={name} onChange={e => onName(e.target.value)} autoComplete="nickname" required /></label><div className="ih-studio-field"><span id="studio-country-label">{t('Kraj', 'Country')}</span>{countryField}</div></div>
          </Panel>
          <Panel id="studio-about-title" title={t('Kilka słów o Tobie', 'A little about you')} description={t('Przedstaw się osobom, z którymi chcesz pracować.', 'Introduce yourself to the people you want to work with.')}>
            <label className="ih-studio-field"><span className="ih-studio-sr">{t('O mnie', 'About me')}</span><AutoTextarea rows={4} value={about} onChange={e => onAbout(e.target.value)} maxLength={1000} placeholder={t('Czym się zajmujesz i jak lubisz pracować?', 'What do you do and how do you like to work?')} /><span className="ih-studio-field-meta"><span>{t('Widoczne na Twoim profilu', 'Visible on your profile')}</span><span>{about.length}/1000</span></span></label>
          </Panel>
          <div className="ih-studio-private"><LockKeyhole size={18} /><div><strong>{t('E-mail do logowania', 'Sign-in email')}</strong><span>{email}</span></div><span>{t('Prywatny', 'Private')}</span></div>
        </div>
        <ProfilePreview name={name} avatarUrl={avatarUrl} about={about} country={countryLabel} en={en} />
      </div>
    </fieldset>
    <SaveBar busy={busy} loading={loading} message={message} en={en} section={t('Dane profilu', 'Profile details')} />
  </form>;
}

export function ExpertiseEditor({ categories, selected, onCategory, categoryLabel, skills, draft, onDraft, onKeyDown, onAdd, onRemove, specialization, onSpecialization, onSubmit, saving, uploading, loading, message, name, avatarUrl, en = false }) {
  const t = copy(en), busy = saving || uploading;
  return <form className="ih-studio-form" onSubmit={onSubmit}>
    <fieldset className="ih-studio-form-body" disabled={busy || loading}>
      <div className="ih-studio-editor-grid"><div className="ih-studio-stack">
        <Panel id="studio-categories-title" title={t('Twoje dziedziny', 'Your fields')} description={t('Wybierz do 3 obszarów, w których pracujesz.', 'Choose up to 3 fields you work in.')} count={`${selected.length}/3`}>
          <div className="ih-studio-categories" role="group" aria-labelledby="studio-categories-title">{categories.map(category => { const checked = selected.includes(category); return <button type="button" key={category} aria-pressed={checked} className={checked ? 'is-selected' : ''} onClick={() => onCategory(category)} disabled={busy || loading || !checked && selected.length >= 3}><span>{categoryLabel(category)}</span><i aria-hidden="true">{checked && <Check size={14} />}</i></button>; })}</div>
        </Panel>
        <Panel id="studio-skills-title" title={t('Narzędzia i umiejętności', 'Tools and skills')} description={t('Konkretne rzeczy, które potrafisz. Enter dodaje kolejną.', 'The specific things you can do. Press Enter to add.')} count={`${skills.length}/12`}>
          <div className="ih-studio-skill-entry"><label className="ih-studio-field"><span className="ih-studio-sr">{t('Nowa umiejętność', 'New skill')}</span><input type="text" value={draft} onChange={e => onDraft(e.target.value)} onKeyDown={onKeyDown} maxLength={40} placeholder={t('Np. Figma, React, fotografia produktowa', 'e.g. Figma, React, product photography')} /></label><button className="ih-studio-button" type="button" onClick={onAdd} disabled={!draft.trim() || skills.length >= 12 || busy || loading}><Plus size={18} /><span>{t('Dodaj', 'Add')}</span></button></div>
          <div className="ih-studio-skills" aria-label={t('Dodane umiejętności', 'Added skills')}>{skills.length ? skills.map(skill => <span key={skill}>{skill}<button type="button" onClick={() => onRemove(skill)} aria-label={t(`Usuń umiejętność: ${skill}`, `Remove skill: ${skill}`)} disabled={busy || loading}><X size={14} /></button></span>) : <p>{t('Dodaj pierwszą umiejętność.', 'Add your first skill.')}</p>}</div>
        </Panel>
        <Panel id="studio-experience-title" title={t('Co wnosisz do projektu?', 'What do you bring to a project?')} description={t('Opisz doświadczenie i efekty swojej pracy.', 'Describe your experience and the results of your work.')}>
          <label className="ih-studio-field"><span className="ih-studio-sr">{t('W czym się specjalizujesz?', 'What do you specialise in?')}</span><AutoTextarea rows={4} value={specialization} onChange={e => onSpecialization(e.target.value)} maxLength={1200} placeholder={t('Pomagam w… Najczęściej realizuję…', 'I help with… My projects usually include…')} /><span className="ih-studio-field-meta"><span>{t('Widoczne na Twoim profilu', 'Visible on your profile')}</span><span>{specialization.length}/1200</span></span></label>
        </Panel>
      </div><ProfilePreview name={name} avatarUrl={avatarUrl} about={specialization} categories={selected.map(categoryLabel)} skills={skills} en={en} /></div>
    </fieldset>
    <SaveBar busy={busy} loading={loading} message={message} en={en} section={t('Umiejętności', 'Skills')} />
  </form>;
}

export function PortfolioStudio({ items, loading, busy, editingId, draft, onDraft, files, removedIds, maxItems, maxImages, mediaFor, onEdit, onDelete, onReset, onSubmit, onFiles, onRemoveFile, onToggleMedia, fileInputRef, message, en = false }) {
  const t = copy(en), [open, setOpen] = useState(() => Boolean(editingId || draft.title || draft.description || draft.projectUrl || files.length)), editor = useRef(null);
  const item = items.find(value => value.id === editingId);
  const media = mediaFor(item);
  const canAdd = items.length < maxItems;
  const previousBusy = useRef(busy);
  useEffect(() => {
    if (previousBusy.current && !busy && !editingId && !draft.title && !files.length) setOpen(false);
    previousBusy.current = busy;
  }, [busy, editingId, draft.title, files.length]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => { editor.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); editor.current?.querySelector('input[type="text"]')?.focus({ preventScroll: true }); });
    return () => cancelAnimationFrame(frame);
  }, [open, editingId]);
  function add() { onReset(); setOpen(true); }
  return <div className="ih-studio-portfolio">
    <div className="ih-studio-gallery-bar"><div><Image size={18} /><span>{t('Twoje projekty', 'Your projects')}</span><span className="ih-studio-counter">{items.length}/{maxItems}</span></div>{canAdd && !open && <button type="button" className="ih-studio-button is-primary" onClick={add} disabled={busy || loading}><Plus size={18} />{t('Dodaj projekt', 'Add project')}</button>}</div>
    {message && <p className="ih-studio-notice" role="status">{message}</p>}
    {loading ? <div className="ih-studio-gallery-skeleton" aria-label={t('Pobieramy portfolio', 'Loading portfolio')} role="status"><i /><i /></div> : <div className="ih-studio-gallery">
      {items.map(value => { const images = mediaFor(value); return <article className="ih-studio-project" key={value.id}>
        <div className="ih-studio-project-cover">{images[0]?.image_url ? <img src={images[0].image_url} alt={value.title} loading="lazy" decoding="async" /> : <Link2 size={32} aria-hidden="true" />}<span>{images.length ? `${images.length} ${t('zdj.', 'photos')}` : t('Projekt z linkiem', 'Linked project')}</span></div>
        <div className="ih-studio-project-copy"><h2>{value.title}</h2>{value.description && <p>{value.description}</p>}<div><button type="button" className="ih-studio-button" onClick={() => { onEdit(value); setOpen(true); }} disabled={busy}>{t('Edytuj projekt', 'Edit project')}<ArrowUpRight size={16} /></button><button type="button" className="ih-studio-icon-button" aria-label={t(`Usuń projekt: ${value.title}`, `Delete project: ${value.title}`)} onClick={() => onDelete(value)} disabled={busy}><Trash2 size={17} /></button></div></div>
      </article>; })}
      {canAdd && !open && <button type="button" className="ih-studio-add-project" onClick={add} disabled={busy}><span><Plus size={25} /></span><strong>{items.length ? t('Kolejna realizacja', 'Your next project') : t('Pokaż, co tworzysz', 'Show what you create')}</strong><p>{t('Zdjęcia, krótki opis i link. Wszystko w jednym albumie.', 'Photos, a short description and a link. One album.')}</p><span className="ih-studio-add-label">{t('Dodaj projekt', 'Add project')}<ArrowUpRight size={16} /></span></button>}
    </div>}
    {open && (editingId || canAdd) && <form className="ih-studio-project-editor" ref={editor} onSubmit={onSubmit}>
      <Panel id="studio-project-editor-title" title={editingId ? t('Edytuj realizację', 'Edit project') : t('Nowa realizacja', 'New project')} description={t(`Do ${maxImages} zdjęć w albumie. Możesz też dodać sam link.`, `Up to ${maxImages} photos per album. A link alone works too.`)}>
        <fieldset className="ih-studio-form-body" disabled={busy}>
          <div className="ih-studio-stack"><label className="ih-studio-field">{t('Tytuł projektu', 'Project title')}<input type="text" value={draft.title} onChange={e => onDraft({ ...draft, title: e.target.value })} minLength={3} maxLength={120} required placeholder={t('Np. Identyfikacja kawiarni', 'e.g. Coffee shop identity')} /></label>
          <label className="ih-studio-field">{t('Krótki opis', 'Short description')}<AutoTextarea rows={3} value={draft.description} onChange={e => onDraft({ ...draft, description: e.target.value })} maxLength={800} placeholder={t('Twój zakres pracy i rezultat', 'Your role and the outcome')} /></label>
          <label className="ih-studio-field">{t('Link do projektu', 'Project link')}<input type="url" inputMode="url" value={draft.projectUrl} onChange={e => onDraft({ ...draft, projectUrl: e.target.value })} maxLength={2048} placeholder="https://" /><small>{t('Opcjonalnie · adres HTTPS', 'Optional · HTTPS address')}</small></label>
          <label className="ih-studio-upload-zone"><Image size={26} /><strong>{t('Dodaj zdjęcia', 'Add photos')}</strong><span>JPG, PNG, WEBP · 12 MB / {t('plik', 'file')}</span><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} disabled={busy} /></label>
          {media.length > 0 && <div className="ih-studio-media-grid">{media.map((value, index) => { const removed = removedIds.includes(value.id); return <button type="button" key={value.id} aria-pressed={removed} className={removed ? 'is-removed' : ''} onClick={() => onToggleMedia(value.id)} aria-label={t(`${removed ? 'Przywróć' : 'Usuń'} zdjęcie ${index + 1}`, `${removed ? 'Restore' : 'Remove'} photo ${index + 1}`)}><img src={value.image_url} alt="" /><span>{removed ? t('Przywróć', 'Restore') : <X size={15} />}</span></button>; })}</div>}
          {files.length > 0 && <ul className="ih-studio-file-list">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><Image size={16} /><span>{file.name}</span><button type="button" onClick={() => onRemoveFile(index)} aria-label={t(`Usuń plik: ${file.name}`, `Remove file: ${file.name}`)}><X size={16} /></button></li>)}</ul>}
          </div>
        </fieldset>
        <div className="ih-studio-editor-actions"><button type="button" className="ih-studio-button" disabled={busy} onClick={() => { onReset(); setOpen(false); }}>{t('Anuluj', 'Cancel')}</button><button type="submit" className="ih-studio-button is-primary" disabled={busy}><Save size={17} />{busy ? t('Zapisywanie…', 'Saving…') : t('Zapisz projekt', 'Save project')}</button></div>
      </Panel>
    </form>}
    <details className="ih-studio-publishing"><summary><LockKeyhole size={15} />{t('Zasady publikowania', 'Publishing guidelines')}</summary><p>{t('Dodawaj materiały, które masz prawo opublikować. Projekt możesz usunąć w każdej chwili.', 'Only add materials you have the right to publish. You can delete a project at any time.')} <Link to="/regulamin">{t('Regulamin IdeaHire', 'IdeaHire terms')}</Link>.</p></details>
  </div>;
}
