import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-cream hover:bg-brand-deep shadow-soft',
  secondary: 'bg-white text-brun ring-1 ring-inset ring-line hover:ring-champagne-deep/60 hover:bg-cream',
  ghost: 'text-brun-2 hover:bg-brand-soft hover:text-brand',
  danger: 'bg-white text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger hover:text-white',
  light: 'bg-cream/95 text-brand hover:bg-white',
};

export function Button({ variant = 'primary', size = 'md', icon, iconRight, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName }) {
  const sz = size === 'sm' ? 'h-9 px-3.5 text-[13px] gap-1.5' : size === 'lg' ? 'h-[52px] px-7 text-[15px] gap-2.5' : 'h-11 px-5 text-sm gap-2';
  return (
    <button type="button" className={cx('inline-flex items-center justify-center rounded-full font-medium tracking-[.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]', sz, VARIANTS[variant], className)} {...rest}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
      {iconRight && <Icon name={iconRight} className="h-4 w-4" />}
    </button>
  );
}

export function LinkButton({ href, variant = 'primary', size = 'md', className, children, icon, iconRight, ...rest }: { href: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; className?: string; children: ReactNode; icon?: IconName; iconRight?: IconName; target?: string; rel?: string; onClick?: () => void }) {
  const sz = size === 'sm' ? 'h-9 px-3.5 text-[13px] gap-1.5' : size === 'lg' ? 'h-[52px] px-7 text-[15px] gap-2.5' : 'h-11 px-5 text-sm gap-2';
  return (
    <a href={href} className={cx('inline-flex items-center justify-center rounded-full font-medium tracking-[.01em] no-underline transition duration-200 active:scale-[.98]', sz, VARIANTS[variant], className)} {...rest}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
      {iconRight && <Icon name={iconRight} className="h-4 w-4" />}
    </a>
  );
}

export function IconButton({ icon, label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('inline-grid h-9 w-9 place-items-center rounded-full text-brun-2 transition hover:bg-brand-soft hover:text-brand', className)} {...rest}>
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
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-brun-2">
        {label}{required && <span className="text-brand" aria-hidden="true"> *</span>}
      </label>
      {children(id, by)}
      {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-brun-3">{hint}</p>}
      {error && <p id={errId} className="mt-1.5 text-xs font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-brun placeholder:text-brun-3/70 transition focus:border-brand/50 focus:outline-none focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-danger/60';
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx(inputCls, 'h-11', className)} {...p} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cx(inputCls, 'h-11 pr-8', className)} {...p}>{children}</select>;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cx(inputCls, 'min-h-[96px] py-2.5 leading-relaxed', className)} {...p} />;

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition', checked ? 'bg-brand' : 'bg-brun-3/30')}>
      <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'demo'; className?: string }) {
  const t = {
    neutral: 'bg-ivoire text-brun-2 ring-line',
    brand: 'bg-brand-soft text-brand ring-brand/15',
    ok: 'bg-[#EAF3EE] text-ok ring-ok/15',
    warn: 'bg-[#FBF1DF] text-warn ring-warn/20',
    danger: 'bg-[#F8E7E7] text-danger ring-danger/15',
    demo: 'bg-[#FBF1DF] text-warn ring-warn/25',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset', t, className)}>{children}</span>;
}

export const FictifBadge = () => <Badge tone="demo">Fictif</Badge>;

export function EmptyState({ icon = 'info', title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-cream/60 px-6 py-10 text-center">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand"><Icon name={icon} /></span>
      <p className="font-serif text-xl text-brun">{title}</p>
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
      <div className="absolute inset-0 bg-brun/40 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cx('relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-cream shadow-lift sm:rounded-3xl animate-rise', w, side && 'sm:ml-auto sm:mr-0 sm:h-[100dvh] sm:max-h-none sm:rounded-none sm:rounded-l-3xl')}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <h2 id={titleId} className="font-serif text-[22px] font-medium leading-tight text-brun">{title}</h2>
          <IconButton icon="x" label="Fermer" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white/60 px-5 py-3.5 sm:px-6">{footer}</div>}
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
            <div key={t.id} className={cx('pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm shadow-lift animate-rise', t.tone === 'error' ? 'bg-danger text-white' : 'bg-brun text-cream')}>
              <Icon name={t.tone === 'error' ? 'info' : 'check'} className="h-4 w-4 shrink-0" />{t.text}
            </div>
          ))}
        </div>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

export function SectionTitle({ eyebrow, title, children, align = 'left', as: H = 'h2' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; align?: 'left' | 'center'; as?: 'h1' | 'h2' }) {
  return (
    <div className={cx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className={cx('mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.28em] text-champagne-deep', align === 'center' && 'justify-center')}><span className="h-px w-8 bg-champagne-deep/60" />{eyebrow}{align === 'center' && <span className="h-px w-8 bg-champagne-deep/60" />}</p>}
      <H className="font-serif text-[2.35rem] font-medium leading-[1.05] text-brun sm:text-5xl">{title}</H>
      {children && <div className="mt-4 text-[15.5px] leading-relaxed text-brun-2">{children}</div>}
    </div>
  );
}

export const Ornament = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 12" className={cx('h-3 w-28 text-champagne-deep', className)} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M0 6h48M72 6h48" /><path d="M60 1l5 5-5 5-5-5z" /><circle cx="52" cy="6" r="1" fill="currentColor" /><circle cx="68" cy="6" r="1" fill="currentColor" />
  </svg>
);
