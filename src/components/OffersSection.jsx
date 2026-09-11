import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal, SpotlightCard, MovingBorder } from './ui/Aceternity'
import { ArrowRight, TagIcon, ClockIcon } from './Icons'
import { tone } from '../lib/utils'
import { useCatalog } from '../context/CatalogContext'

export default function OffersSection() {
  const { offers, loading } = useCatalog()

  return (
    <section id="offers" className="relative py-16 sm:py-20">
      <div className="wrap">
        <Reveal className="mb-9 text-center">
          <span className="eyebrow mx-auto"><TagIcon size={13} /> This week</span>
          <h2 className="mt-2 font-display text-[2rem] leading-tight text-forest sm:text-[2.5rem]">
            Deals worth the walk
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[.95rem] text-ink-2">
            Counter prices, honestly marked. No fake discounts, no minimum spend games.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {(loading ? Array.from({ length: 3 }) : offers).map((o, i) => {
            if (!o) return <div key={i} className="h-48 animate-pulse rounded-[26px] bg-cream-2/70 sm:h-64" />
            const t = tone(o.theme)
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <MovingBorder duration={5 + i} from={t.from} to={t.to} className="h-full">
                  <SpotlightCard
                    className="flex h-full flex-col justify-between gap-4 rounded-[25px] p-5 sm:gap-6 sm:p-6"
                    color={`${t.from}44`}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-2xl"
                      style={{ background: t.to }}
                    />
                    <div className="relative z-20">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[.7rem] font-semibold uppercase tracking-[.14em] text-ink-3">
                          <ClockIcon size={13} /> {o.kicker}
                        </span>
                        <span
                          className="rounded-full px-3 py-1 text-[.72rem] font-bold text-white shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                        >
                          {o.tag}
                        </span>
                      </div>
                      <h3 className="font-display text-[1.7rem] leading-tight text-forest">{o.title}</h3>
                      <p className="mt-2 text-[.92rem] leading-relaxed text-ink-2">{o.detail}</p>
                    </div>
                    <Link
                      to={o.to}
                      className="group relative z-20 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-[.88rem] font-semibold text-white shadow-md transition-transform hover:scale-[1.04]"
                      style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                    >
                      {o.cta}
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </SpotlightCard>
                </MovingBorder>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
