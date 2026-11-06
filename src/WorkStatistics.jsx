import React, { useEffect, useState } from 'react';
import { CheckCheck, CircleX, RefreshCw, Star, TrendingUp } from 'lucide-react';
import { supabase } from './supabase';
import { FormSelect } from './FormControls';

export default function WorkStatistics({ user, role = 'contractor', months = 6, onRole, onPeriod, en = false }) {
  const t = (pl, english) => en ? english : pl;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${user?.id || ''}:${role}:${months}:${attempt}`;
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setResult({ key, loading: true });
    async function load() {
      try {
        const { data, error } = await supabase.rpc('get_my_ideahire_work_statistics', { p_months: months, p_role: role }).abortSignal(controller.signal);
        if (error) throw error;
        if (!data || data.user_id !== user.id || data.role !== role || !Array.isArray(data.monthly)) throw new Error('Statistics unavailable');
        if (active) setResult({ key, data, loading: false });
      } catch {
        if (active) setResult({ key, error: true, loading: false });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    load();
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [key, user?.id, role, months]);

  const current = result?.key === key ? result : null;
  const data = current?.data;
  const loading = !current || current.loading;
  const locale = en ? 'en-GB' : 'pl-PL';
  const number = (value, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const money = value => new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN' }).format(value / 100);
  const date = value => new Date(value + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Warsaw' });
  const monthName = (value, full = false) => new Date(value + '-15T12:00:00Z').toLocaleDateString(locale, { month: full ? 'long' : 'short', year: 'numeric', timeZone: 'Europe/Warsaw' });
  const chart = data?.monthly.slice(-12) || [];
  const peak = Math.max(1, ...chart.flatMap(row => [row.started, row.completed]));
  const contractor = role === 'contractor';
  const metrics = data ? [
    [CheckCheck, t('Ukończone prace', 'Completed projects'), number(data.completed), t('Potwierdzone zakończenia w tym okresie', 'Confirmed completions in this period')],
    [CircleX, t('Wycofane współprace', 'Withdrawn projects'), number(data.withdrawn), t('Rezygnacje zapisane w ustaleniach', 'Withdrawals recorded in project terms')],
    [TrendingUp, t('Średnio na miesiąc', 'Monthly average'), number(data.average_per_month, 2), t('Ukończone prace / miesiące okresu', 'Completions / calendar months in the period')],
  ] : [];

  return <section className="ws-panel" aria-labelledby="ws-title" aria-busy={loading}>
    <header className="ws-heading"><div><p className="ws-eyebrow">{t('TWOJE WYNIKI', 'YOUR RESULTS')}</p><h2 id="ws-title">{t('Praca w liczbach', 'Your work, in numbers')}</h2><p>{data ? `${date(data.period_start)} – ${date(data.period_end)}` : t('Wybierz rolę i okres.', 'Choose a role and period.')}</p></div>
      <button type="button" className="ws-refresh" disabled={loading} onClick={() => setAttempt(value => value + 1)}><RefreshCw size={16} aria-hidden="true" />{t('Odśwież', 'Refresh')}</button>
    </header>
    <div className="ws-controls">
      <div className="ws-roles" role="group" aria-label={t('Statystyki według roli', 'Statistics by role')}>
        <button type="button" aria-pressed={contractor} onClick={() => onRole('contractor')}>{t('Jako wykonawca', 'As a freelancer')}</button>
        <button type="button" aria-pressed={!contractor} onClick={() => onRole('client')}>{t('Jako zlecający', 'As a client')}</button>
      </div>
      <label className="ws-period"><span>{t('Okres', 'Period')}</span><FormSelect aria-label={t('Okres statystyk', 'Statistics period')} value={months} onChange={event => onPeriod(Number(event.target.value))}>
        <option value="3">{t('3 miesiące', '3 months')}</option><option value="6">{t('6 miesięcy', '6 months')}</option><option value="12">{t('12 miesięcy', '12 months')}</option><option value="0">{t('Od początku konta', 'Since joining')}</option>
      </FormSelect></label>
    </div>
    {loading ? <div className="ws-state" role="status">{t('Wczytuję Twoje statystyki…', 'Loading your statistics…')}</div> : current?.error ? <div className="ws-state" role="alert"><h3>{t('Nie udało się wczytać statystyk.', 'Statistics could not be loaded.')}</h3><p>{t('Spróbuj odświeżyć. Niepełnych danych nie zastępujemy zerami.', 'Try refreshing. Missing data is never displayed as zero.')}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>{t('Spróbuj ponownie', 'Try again')}</button></div> : data && <>
      <div className="ws-summary">
        <section className="ws-money" aria-labelledby="ws-money-title"><p id="ws-money-title">{contractor ? t('Rozliczony zarobek', 'Settled earnings') : t('Zapłacono za zlecenia', 'Paid for projects')}</p><strong>{money(data.amount_grosz)}</strong><p>{contractor ? t('Potwierdzone przekazania na saldo Stripe, po rozliczonych zwrotach.', 'Confirmed transfers to your Stripe balance, after settled refunds.') : t('Potwierdzone płatności z prowizją, po dokonanych zwrotach.', 'Confirmed payments including fees, after completed refunds.')}</p>
          {data.test_amount_grosz > 0 && <small className="ws-test-note">{t('Osobno, w testach Stripe:', 'Separately, in Stripe test mode:')} <b>{money(data.test_amount_grosz)}</b></small>}
        </section>
        <dl className="ws-metrics">{metrics.map(([Icon, label, value, detail]) => <div key={label}><dt><Icon size={17} aria-hidden="true" />{label}</dt><dd>{value}<small>{detail}</small></dd></div>)}</dl>
      </div>
      <p className="ws-context">{t('Współprace i oceny obejmują historię konta, także próby testowe. Testowe rozliczenia Stripe pokazujemy osobno.', 'Projects and reviews include account history, including test activity. Stripe test payments are shown separately.')}</p>
      <div className="ws-analysis">
        <section className="ws-monthly" aria-labelledby="ws-monthly-title"><div className="ws-section-heading"><h3 id="ws-monthly-title">{t('Rytm Twojej pracy', 'Your work over time')}</h3><span>{t('Ustalone i w toku teraz:', 'Agreed and in progress now:')} <b>{number(data.active_now)}</b></span></div>
          <div className="ws-legend"><span><i className="is-started" />{t('Rozpoczęte rozmowy', 'New conversations')}</span><span><i />{t('Ukończone prace', 'Completed projects')}</span></div>
          {!chart.some(row => row.started || row.completed) && <p className="ws-zero">{t('Brak rozpoczętych rozmów i ukończonych prac w tym okresie.', 'No new conversations or completed projects in this period.')}</p>}
          <div className="ws-chart" style={{ '--ws-months': chart.length }}>{chart.map(row => <div className="ws-month" key={row.month} role="img" aria-label={`${monthName(row.month, true)}: ${t('rozpoczęte rozmowy', 'new conversations')} ${row.started}, ${t('ukończone prace', 'completed projects')} ${row.completed}`} title={`${monthName(row.month, true)} · ${row.started} / ${row.completed}`}>
            <div className="ws-bars" aria-hidden="true"><i className="is-started" style={{ height: `${row.started / peak * 100}%` }} /><i style={{ height: `${row.completed / peak * 100}%` }} /></div><span aria-hidden="true">{monthName(row.month)}</span>
          </div>)}</div>
          {data.monthly.length > 12 && <small>{t('Wykres pokazuje ostatnie 12 miesięcy okresu. Pełna historia jest w tabeli poniżej.', 'The chart shows the last 12 months of the period. Full history is in the table below.')}</small>}
        </section>
        <section className="ws-reviews" aria-labelledby="ws-reviews-title"><h3 id="ws-reviews-title">{contractor ? t('Twoje oceny', 'Your reviews') : t('Wystawione oceny', 'Reviews you gave')}</h3>
          <div className="ws-rating"><Star aria-hidden="true" /><strong>{data.average_rating == null ? '—' : number(data.average_rating, 2)}</strong><span>/ 5</span></div><p>{data.review_count ? `${number(data.review_count)} ${t('ocen w wybranym okresie', 'reviews in this period')}` : t('Jeszcze bez ocen w tym okresie.', 'No reviews in this period yet.')}</p>
          <dl className="ws-rating-bars">{data.rating_distribution.map(row => <div key={row.rating}><dt>{row.rating}<Star size={12} aria-hidden="true" /></dt><dd><i><b style={{ width: `${data.review_count ? row.count / data.review_count * 100 : 0}%` }} /></i><span>{number(row.count)}</span></dd></div>)}</dl>
        </section>
      </div>
      <details className="ws-method"><summary>{t('Dane miesięczne i sposób liczenia', 'Monthly data and how we count')}</summary><div className="ws-table-scroll"><table><caption>{t('Miesięczne wyniki wybranej roli', 'Monthly results for the selected role')}</caption><thead><tr>{[t('Miesiąc', 'Month'),t('Rozmowy', 'Conversations'),t('Ukończone', 'Completed'),t('Wycofane', 'Withdrawn')].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{data.monthly.map(row => <tr key={row.month}><th scope="row">{monthName(row.month, true)}</th><td>{number(row.started)}</td><td>{number(row.completed)}</td><td>{number(row.withdrawn)}</td></tr>)}</tbody></table></div>
        <ul><li>{t('Ukończone prace liczymy po zapisanym potwierdzeniu zakończenia, nie po samym rozpoczęciu rozmowy.', 'Completed projects require a recorded completion, not just a conversation.')}</li><li>{t('Wycofane współprace to rezygnacje zapisane w ustaleniach. Nie zaliczamy tu wygasłych ogłoszeń ani anulowanych prób płatności.', 'Withdrawn projects are withdrawals recorded in project terms. Expired listings and cancelled checkout attempts are excluded.')}</li><li>{t('Średnia miesięczna to ukończone prace podzielone przez miesiące kalendarzowe okresu, z bieżącym miesiącem włącznie. Daty liczymy według czasu w Polsce.', 'The monthly average divides completed projects by calendar months in the period, including this month. Dates use Polish local time.')}</li><li>{t('Średnia ocena obejmuje widoczne opinie w wybranym okresie. Ukryte opinie nie wchodzą do wyniku.', 'The average rating includes visible reviews in the selected period. Hidden reviews are excluded.')}</li><li>{t('Rozliczony zarobek dotyczy potwierdzonych przekazań na saldo Stripe. Nie jest potwierdzeniem wypłaty na rachunek bankowy ani wyliczeniem dochodu podatkowego.', 'Settled earnings are confirmed transfers to your Stripe balance. They are not confirmation of a bank payout or a calculation of taxable income.')}</li></ul>
      </details>
    </>}
  </section>;
}
