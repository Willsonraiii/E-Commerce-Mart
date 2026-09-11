import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal, TiltCard } from './ui/Aceternity'
import { ArrowRight } from './Icons'
import { tone } from '../lib/utils'
import { useCatalog } from '../context/CatalogContext'

const ICONS = {
  noodles: '/images/wai-wai.jpg', vegetables: '/images/tomato.jpg', fruits: '/images/apple.jpg',
  dairy: '/images/milk.jpg', bakery: '/images/bread.jpg', snacks: '/images/chips.jpg',
  tea: '/images/tea.jpg', beverages: '/images/cola.jpg', groceries: '/images/rice.jpg',
  care: '/images/soap.jpg', household: '/images/detergent.jpg', chocolates: '/images/chocolate.jpg',
}

export default function CategorySection() {
  const { categories, loading } = useCatalog()

  return (
    <section id="categories" className="relative py-16 sm:py-20">
      <div className="wrap">
        <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Shop by aisle</span>
            <h2 className="mt-2 font-display text-[2rem] leading-tight text-forest sm:text-[2.5rem]">
              Twelve aisles, one counter
            </h2>
            <p className="mt-2 max-w-lg text-[.95rem] text-ink-2">
              The same shelves you'd walk past in the shop — now a tap away.
            </p>
          </div>
          <Link to="/shop" className="btn btn-ghost text-[.88rem]">
            All products <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {(loading ? Array.from({ length: 12 }) : categories).map((c, i) => {
            if (!c) {
              return <div key={i} className="h-[132px] animate-pulse rounded-[20px] bg-cream-2/70" />
            }
            const t = tone(c.tone)
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 22, rotateX: -8 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.4) }}
              >
                <TiltCard max={14} scale={1.04}>
                  <Link
                    to={`/shop?category=${c.id}`}
                    className="group relative block h-[132px] overflow-hidden rounded-[20px] p-3.5 shadow-premium transition-shadow hover:shadow-lift"
                    style={{ background: `linear-gradient(150deg, ${t.from}, ${t.to})` }}
                  >
                    <span
                      aria-hidden
                      className="absolute bottom-3 right-3 h-[62px] w-[62px] overflow-hidden rounded-2xl border-2 border-white/45 opacity-95 shadow-lg transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6"
                    >
                      <img src={ICONS[c.id] || '/images/apple.jpg'} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: 'radial-gradient(120px circle at 20% 10%, rgba(255,255,255,.45), transparent 70%)' }}
                    />
                    <span className="relative z-10 flex h-full flex-col justify-between">
                      <span
                        className="inline-flex w-fit rounded-full bg-white/25 px-2 py-0.5 text-[.62rem] font-bold uppercase tracking-wider backdrop-blur"
                        style={{ color: t.ink }}
                      >
                        {c.count} items
                      </span>
                      <span className="pr-[62px]">
                        <span className="block font-display text-[1.02rem] font-semibold leading-tight text-white drop-shadow-sm">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block text-[.7rem] leading-snug text-white/80">{c.blurb}</span>
                      </span>
                    </span>
                  </Link>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
