import React, { Children, forwardRef, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FormControls.css';

function plainText(value) {
  return Children.toArray(value).map(child => isValidElement(child) ? plainText(child.props.children) : String(child)).join('');
}

function readOptions(children, inheritedDisabled = false, group = '') {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) return [];
    if (child.type === 'option') {
      const label = child.props.label || plainText(child.props.children);
      return [{ value: String(child.props.value ?? label), label, group, disabled: inheritedDisabled || !!child.props.disabled }];
    }
    return readOptions(child.props.children, inheritedDisabled || !!child.props.disabled, child.type === 'optgroup' ? child.props.label : group);
  });
}

/* The native field keeps form values and validation; the visible list uses the
   same themed surface everywhere, including forms and portalled dialogs. */
export const FormSelect = forwardRef(function FormSelect({
  id, label, children, value, defaultValue, onChange, onBlur, onInvalid,
  disabled = false, required = false, className = '', style, ...props
}, forwardedRef) {
  const generatedId = useId();
  const controlId = id || `ih-select-${generatedId}`;
  const root = useRef(null), field = useRef(null), trigger = useRef(null), menu = useRef(null);
  const options = readOptions(children);
  const [localValue, setLocalValue] = useState(() => String(defaultValue ?? options[0]?.value ?? ''));
  const currentValue = String(value ?? localValue);
  const selectedIndex = options.findIndex(option => option.value === currentValue);
  const selected = options[selectedIndex];
  const [open, setOpen] = useState(false), [focused, setFocused] = useState(0), [invalid, setInvalid] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12, width: 200, height: 300 });
  const [externalLabel, setExternalLabel] = useState('');
  const typing = useRef({ text: '', at: 0 });
  const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
  const english = typeof document !== 'undefined' && document.documentElement.lang === 'en';
  const assignField = useCallback(node => {
    field.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  useLayoutEffect(() => {
    const enclosing = root.current?.closest('label');
    if (!enclosing || label || props['aria-label'] || props['aria-labelledby']) return;
    const copy = enclosing.cloneNode(true);
    copy.querySelectorAll('.ih-control-select,small,input,textarea,button,select').forEach(node => node.remove());
    setExternalLabel(copy.textContent.trim());
  }, [label, props['aria-label'], props['aria-labelledby']]);

  const locate = useCallback(() => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const viewport = window.visualViewport;
    const x = viewport?.offsetLeft || 0, y = viewport?.offsetTop || 0;
    const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
    const margin = 10, gap = 6;
    const desired = Math.min(320, Math.max(48, options.length * 44 + 12));
    const below = y + height - rect.bottom - margin - gap;
    const above = rect.top - y - margin - gap;
    const upward = below < Math.min(desired, 180) && above > below;
    const available = Math.max(44, upward ? above : below);
    const listHeight = Math.min(desired, available);
    const listWidth = Math.max(1, Math.min(rect.width, width - margin * 2));
    setPosition({
      left: Math.max(x + margin, Math.min(rect.left + (rect.width - listWidth) / 2, x + width - margin - listWidth)),
      top: upward ? Math.max(y + margin, rect.top - gap - listHeight) : rect.bottom + gap,
      width: listWidth, height: listHeight,
    });
  }, [options.length]);

  function show(last = false) {
    if (disabled || trigger.current?.matches(':disabled') || !enabled.length) return;
    locate();
    setFocused(last ? enabled.at(-1) : enabled.includes(selectedIndex) ? selectedIndex : enabled[0]);
    setOpen(true);
  }
  function close() { setOpen(false); typing.current = { text: '', at: 0 }; }
  function choose(index) {
    const option = options[index];
    if (!option || option.disabled || disabled || field.current?.matches(':disabled')) return;
    setLocalValue(option.value);
    setInvalid(false);
    if (field.current) {
      field.current.value = option.value;
      onChange?.({ type: 'change', target: field.current, currentTarget: field.current, preventDefault() {}, stopPropagation() {} });
    }
    close();
    trigger.current?.focus({ preventScroll: true });
  }
  function keyboard(event) {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(event.key === 'End'); return; }
      const index = enabled.indexOf(focused);
      setFocused(event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : enabled[(index + (event.key === 'ArrowUp' ? -1 : 1) + enabled.length) % enabled.length]);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (open) choose(focused); else show(); return; }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      const normalize = text => text.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
      const now = Date.now();
      const typed = `${now - typing.current.at < 700 ? typing.current.text : ''}${event.key}`;
      typing.current = { text: typed, at: now };
      const index = enabled.find(index => normalize(options[index].label).startsWith(normalize(typed)));
      if (index !== undefined) { if (!open) show(); setFocused(index); }
    }
  }

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    const form = field.current?.form;
    const reset = () => { setLocalValue(String(defaultValue ?? options[0]?.value ?? '')); setInvalid(false); close(); };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [defaultValue, options[0]?.value]);
  useLayoutEffect(() => {
    if (!open) return;
    const active = document.getElementById(`${controlId}-option-${focused}`);
    if (active && menu.current) {
      const item = active.getBoundingClientRect(), list = menu.current.getBoundingClientRect();
      if (item.top < list.top + 6) menu.current.scrollTop += item.top - list.top - 6;
      else if (item.bottom > list.bottom - 6) menu.current.scrollTop += item.bottom - list.bottom + 6;
    }
  }, [open, focused, controlId]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target) && !menu.current?.contains(event.target)) close(); };
    const scroll = event => { if (!menu.current?.contains(event.target)) locate(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', locate);
    window.visualViewport?.addEventListener('resize', locate);
    window.visualViewport?.addEventListener('scroll', locate);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', locate);
      window.visualViewport?.removeEventListener('resize', locate);
      window.visualViewport?.removeEventListener('scroll', locate);
    };
  }, [open, locate]);

  useLayoutEffect(() => {
    const popup = menu.current;
    if (!open || !popup || typeof popup.showPopover !== 'function') return;
    try { if (!popup.matches(':popover-open')) popup.showPopover(); } catch { /* The dialog may have closed in the same frame. */ }
    return () => { try { if (popup.matches(':popover-open')) popup.hidePopover(); } catch { /* Removed popup. */ } };
  }, [open]);

  const dialogHost = root.current?.closest('dialog[open]');
  const menuHost = dialogHost || document.body;
  const topLayerAvailable = typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function';
  const inlineMenu = Boolean(dialogHost && !topLayerAvailable);
  const name = label || props['aria-label'] || externalLabel || (english ? 'Choose an option' : 'Wybierz opcję');
  const description = [props['aria-describedby'], invalid ? `${controlId}-error` : ''].filter(Boolean).join(' ') || undefined;
  const optionsMenu = <div ref={menu} id={`${controlId}-listbox`} className="ih-control-options" popover={topLayerAvailable ? "manual" : undefined} data-inline={inlineMenu || undefined} role="listbox" aria-label={name} data-no-translate="true"
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.height }} onMouseDown={event => event.preventDefault()}>
      {options.map((option, index) => <React.Fragment key={`${option.value}-${index}`}>
        {option.group && option.group !== options[index - 1]?.group && <div className="ih-control-group" role="presentation">{option.group}</div>}
        <div id={`${controlId}-option-${index}`} role="option" aria-selected={option.value === currentValue} aria-disabled={option.disabled || undefined}
          className={`ih-control-option${index === focused ? ' is-focused' : ''}`} onPointerMove={event => event.pointerType === "mouse" && !option.disabled && setFocused(index)} onClick={() => choose(index)}>
          <span>{option.label}</span>{option.value === currentValue && <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>}
        </div>
      </React.Fragment>)}
    </div>;
  return <span ref={root} className={`ih7-select ih-control-select ${className}`} style={style} data-open={open}>
    {label && <span id={`${controlId}-label`} className="ih7-select-label">{label}</span>}
    <select {...props} ref={assignField} id={`${controlId}-native`} className="ih-control-native" value={currentValue} disabled={disabled} required={required} tabIndex={-1} aria-hidden="true"
      onChange={event => { setLocalValue(event.target.value); setInvalid(false); onChange?.(event); }}
      onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); onInvalid?.(event); }}>{children}</select>
    <button ref={trigger} id={controlId} type="button" className="ih7-select-trigger ih-control-trigger" role="combobox" disabled={disabled}
      aria-expanded={open} aria-controls={open ? `${controlId}-listbox` : undefined} aria-haspopup="listbox" aria-required={required || undefined}
      aria-invalid={invalid || props['aria-invalid']} aria-label={props['aria-labelledby'] ? undefined : name} aria-labelledby={props['aria-labelledby']}
      aria-describedby={description} aria-activedescendant={open ? `${controlId}-option-${focused}` : undefined}
      onKeyDown={keyboard} onClick={() => open ? close() : show()} onBlur={event => { if (!menu.current?.contains(event.relatedTarget)) close(); onBlur?.(event); }}>
      <span>{selected?.label || (english ? 'Choose' : 'Wybierz')}</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
    </button>
    {invalid && <small id={`${controlId}-error`} className="ih-control-error" role="alert">{english ? 'Choose an option.' : 'Wybierz jedną z opcji.'}</small>}
    {open && (inlineMenu ? optionsMenu : createPortal(optionsMenu, menuHost))}
  </span>;
});

export const AutoTextarea = forwardRef(function AutoTextarea({ onInput, className = '', ...props }, forwardedRef) {
  const field = useRef(null);
  const fit = useCallback(() => {
    const node = field.current;
    if (!node?.getClientRects().length) return;
    node.style.setProperty('resize', 'none', 'important');
    node.style.setProperty('max-height', 'none', 'important');
    node.style.setProperty('overflow-y', 'hidden', 'important');
    node.style.setProperty('height', 'auto', 'important');
    const border = node.offsetHeight - node.clientHeight;
    node.style.setProperty('height', `${node.scrollHeight + Math.max(0, border)}px`, 'important');
  }, []);
  const assign = useCallback(node => {
    field.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);
  useLayoutEffect(fit, [fit, props.value, props.defaultValue, props.rows]);
  useEffect(() => {
    let width = -1;
    const observer = window.ResizeObserver ? new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width;
      if (next !== width) { width = next; fit(); }
    }) : null;
    if (field.current) observer?.observe(field.current);
    window.addEventListener('resize', fit);
    return () => { observer?.disconnect(); window.removeEventListener('resize', fit); };
  }, [fit]);
  return <textarea {...props} ref={assign} className={`ih-auto-textarea ${className}`} onInput={event => { fit(); onInput?.(event); }} />;
});
