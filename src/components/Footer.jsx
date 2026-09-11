import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from './Logo'
import { Reveal, BackgroundBeams } from './ui/Aceternity'
import { PinIcon, PhoneIcon, MailIcon, ClockIcon, ArrowRight } from './Icons'
import { storeInfo, navLinks } from '../lib/utils'
import { useCatalog } from '../context/CatalogContext'
import { useCart } from '../context/CartContext'

const socials = [
  { label: 'Facebook', href: 'https://facebook.com', d: 'M14 9h3V6h-3c-1.7 0-3 1.6-3 3.5V12H8v3h3v7h3v-7h3l1-3h-4V9.5c0-.3.2-.5.5-.5Z' },
  { label: 'Instagram', href: 'https://instagram.com', custom: true },
  { label: 'TikTok', href: 'https://tiktok.com', d: 'M14 4v10.2a3.2 3.2 0 1 1-3.2-3.2V8.2A6 6 0 1 0 17 14V9.4A8 8 0 0 0 20 10V6.8A6.2 6.2 0 0 1 14 4Z' },
]

export default function Footer() {
  const { categories } = useCatalog()
  const { notify } = useCart()

  return (
    <footer id="contact" className="relative mt-24 overflow-hidden bg-forest text-mint">
      <BackgroundBeams count={9} className="opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-leaf-glow/12 blur-3xl"
      />

      {/* newsletter */}
      <div className="relative z-10 border-b border-white/10">
        <div className="wrap flex flex-col items-center gap-6 py-14 text-center md:flex-row md:justify-between md:text-left">
          <Reveal>
            <h2 className="font-display text-[1.9rem] leading-tight text-paper md:text-[2.3rem]">
              Deals from the shop,<br className="hidden md:block" /> straight to your inbox
            </h2>
            <p className="mt-2 max-w-md text-[.94rem] text-mint/70">
              Weekly offers, fresh arrivals and the odd Wai Wai discount. No spam — we run a corner store, not a mailing list.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <form
              onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); notify('Subscribed — see you next week!') }}
              className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
            >
              <input
                type="email" required placeholder="you@email.com" aria-label="Email address"
                className="flex-1 rounded-full border border-white/15 bg-white/8 px-5 py-3.5 text-[.92rem] text-paper outline-none backdrop-blur transition-colors placeholder:text-mint/45 focus:border-leaf-glow"
              />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} type="submit"
                className="btn shrink-0 bg-gradient-to-br from-leaf-glow to-leaf-bright px-6 py-3.5 text-forest">
                Subscribe <ArrowRight size={16} />
              </motion.button>
            </form>
          </Reveal>
        </div>
      </div>

      <div className="wrap relative z-10 grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr_1.1fr]">
        <div id="about">
          <Logo light stacked className="h-[112px]" />
          <p className="mt-4 max-w-sm text-[.92rem] leading-relaxed text-mint/70">
            <b className="text-paper">{storeInfo.tagline}</b> A neighborhood store in New Baneshwor —
            groceries, produce and household essentials without the warehouse run.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map((s) => (
              <motion.a
                key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                whileHover={{ y: -3, scale: 1.08 }}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-mint transition-colors hover:border-leaf-glow hover:text-leaf-glow"
              >
                {s.custom ? (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" />
                    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d={s.d} /></svg>
                )}
              </motion.a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-display text-[1.05rem] text-paper">Quick links</h3>
          <ul className="flex flex-col gap-2.5">
            {navLinks.map((l) => (
              <li key={l.id}>
                <Link to={l.to} className="group inline-flex items-center gap-1.5 text-[.9rem] text-mint/70 transition-colors hover:text-leaf-glow">
                  <span className="h-px w-0 bg-leaf-glow transition-all duration-300 group-hover:w-3" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-[1.05rem] text-paper">Aisles</h3>
          <ul className="flex flex-col gap-2.5">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link to={`/shop?category=${c.id}`} className="group inline-flex items-center gap-1.5 text-[.9rem] text-mint/70 transition-colors hover:text-leaf-glow">
                  <span className="h-px w-0 bg-leaf-glow transition-all duration-300 group-hover:w-3" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-[1.05rem] text-paper">Visit the shop</h3>
          <ul className="flex flex-col gap-3 text-[.9rem] text-mint/70">
            <li className="flex gap-2.5"><PinIcon size={17} className="mt-0.5 shrink-0 text-leaf-glow" />{storeInfo.address}</li>
            <li className="flex gap-2.5">
              <PhoneIcon size={17} className="mt-0.5 shrink-0 text-leaf-glow" />
              <a href={`tel:${storeInfo.phone.replace(/\s/g, '')}`} className="hover:text-leaf-glow">{storeInfo.phone}</a>
            </li>
            <li className="flex gap-2.5">
              <MailIcon size={17} className="mt-0.5 shrink-0 text-leaf-glow" />
              <a href={`mailto:${storeInfo.email}`} className="break-all hover:text-leaf-glow">{storeInfo.email}</a>
            </li>
            <li className="flex gap-2.5">
              <ClockIcon size={17} className="mt-0.5 shrink-0 text-leaf-glow" />
              <span className="flex flex-col">
                {storeInfo.hours.map((h) => <span key={h.days}>{h.days}: {h.time}</span>)}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="wrap flex flex-col items-center justify-between gap-2 py-5 text-[.8rem] text-mint/55 sm:flex-row">
          <span>© {new Date().getFullYear()} Yalambar Store. All rights reserved.</span>
          <span>Made for the neighborhood · Kathmandu 🇳🇵</span>
        </div>
      </div>
    </footer>
  )
}
