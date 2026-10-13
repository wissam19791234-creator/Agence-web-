import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, cx, Field, Input, Select, Textarea, useToast } from '../components/ui';
import { createProspect } from '../lib/actions';
import { EVENT_TYPES, SERVICE_KEYS, SERVICE_LABELS } from '../lib/constants';
import { fmtDate, isEmail, isPhone, todayISO, uid } from '../lib/format';
import { useImages } from '../lib/images';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { EventType, ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { PageHead } from './Pages';

const STEPS = ['Vous', 'Votre événement', 'Prestations', 'Inspirations', 'Récapitulatif'];

interface Form {
  firstName: string; lastName: string; email: string; phone: string;
  eventType: EventType | ''; eventDate: string; place: string; guests: string;
  services: ServiceKey[]; budget: string; needs: string;
}
const EMPTY: Form = { firstName: '', lastName: '', email: '', phone: '', eventType: '', eventDate: '', place: '', guests: '', services: [], budget: '', needs: '' };

function validate(step: number, f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (f.firstName.trim().length < 2) e.firstName = 'Indiquez votre prénom.';
    if (f.lastName.trim().length < 2) e.lastName = 'Indiquez votre nom.';
    if (!f.email.trim()) e.email = 'Indiquez votre adresse e-mail pour recevoir la proposition.';
    else if (!isEmail(f.email)) e.email = 'Adresse e-mail invalide (exemple : nom@domaine.fr).';
    if (f.phone.trim() && !isPhone(f.phone)) e.phone = 'Numéro invalide : 10 chiffres attendus (exemple : 06 12 34 56 78).';
  }
  if (step === 1) {
    if (!f.eventType) e.eventType = 'Choisissez le type d’événement.';
    if (!f.eventDate) e.eventDate = 'Indiquez la date souhaitée.';
    else if (f.eventDate < todayISO()) e.eventDate = 'La date doit être aujourd’hui ou plus tard.';
    if (f.place.trim().length < 2) e.place = 'Indiquez la ville ou le lieu de réception.';
    const g = Number(f.guests);
    if (!f.guests) e.guests = 'Indiquez un nombre d’invités estimé.';
    else if (!Number.isInteger(g) || g < 1 || g > 2000) e.guests = 'Entre 1 et 2 000 invités.';
  }
  if (step === 2) {
    if (!f.services.length) e.services = 'Choisissez au moins une prestation.';
    if (f.needs.length > 1500) e.needs = '1 500 caractères maximum.';
  }
  return e;
}

export default function QuoteRequest() {
  const { update } = useStore();
  const { prefill, setPrefill, setOpenProspect, tour, setTour } = useUi();
  const images = useImages();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [tmp] = useState(() => uid('insp'));
  const top = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!prefill) return;
    setF((x) => ({
      ...x, ...Object.fromEntries(Object.entries(prefill).filter(([, val]) => val != null && val !== '')),
      guests: prefill.guests ? String(prefill.guests) : x.guests,
      services: prefill.services?.length ? prefill.services : x.services,
    } as Form));
    setDone(null);
    if (prefill.firstName && prefill.email && prefill.eventDate) setStep(4); // exemple complet du parcours guidé
    setPrefill(null);
  }, [prefill, setPrefill]);

  const set = <K extends keyof Form>(k: K, val: Form[K]) => { setF((x) => ({ ...x, [k]: val })); if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };
  const goto = (n: number) => { setStep(n); setErrors({}); top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const next = () => {
    const e = validate(step, f);
    setErrors(e);
    if (Object.keys(e).length) { setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [data-err]')?.focus(), 30); return; }
    goto(step + 1);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const list = [...files].slice(0, 4 - photos.length);
    if (files.length > list.length) toast('4 photos maximum : les suivantes ont été ignorées.', 'info');
    setBusy(true);
    for (const file of list) {
      const key = `${tmp}-${uid()}`;
      try { await images.set(key, file); setPhotos((p) => [...p, key]); }
      catch (e) { toast((e as Error).message, 'error'); }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = () => {
    for (let s = 0; s < 3; s++) { const e = validate(s, f); if (Object.keys(e).length) { setErrors(e); setStep(s); return; } }
    let id = '';
    update((d) => {
      id = createProspect(d, {
        firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim(),
        eventType: f.eventType as EventType, eventDate: f.eventDate, place: f.place.trim(), guests: Number(f.guests),
        services: f.services, budget: f.budget.trim(), needs: f.needs.trim(), source: 'site', inspirationIds: photos,
      }, 'Demande reçue depuis le formulaire du site.');
    });
    setDone(id);
    if (tour.active) setTour({ prospectId: id });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (done) {
    return (
      <>
        <PageHead eyebrow="Demande de devis" title="Merci, votre demande est enregistrée" />
        <section ref={top} className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="check" className="h-8 w-8" /></span>
          <p className="mt-6 font-serif text-3xl text-brun">Demande enregistrée dans la démonstration</p>
          <p className="mt-4 text-[15px] leading-relaxed text-brun-2">Elle apparaît maintenant comme <strong>nouveau prospect</strong> dans l’espace professionnel. Aucun message n’a été envoyé à l’entreprise : en production, la demande lui sera transmise par e-mail une fois l’envoi configuré.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button icon="kanban" onClick={() => { setOpenProspect(done); navigate('pro-prospects'); }}>Voir la demande dans l’espace pro</Button>
            <Button variant="secondary" onClick={() => { setF(EMPTY); setPhotos([]); setStep(0); setDone(null); }}>Nouvelle demande</Button>
          </div>
        </section>
      </>
    );
  }

  const err = (k: string) => errors[k];
  return (
    <>
      <PageHead eyebrow="Demande de devis" title="Créons votre événement">Quelques étapes suffisent. Les champs marqués d’un astérisque sont obligatoires.</PageHead>
      <section ref={top} className="mx-auto max-w-3xl scroll-mt-24 px-4 py-12 sm:px-6">
        <ol className="mb-8 grid grid-cols-5 gap-2" aria-label="Étapes du formulaire">
          {STEPS.map((s, i) => (
            <li key={s} className="min-w-0">
              <button type="button" disabled={i > step} onClick={() => i < step && goto(i)} aria-current={i === step ? 'step' : undefined} className="group block w-full text-left disabled:cursor-default">
                <span className={cx('block h-1 rounded-full transition', i <= step ? 'bg-brand' : 'bg-line')} />
                <span className={cx('mt-2 hidden truncate text-xs sm:block', i === step ? 'font-medium text-brand' : 'text-brun-3')}>{i + 1}. {s}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mb-6 text-sm text-brun-3 sm:hidden">Étape {step + 1} sur 5 · {STEPS[step]}</p>

        <div className="rounded-[26px] border border-line bg-white p-6 shadow-soft sm:p-9">
          <h2 className="mb-6 font-serif text-3xl text-brun">{STEPS[step]}</h2>

          {step === 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Prénom" required error={err('firstName')}>{(id, by) => <Input id={id} value={f.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" aria-invalid={!!err('firstName')} aria-describedby={by} />}</Field>
              <Field label="Nom" required error={err('lastName')}>{(id, by) => <Input id={id} value={f.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" aria-invalid={!!err('lastName')} aria-describedby={by} />}</Field>
              <Field label="Adresse e-mail" required error={err('email')}>{(id, by) => <Input id={id} type="email" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" aria-invalid={!!err('email')} aria-describedby={by} />}</Field>
              <Field label="Téléphone" hint="Facultatif" error={err('phone')}>{(id, by) => <Input id={id} type="tel" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" aria-invalid={!!err('phone')} aria-describedby={by} />}</Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Type d'événement" required error={err('eventType')}>{(id, by) => <Select id={id} value={f.eventType} onChange={(e) => set('eventType', e.target.value as EventType)} aria-invalid={!!err('eventType')} aria-describedby={by}><option value="">Choisir…</option>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
              <Field label="Date souhaitée" required error={err('eventDate')}>{(id, by) => <Input id={id} type="date" min={todayISO()} value={f.eventDate} onChange={(e) => set('eventDate', e.target.value)} aria-invalid={!!err('eventDate')} aria-describedby={by} />}</Field>
              <Field label="Ville ou lieu de réception" required error={err('place')}>{(id, by) => <Input id={id} value={f.place} placeholder="Ex. Orléans" onChange={(e) => set('place', e.target.value)} aria-invalid={!!err('place')} aria-describedby={by} />}</Field>
              <Field label="Nombre estimé d'invités" required error={err('guests')}>{(id, by) => <Input id={id} inputMode="numeric" value={f.guests} placeholder="Ex. 80" onChange={(e) => set('guests', e.target.value.replace(/[^\d]/g, ''))} aria-invalid={!!err('guests')} aria-describedby={by} />}</Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <fieldset>
                <legend className="mb-3 text-[13px] font-medium text-brun-2">Prestations souhaitées<span className="text-brand"> *</span></legend>
                <div className="grid gap-2 sm:grid-cols-2" data-err={err('services') ? true : undefined} tabIndex={err('services') ? -1 : undefined}>
                  {SERVICE_KEYS.map((k) => {
                    const on = f.services.includes(k);
                    return (
                      <label key={k} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition', on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-brun hover:border-champagne-deep/50')}>
                        <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={on} onChange={() => set('services', on ? f.services.filter((x) => x !== k) : [...f.services, k])} />
                        {SERVICE_LABELS[k]}
                      </label>
                    );
                  })}
                </div>
                {err('services') && <p className="mt-2 text-xs font-medium text-danger" role="alert">{err('services')}</p>}
              </fieldset>
              <Field label="Budget indicatif" hint="Facultatif, par exemple « environ 1 500 € »">{(id) => <Input id={id} value={f.budget} onChange={(e) => set('budget', e.target.value)} />}</Field>
              <Field label="Besoins spécifiques" hint="Thème, couleurs, contraintes du lieu, horaires…" error={err('needs')}>{(id, by) => <Textarea id={id} rows={5} value={f.needs} onChange={(e) => set('needs', e.target.value)} aria-invalid={!!err('needs')} aria-describedby={by} />}</Field>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-brun-2">Facultatif : ajoutez jusqu’à 4 photos d’inspiration (JPG, PNG ou WebP). Elles restent dans votre navigateur pour cette démonstration.</p>
              <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} aria-label="Ajouter des photos d'inspiration" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((k) => (
                  <div key={k} className="group relative aspect-square overflow-hidden rounded-2xl bg-ivoire">
                    <img src={images.get(k)} alt="Photo d'inspiration ajoutée" className="h-full w-full object-cover" />
                    <button type="button" aria-label="Retirer cette photo" onClick={() => { images.remove(k); setPhotos((p) => p.filter((x) => x !== k)); }} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-cream/95 text-brun shadow"><Icon name="x" className="h-4 w-4" /></button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-2xl border border-dashed border-champagne-deep/50 bg-cream text-sm text-brun-2 transition hover:border-brand hover:text-brand">
                    <span className="grid justify-items-center gap-2"><Icon name="upload" className="h-6 w-6" />{busy ? 'Import en cours…' : 'Ajouter une photo'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {[
                ['Contact', `${f.firstName} ${f.lastName}`], ['E-mail', f.email], ['Téléphone', f.phone || 'Non renseigné'],
                ['Événement', f.eventType], ['Date souhaitée', fmtDate(f.eventDate)], ['Lieu', f.place], ['Invités', f.guests],
                ['Budget indicatif', f.budget || 'Non renseigné'],
              ].map(([k, val]) => <div key={k}><dt className="text-xs uppercase tracking-[.14em] text-brun-3">{k}</dt><dd className="mt-1 text-brun">{val}</dd></div>)}
              <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-[.14em] text-brun-3">Prestations</dt><dd className="mt-2 flex flex-wrap gap-1.5">{f.services.map((s) => <span key={s} className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand">{SERVICE_LABELS[s]}</span>)}</dd></div>
              {f.needs && <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-[.14em] text-brun-3">Besoins</dt><dd className="mt-1 whitespace-pre-line text-brun">{f.needs}</dd></div>}
              <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-[.14em] text-brun-3">Photos d’inspiration</dt><dd className="mt-1 text-brun">{photos.length ? `${photos.length} photo(s)` : 'Aucune'}</dd></div>
              <p className="rounded-xl bg-ivoire p-4 text-xs leading-relaxed text-brun-2 sm:col-span-2">Démonstration : la demande est enregistrée dans l’espace professionnel de ce navigateur. Aucun e-mail n’est envoyé.</p>
            </dl>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <Button variant="ghost" icon="left" onClick={() => goto(step - 1)} disabled={step === 0}>Précédent</Button>
            {step < 4 ? <Button onClick={next} iconRight="right">{step === 3 && !photos.length ? 'Passer cette étape' : 'Continuer'}</Button> : <Button size="lg" onClick={submit} iconRight="check">Envoyer ma demande</Button>}
          </div>
        </div>
      </section>
    </>
  );
}
