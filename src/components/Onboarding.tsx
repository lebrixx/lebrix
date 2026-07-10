import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Gamepad2,
  Trophy,
  User,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Languages,
  Globe,
  Calendar,
  Star,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import { MainMenuBackground } from '@/components/MainMenuBackground';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';
import {
  isValidUsername,
  generateDefaultUsername,
  getDeviceId,
} from '@/utils/localIdentity';
import { setUsernameForScores } from '@/utils/scoresApi';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_KEY = 'ls_onboarding_done';

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {}
}

interface OnboardingProps {
  onComplete: () => void;
  /** Relance de l'onboarding : le pseudo est déjà défini et ne peut plus être modifié ici. */
  replay?: boolean;
}

const TOTAL_STEPS = 6;
// Indice de l'étape "Défis & Boutique" ajoutée entre modes et pseudo.
const STEP_EXTRAS = 3;
const STEP_USERNAME = 4;
const STEP_FINAL = 5;

// Textes onboarding par langue
const OB = {
  fr: {
    langTitle: 'Choisis ta langue',
    langSubtitle: 'Tu pourras la changer plus tard',
    welcomeKicker: 'Bienvenue',
    welcomeTitle: 'Un nouveau jeu de réflex',
    welcomeBody:
      "Lucky Stop est un jeu indépendant qui met tes réflexes et ta précision à l'épreuve. Simple à prendre en main, difficile à maîtriser.",
    modesKicker: 'Ce qui t’attend',
    modesTitle: 'Modes & Classements',
    modesLine1: 'Plus de 10 modes de jeu uniques',
    modesLine2: '2 classements distincts : mensuel global & hebdomadaire par mode',
    modesFooter: 'Grimpe, compare, recommence.',
    extrasKicker: 'Encore plus',
    extrasTitle: 'Défis & Boutique',
    extrasLine1: 'Des défis quotidiens et globaux à relever pour gagner des récompenses',
    extrasLine2: 'Une boutique avec thèmes, décorations et boosts pour personnaliser ton expérience',
    extrasFooter: 'De quoi progresser et se démarquer.',
    usernameKicker: 'Ton identité',
    usernameTitle: 'Choisis ton pseudo',
    usernameBody:
      'Ton pseudo est unique et apparaîtra dans les classements. Choisis-le avec soin — tu ne pourras le changer qu’une seule fois.',
    usernameHintInstagram:
      '💡 Conseil : utilise ton pseudo Instagram — de futurs concours récompenseront les meilleurs joueurs.',
    usernameLocked: 'Ton pseudo est déjà défini et ne peut pas être modifié ici.',
    usernamePlaceholder: 'Ton pseudo',
    usernameTaken: 'Ce pseudo est déjà pris',
    usernameInvalid: '3 à 16 caractères (lettres, chiffres, _)',
    random: 'Aléatoire',
    finalKicker: 'C’est parti',
    finalTitle: 'Bonnes parties !',
    finalBody: 'Tout est prêt. À toi de jouer et de viser le sommet.',
    start: 'Commencer',
    finish: 'Terminer',
    next: 'Suivant',
    back: 'Retour',
    skip: 'Passer',
  },
  en: {
    langTitle: 'Choose your language',
    langSubtitle: 'You can change it later',
    welcomeKicker: 'Welcome',
    welcomeTitle: 'A new reflex game',
    welcomeBody:
      'Lucky Stop is an indie game that tests your reflexes and precision. Easy to pick up, hard to master.',
    modesKicker: 'What awaits you',
    modesTitle: 'Modes & Leaderboards',
    modesLine1: 'More than 10 unique game modes',
    modesLine2: '2 separate leaderboards: monthly global & weekly per mode',
    modesFooter: 'Climb, compare, repeat.',
    extrasKicker: 'Even more',
    extrasTitle: 'Challenges & Shop',
    extrasLine1: 'Daily and global challenges to complete for extra rewards',
    extrasLine2: 'A shop with themes, decorations and boosts to make it yours',
    extrasFooter: 'Plenty to grind and stand out.',
    usernameKicker: 'Your identity',
    usernameTitle: 'Pick your username',
    usernameBody:
      'Your username is unique and appears on the leaderboards. Choose carefully — you can change it only once.',
    usernameHintInstagram:
      '💡 Tip: use your Instagram handle — upcoming contests will reward the top players.',
    usernameLocked: 'Your username is already set and can’t be changed here.',
    usernamePlaceholder: 'Your username',
    usernameTaken: 'This username is already taken',
    usernameInvalid: '3 to 16 characters (letters, numbers, _)',
    random: 'Random',
    finalKicker: 'Let’s go',
    finalTitle: 'Have fun!',
    finalBody: 'You’re all set. Time to play and aim for the top.',
    start: 'Start',
    finish: 'Done',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
  },
  es: {
    langTitle: 'Elige tu idioma',
    langSubtitle: 'Podrás cambiarlo después',
    welcomeKicker: 'Bienvenido',
    welcomeTitle: 'Un nuevo juego de reflejos',
    welcomeBody:
      'Lucky Stop es un juego independiente que pone a prueba tus reflejos y precisión. Fácil de aprender, difícil de dominar.',
    modesKicker: 'Lo que te espera',
    modesTitle: 'Modos y Clasificaciones',
    modesLine1: 'Más de 10 modos de juego únicos',
    modesLine2: '2 clasificaciones distintas: mensual global y semanal por modo',
    modesFooter: 'Sube, compara, repite.',
    extrasKicker: 'Aún más',
    extrasTitle: 'Desafíos y Tienda',
    extrasLine1: 'Desafíos diarios y globales para conseguir recompensas',
    extrasLine2: 'Una tienda con temas, decoraciones y boosts para personalizar',
    extrasFooter: 'Mucho por conseguir y destacar.',
    usernameKicker: 'Tu identidad',
    usernameTitle: 'Elige tu apodo',
    usernameBody:
      'Tu apodo es único y aparece en las clasificaciones. Elígelo con cuidado — solo podrás cambiarlo una vez.',
    usernameHintInstagram:
      '💡 Consejo: usa tu apodo de Instagram — próximos concursos recompensarán a los mejores.',
    usernameLocked: 'Tu apodo ya está definido y no se puede cambiar aquí.',
    usernamePlaceholder: 'Tu apodo',
    usernameTaken: 'Este apodo ya está en uso',
    usernameInvalid: '3 a 16 caracteres (letras, números, _)',
    random: 'Aleatorio',
    finalKicker: 'Vamos',
    finalTitle: '¡Buenas partidas!',
    finalBody: 'Todo listo. Es hora de jugar y apuntar a la cima.',
    start: 'Empezar',
    finish: 'Terminar',
    next: 'Siguiente',
    back: 'Atrás',
    skip: 'Saltar',
  },
} as const;

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, replay = false }) => {
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState(0);
  const ob = OB[language];

  // Username state
  const existingUsername = React.useMemo(() => {
    try {
      return localStorage.getItem('circle_tap_username');
    } catch {
      return null;
    }
  }, []);
  const [username, setUsername] = useState(() => existingUsername || generateDefaultUsername());
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const lastCheckedRef = useRef<string>('');

  // Debounced check
  useEffect(() => {
    if (step !== STEP_USERNAME) return;
    if (replay) return; // Pseudo verrouillé en replay
    if (!isValidUsername(username)) {
      setAvailable(null);
      setUsernameError(username ? ob.usernameInvalid : '');
      return;
    }
    const normalized = username.toLowerCase();
    if (lastCheckedRef.current === normalized) return;

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-username', {
          body: { username, device_id: getDeviceId() },
        });
        if (controller.signal.aborted) return;
        if (!error && data) {
          setAvailable(!!data.available);
          lastCheckedRef.current = normalized;
          setUsernameError(data.available ? '' : ob.usernameTaken);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('[Onboarding] check-username error:', err);
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [username, step, ob.usernameInvalid, ob.usernameTaken, replay]);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const canGoNext = (() => {
    if (step === STEP_USERNAME) {
      if (replay) return true;
      return isValidUsername(username) && available === true && !checking;
    }
    return true;
  })();

  const finish = () => {
    try {
      if (!replay && isValidUsername(username)) {
        setUsernameForScores(username);
      }
    } catch (err) {
      console.error('[Onboarding] setUsername error:', err);
    }
    markOnboardingDone();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden">
      <MainMenuBackground />

      {/* Overlay content */}
      <div className="relative z-10 flex flex-col h-full w-full px-6 pb-6">
        {/* Back button — petit, en haut à gauche */}
        {step > 0 && (
          <button
            onClick={goBack}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full border border-wheel-border bg-button-bg/80 backdrop-blur-sm flex items-center justify-center text-text-primary active:scale-95 transition-all duration-300 hover:bg-button-hover"
            aria-label={ob.back}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-10 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]'
                  : i < step
                  ? 'w-4 bg-primary/50'
                  : 'w-4 bg-white/15'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          {/* Step 0 — Language */}
          {step === 0 && (
            <div className="w-full text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/15 flex items-center justify-center border border-primary/30">
                <Languages className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">
                {ob.langTitle}
              </h2>
              <p className="text-sm text-text-muted mb-8">{ob.langSubtitle}</p>
              <div className="flex flex-col gap-3 w-full">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      goNext();
                    }}
                    className={`group relative flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 active:scale-[0.98] ${
                      language === l.code
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
                        : 'border-wheel-border bg-button-bg hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <span className="text-3xl">{l.flag}</span>
                    <span className="text-lg font-semibold text-text-primary flex-1 text-left">
                      {l.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="w-full text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold mb-3">
                {ob.welcomeKicker}
              </div>
              <h2 className="text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-4 leading-tight">
                {ob.welcomeTitle}
              </h2>
              <p className="text-base text-text-secondary leading-relaxed max-w-md mx-auto">
                {ob.welcomeBody}
              </p>
            </div>
          )}

          {/* Step 2 — Modes */}
          {step === 2 && (
            <div className="w-full text-center animate-fade-in">
              <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold mb-3">
                {ob.modesKicker}
              </div>
              <h2 className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent mb-6">
                {ob.modesTitle}
              </h2>
              <div className="grid grid-cols-1 gap-3 w-full mb-4">
                <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-text-primary text-left font-medium">
                    {ob.modesLine1}
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 gap-1">
                    <Trophy className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-sm text-text-primary text-left font-medium">
                    {ob.modesLine2}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Calendar className="w-4 h-4 text-primary" />
                    Global
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Globe className="w-4 h-4 text-secondary" />
                    Par mode
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted italic">{ob.modesFooter}</p>
            </div>
          )}

          {/* Step 3 — Défis & Boutique */}
          {step === STEP_EXTRAS && (
            <div className="w-full text-center animate-fade-in">
              <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold mb-3">
                {ob.extrasKicker}
              </div>
              <h2 className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent mb-6">
                {ob.extrasTitle}
              </h2>
              <div className="grid grid-cols-1 gap-3 w-full mb-4">
                <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-text-primary text-left font-medium">
                    {ob.extrasLine1}
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-sm text-text-primary text-left font-medium">
                    {ob.extrasLine2}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-muted italic">{ob.extrasFooter}</p>
            </div>
          )}

          {/* Step 4 — Username (required, verrouillé en replay) */}
          {step === STEP_USERNAME && (
            <div className="w-full text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/15 flex items-center justify-center border border-primary/30">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold mb-3">
                {ob.usernameKicker}
              </div>
              <h2 className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent mb-3">
                {ob.usernameTitle}
              </h2>
              <p className="text-sm text-text-secondary mb-3 max-w-md mx-auto leading-relaxed">
                {ob.usernameBody}
              </p>
              {!replay && (
                <p className="text-xs text-primary/90 mb-5 max-w-md mx-auto leading-relaxed font-medium">
                  {ob.usernameHintInstagram}
                </p>
              )}

              <div className="relative w-full mb-2">
                <Input
                  value={username}
                  onChange={(e) => {
                    if (replay) return;
                    setUsername(e.target.value);
                    setAvailable(null);
                    setUsernameError('');
                    lastCheckedRef.current = '';
                  }}
                  placeholder={ob.usernamePlaceholder}
                  maxLength={16}
                  autoFocus={!replay}
                  disabled={replay}
                  className={`bg-background/60 border-wheel-border text-text-primary text-center text-lg py-6 pr-12 ${
                    replay ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {replay ? (
                    <Lock className="w-5 h-5 text-text-muted" />
                  ) : checking ? (
                    <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
                  ) : available === true ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : available === false ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
              </div>

              <div className="min-h-[20px] mb-4">
                {replay ? (
                  <p className="text-xs text-text-muted italic">{ob.usernameLocked}</p>
                ) : (
                  usernameError && <p className="text-xs text-red-400">{usernameError}</p>
                )}
              </div>

              {!replay && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUsername(generateDefaultUsername());
                    setAvailable(null);
                    setUsernameError('');
                    lastCheckedRef.current = '';
                  }}
                  className="border-wheel-border hover:bg-button-hover"
                >
                  {ob.random}
                </Button>
              )}
            </div>
          )}

          {/* Step 5 — Final */}
          {step === STEP_FINAL && (
            <div className="w-full text-center animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/40 flex items-center justify-center border border-primary/50 shadow-[0_0_40px_hsl(var(--primary)/0.5)] animate-pulse">
                <Rocket className="w-12 h-12 text-primary" />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-bold mb-3">
                {ob.finalKicker}
              </div>
              <h2 className="text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-4">
                {ob.finalTitle}
              </h2>
              <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
                {ob.finalBody}
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step > 0 && (
          <div className="w-full max-w-lg mx-auto flex items-center gap-3 mb-3">
            {step < TOTAL_STEPS - 1 ? (
              <Button
                onClick={goNext}
                disabled={!canGoNext}
                size="lg"
                className="flex-1 bg-gradient-primary hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-primary transition-all duration-300 py-6 text-base font-bold"
              >
                {ob.next}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={finish}
                size="lg"
                className="flex-1 bg-gradient-primary hover:scale-[1.02] shadow-glow-primary transition-all duration-300 py-6 text-base font-bold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                {replay ? ob.finish : ob.start}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
