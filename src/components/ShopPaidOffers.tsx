import { ArrowRight, Crown, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, translations } from '@/hooks/useLanguage';

const COPY = {
  fr: { title: 'Achats intégrés', details: 'Voir l’offre', premium: 'Pack Premium', premiumItems: 'Sans publicité · Saison VIP · Pseudo doré pulsé · Bien plus encore', essential: 'Pack Essentiel', essentialItems: 'Les quatre boosts pour tes prochaines parties', essentialBoosts: '5 de chaque boost', tickets: '15 tickets Falling Tunnel', rainbow: 'Pseudo Multicolore', rainbowItems: 'Ton pseudo animé aux couleurs de l’arc-en-ciel dans le classement', permanent: 'Déblocage permanent' },
  en: { title: 'In-app purchases', details: 'View offer', premium: 'Premium Pack', premiumItems: 'No ads · VIP Season · Pulsing gold username · And much more', essential: 'Essential Pack', essentialItems: 'All four boosts for your next games', essentialBoosts: '5 of each boost', tickets: '15 Falling Tunnel tickets', rainbow: 'Rainbow Username', rainbowItems: 'An animated rainbow username on the leaderboard', permanent: 'Permanent unlock' },
  es: { title: 'Compras integradas', details: 'Ver oferta', premium: 'Pack Premium', premiumItems: 'Sin anuncios · Temporada VIP · Nombre dorado pulsante · Y mucho más', essential: 'Pack Esencial', essentialItems: 'Los cuatro boosts para tus próximas partidas', essentialBoosts: '5 de cada boost', tickets: '15 tickets Falling Tunnel', rainbow: 'Nombre Multicolor', rainbowItems: 'Tu nombre animado con los colores del arcoíris en la clasificación', permanent: 'Desbloqueo permanente' },
};

interface ShopPaidOffersProps {
  onPremium: () => void;
  onEssential: () => void;
  onRainbow: () => void;
}

export function ShopPaidOffers({ onPremium, onEssential, onRainbow }: ShopPaidOffersProps) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const t = translations[language];
  type Offer = { title: string; description: string; price: string; icon: typeof Crown; rewards: string[]; onOpen: () => void; tone: string; iconTone: string; titleEffect?: string };
  const offers: Offer[] = [
    { title: copy.premium, description: copy.premiumItems, price: '3,99 €', icon: Crown, rewards: [], onOpen: onPremium, tone: 'border-secondary/40 bg-secondary/5', iconTone: 'bg-secondary/15 text-secondary', titleEffect: 'animate-[username-gold-pulse_3s_ease-in-out_infinite]' },
    { title: copy.essential, description: copy.essentialItems, price: '1,99 €', icon: Package, rewards: [copy.essentialBoosts, copy.tickets], onOpen: onEssential, tone: 'border-primary/40 bg-primary/5', iconTone: 'bg-primary/15 text-primary' },
    { title: copy.rainbow, description: copy.rainbowItems, price: '1,99 €', icon: Sparkles, rewards: [copy.permanent], onOpen: onRainbow, tone: 'border-wheel-border bg-button-bg', iconTone: 'bg-button-hover text-text-primary', titleEffect: 'animate-[username-rainbow_3s_linear_infinite]' },
  ];

  return (
    <section aria-label={copy.title} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {offers.map(offer => (
        <article key={offer.title} className={`flex min-w-0 flex-col rounded-2xl border p-5 ${offer.tone}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${offer.iconTone}`}>
              <offer.icon className="h-6 w-6" />
            </div>
            <span className="text-2xl font-extrabold text-text-primary whitespace-nowrap">{offer.price}</span>
          </div>
          <h2 className={`mb-2 text-xl font-bold text-text-primary ${offer.titleEffect ?? ''}`}>{offer.title}</h2>
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">{offer.description}</p>
          {offer.rewards.length > 0 && (
            <ul className="mb-5 flex flex-wrap gap-2">
              {offer.rewards.map(reward => <li key={reward} className="rounded-full border border-wheel-border bg-button-bg px-3 py-1 text-xs font-semibold text-text-primary">{reward}</li>)}
            </ul>
          )}
          <Button onClick={offer.onOpen} variant="outline" className="mt-auto w-full border-wheel-border hover:bg-button-hover">
            {copy.details}<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </article>
      ))}
      <p className="text-center text-xs text-text-muted md:col-span-2 lg:col-span-3">{t.shopSecurePayment}</p>
    </section>
  );
}