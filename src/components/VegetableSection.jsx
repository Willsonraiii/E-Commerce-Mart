import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import { Reveal, NumberTicker } from './ui/Aceternity'
import { ArrowRight, LeafIcon, TruckIcon, ClockIcon } from './Icons'
import { useCatalog } from '../context/CatalogContext'

const FACTS = [
  { Icon: LeafIcon, v: 6, s: 'am', l: 'Farm pickup', c: 'Kalimati every morning' },
  { Icon: TruckIcon, v: 60, s: 'min', l: 'To your door', c: 'Across New Baneshwor' },
  { Icon: ClockIcon, v: 14, s: 'h', l: 'Open daily', c: '7 AM until 9 PM' },
]

export default function VegetableSection() {
  const { vegetables, loading } = useCatalog()

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="wrap">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-forest via-forest-mid to-forest-deep p-6 shadow-lift sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-leaf-glow/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold/12 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <Reveal>
              <span className="eyebrow !text-leaf-glow"><LeafIcon size={13} /> Fresh today</span>
              <h2 className="mt-2 font-display text-[2rem] leading-tight text-paper sm:text-[2.6rem]">
                Vegetables, weighed<br />at the counter
              </h2>
              <p className="mt-3 max-w-md text-[.95rem] leading-relaxed text-mint/75">
                Picked up from Kalimati before the shop opens. If it isn't good enough for our own
                kitchen, it doesn't go on the rack.
              </p>

              <ul className="mt-7 flex flex-col gap-4">
                {FACTS.map(({ Icon, v, s, l, c }) => (
                  <li key={l} className="flex items-center gap-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/8 text-leaf-glow backdrop-blur">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="font-display text-[1.15rem] font-semibold text-paper">
                        <NumberTicker value={v} suffix={s} /> <span className="text-[.85rem] font-normal text-mint/70">{l}</span>
                      </p>
                      <p className="text-[.78rem] text-mint/55">{c}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <motion.div whileHover={{ x: 4 }} className="mt-7">
                <Link
                  to="/shop?category=vegetables"
                  className="btn inline-flex bg-gradient-to-br from-leaf-glow to-leaf-bright px-6 py-3 text-forest"
                >
                  Shop vegetables <ArrowRight size={17} />
                </Link>
              </motion.div>
            </Reveal>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {(loading ? Array.from({ length: 8 }) : vegetables.slice(0, 8)).map((p, i) =>
                p ? (
                  <ProductCard key={p.id} product={p} index={i} compact />
                ) : (
                  <div key={i} className="h-[280px] animate-pulse rounded-[24px] bg-white/10" />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
