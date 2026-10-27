import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';

// Listings and services share the same reading order at every screen width.
export function OwnedListingCard({ title, category, description, status, inactive = false, price, detail, note, actions, busy = false }) {
  return <article className="ih-owned-card" aria-busy={busy || undefined}>
    <header className="ih-owned-card-header"><span>{category}</span><span className={'ih-owned-status' + (inactive ? ' is-inactive' : '')}>{status}</span></header>
    <div className="ih-owned-card-copy"><h2>{title}</h2>{description && <p>{description}</p>}</div>
    {(price || detail) && <div className="ih-owned-card-meta">{price && <strong>{price}</strong>}{detail && <span>{detail}</span>}</div>}
    <footer className="ih-owned-card-footer">{note && <p>{note}</p>}<div className="ih-owned-card-actions">{actions}</div></footer>
  </article>;
}

export function OwnedListingsEmpty({ title, description, to, action }) {
  return <div className="ih-owned-empty">
    <span className="ih-owned-empty-mark" aria-hidden="true"><FileText size={24} strokeWidth={1.7} /></span>
    <h2>{title}</h2><p>{description}</p>
    <Link to={to}>{action}<ArrowRight size={18} strokeWidth={1.7} aria-hidden="true" /></Link>
  </div>;
}
