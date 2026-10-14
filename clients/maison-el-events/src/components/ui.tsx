import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
const VARIANTS: Record<Variant, string> = {
  // Action principale : pilule dorée ; les autres au trait, sur fond translucide.
  primary: 'bg-brand text-navy shadow-gold hover:bg-gold-light hover:-translate-y-px',
  secondary: 'border border-white/35 bg-white/[.06] text-white backdrop-blur hover:border-brand hover:text-brand',
  ghost: 'text-ash hover:text-brand',
  danger: 'border border-danger/60 text-danger hover:bg-danger hover:text-navy',
  light: 'border border-brand/60 text-brand hover:bg-brand hover:text-navy',
};
const SIZES = { sm: 'h-9 px-4 gap-1.5 text-[12.5px]', md: 'h-11 px-6 gap-2 text-[13.5px]', lg: 'h-[52px] px-8 gap-2.5 text-[14px]' };
const BTN = 'inline-flex items-center justify-center rounded-full font-semibold tracking-[.02em] transition-all duration-300 ease-lux disabled:cursor-not-allowed disabled:opacity-40 active:scale-[.98]';

export function Button({ variant = 'primary', size = 'md', icon, iconRight, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName }) {
  return (
    <button type="button" className={cx(BTN, SIZES[size], VARIANTS[variant], className)} {...rest}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
      {iconRight && <Icon name={iconRight} className="h-4 w-4" />}
    </button>
  );
}

export function LinkButton({ href, variant = 'primary', size = 'md', className, children, icon, iconRight, ...rest }: { href: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; className?: string; children: ReactNode; icon?: IconName; iconRight?: IconName; target?: string; rel?: string; onClick?: () => void }) {
  return (
    <a href={href} className={cx(BTN, 'no-underline', SIZES[size], VARIANTS[variant], className)} {...rest}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
      {iconRight && <Icon name={iconRight} className="h-4 w-4" />}
    </a>
  );
}

export function IconButton({ icon, label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('inline-grid h-9 w-9 place-items-center rounded-full text-brun-2 transition hover:bg-white/10 hover:text-brand disabled:opacity-30', className)} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

// Champs
export function Field({ label, hint, error, children, className, required }: { label: string; hint?: string; error?: string; children: (id: string, describedBy?: string) => ReactNode; className?: string; required?: boolean }) {
  const id = useId();
  const hintId = hint ? id + '-h' : undefined, errId = error ? id + '-e' : undefined;
  const by = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mono mb-2 block text-ash">
        {label}{required && <span className="text-brand" aria-hidden="true"> *</span>}
      </label>
      {children(id, by)}
      {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-brun-3">{hint}</p>}
      {error && <p id={errId} className="mt-1.5 text-xs font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-ctl border border-white/15 bg-navy-card px-3.5 text-[15px] text-white placeholder:text-smoke transition focus:border-brand focus:outline-none focus:ring-0 aria-[invalid=true]:border-danger [color-scheme:dark]';
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx(inputCls, 'h-11', className)} {...p} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cx(inputCls, 'h-11 pr-8', className)} {...p}>{children}</select>;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cx(inputCls, 'min-h-[96px] py-2.5 leading-relaxed', className)} {...p} />;

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ring-1 ring-inset transition', checked ? 'bg-brand ring-brand' : 'bg-transparent ring-smoke')}>
      <span className={cx('inline-block h-4 w-4 rounded-full transition', checked ? 'translate-x-[24px] bg-black' : 'translate-x-1 bg-smoke')} />
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'demo'; className?: string }) {
  const t = {
    neutral: 'text-brun-2 ring-frost/20',
    brand: 'text-brand ring-brand/60',
    ok: 'text-ok ring-ok/40',
    warn: 'text-warn ring-warn/40',
    danger: 'text-danger ring-danger/40',
    demo: 'text-smoke ring-smoke/60',
  }[tone];
  return <span className={cx('mono inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] !text-[10px] !tracking-[.14em] ring-1 ring-inset', t, className)}>{children}</span>;
}

export const FictifBadge = () => <Badge tone="demo">Fictif</Badge>;

export function EmptyState({ icon = 'info', title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-card border border-dashed border-frost/20 px-6 py-10 text-center">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-ctl ring-1 ring-frost/30 text-brand"><Icon name={icon} /></span>
      <p className="text-xl text-brun">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-brun-2">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Fenêtre modale accessible : Échap ferme, focus déplacé puis rendu.
export function Modal({ open, onClose, title, children, footer, size = 'md', side = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; side?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => { const el = ref.current?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea, button'); el?.focus(); }, 30);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open]);
  if (!open) return null;
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/75 animate-fade" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} data-lenis-prevent
        className={cx('relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card border border-frost/20 bg-black animate-rise sm:rounded-card', w, side && 'sm:ml-auto sm:mr-0 sm:h-[100dvh] sm:max-h-none sm:rounded-none sm:border-y-0 sm:border-r-0')}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-[22px] font-normal leading-tight tracking-[-.03em] text-brun">{title}</h2>
          <IconButton icon="x" label="Fermer" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

// Confirmation (remplace confirm(), indisponible dans l'aperçu)
interface ConfirmOpts { title: string; message: ReactNode; confirm?: string; danger?: boolean }
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

// Messages éphémères
type Toast = { id: number; text: string; tone: 'ok' | 'info' | 'error' };
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [req, setReq] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setReq({ ...o, resolve })), []);
  const close = (v: boolean) => { req?.resolve(v); setReq(null); };
  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <Modal open={!!req} onClose={() => close(false)} title={req?.title ?? ''} size="sm"
          footer={<><Button variant="secondary" onClick={() => close(false)}>Annuler</Button><Button variant={req?.danger ? 'danger' : 'primary'} onClick={() => close(true)} data-autofocus>{req?.confirm ?? 'Confirmer'}</Button></>}>
          <div className="text-[15px] leading-relaxed text-brun-2">{req?.message}</div>
        </Modal>
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={cx('pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border px-5 py-3 text-sm shadow-deep animate-rise', t.tone === 'error' ? 'border-danger bg-danger text-navy' : 'border-brand/50 bg-navy-surface text-white')}>
              <Icon name={t.tone === 'error' ? 'info' : 'check'} className="h-4 w-4 shrink-0" />{t.text}
            </div>
          ))}
        </div>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

/** Titre d'affiche en Cormorant Garamond, une ligne par élément ; `brand` met une ligne en italique doré. */
export function Display({ lines, as: H = 'h2', className, id, brand, hidden }: { lines: ReactNode[]; as?: 'h1' | 'h2' | 'h3' | 'p'; className?: string; id?: string; marks?: number[]; brand?: number; hidden?: boolean }) {
  return (
    <H id={id} className={cx('display', className)} aria-hidden={hidden || undefined}>
      {lines.map((l, i) => <span key={i} className={cx('mark', brand === i && 'italic text-brand')}>{l}{' '}</span>)}
    </H>
  );
}

export function SectionTitle({ eyebrow, title, children, align = 'left', as: H = 'h2' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; align?: 'left' | 'center'; as?: 'h1' | 'h2' }) {
  return (
    <div className={cx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className="mono mb-4 text-ash">{eyebrow}</p>}
      <H className="font-serif text-[2.6rem] leading-[1.1] text-brun sm:text-[54px]">{title}</H>
      {children && <div className={cx('mt-5 max-w-[600px] text-[17px] leading-[1.45] text-brun-2', align === 'center' && 'mx-auto')}>{children}</div>}
    </div>
  );
}

/** Sur-titre : filet doré, numéro éventuel, petites capitales espacées. */
export const Eyebrow = ({ n, children, className }: { n?: number | string; children: ReactNode; className?: string }) => (
  <p className={cx('mono flex items-center gap-3 text-brand', className)}><span aria-hidden="true" className="h-[1.5px] w-8 shrink-0 bg-brand" />{n != null && <span>{typeof n === 'number' ? String(n).padStart(2, '0') : n}</span>}<span>{children}</span></p>
);
