import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'
import { Reveal } from './ui/Aceternity'
import { ArrowRight, SparkIcon } from './Icons'
import { useCatalog } from '../context/CatalogContext'

export default function FeaturedSection() {
  const { featured, loading } = useCatalog()

  return (
    <section className="relative py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-72 bg-gradient-to-b from-mint/60 to-transparent blur-2xl"
      />
      <div className="wrap">
        <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow"><SparkIcon size={13} /> Picked for you</span>
            <h2 className="mt-2 font-display text-[2rem] leading-tight text-forest sm:text-[2.5rem]">
              Featured on the racks
            </h2>
            <p className="mt-2 max-w-lg text-[.95rem] text-ink-2">
              What the neighborhood actually buys — restocked daily.
            </p>
          </div>
          <Link to="/shop?sort=popular" className="btn btn-ghost text-[.88rem]">
            See all <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[330px] animate-pulse rounded-[24px] bg-cream-2/70" />
              ))
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  )
}
