import { motion } from 'framer-motion'
import { Reveal, Marquee, TiltCard } from './ui/Aceternity'
import { StarIcon, PinIcon } from './Icons'

const REVIEWS = [
  { name: 'Sabina Rai', area: 'Sankhamul', avatar: '/images/avatar-1.jpg', rating: 5,
    body: 'Ordered at 9 pm expecting nothing. Wai Wai and milk at my gate in 40 minutes. This is the shop I grew up walking to.' },
  { name: 'Prakash Thapa', area: 'New Baneshwor', avatar: '/images/avatar-2.jpg', rating: 5,
    body: 'The vegetables are actually weighed properly — no soft tomatoes hidden at the bottom of the bag. That matters.' },
  { name: 'Anita KC', area: 'Tinkune', avatar: '/images/avatar-3.jpg', rating: 4,
    body: 'DDC milk arrived cold, bread was still warm. Delivery guy waited while I found change. Small shop, big service.' },
  { name: 'Bikash Shrestha', area: 'Mid Baneshwor', avatar: '/images/avatar-1.jpg', rating: 5,
    body: 'I run a hostel nearby and order the noodle boxes weekly. Prices match the counter, never inflated for delivery.' },
  { name: 'Rita Maharjan', area: 'Koteshwor', avatar: '/images/avatar-2.jpg', rating: 5,
    body: 'Rs. 60 delivery, free over 1500. Honest about it upfront. No surprise fees at checkout like the big apps.' },
  { name: 'Nabin Gurung', area: 'Baneshwor Chowk', avatar: '/images/avatar-3.jpg', rating: 5,
    body: 'Glass bottle cola, properly cold. They remembered I asked for it chilled the second time. That is a neighborhood shop.' },
]

function Card({ r }) {
  return (
    <TiltCard max={7} scale={1.02} className="mx-2.5 w-[320px] shrink-0 sm:w-[360px]">
      <figure className="flex h-full flex-col gap-3.5 rounded-[24px] border border-line bg-paper p-5 shadow-premium">
        <div className="flex items-center gap-1 text-gold">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} size={14} filled={i <= r.rating} className={i <= r.rating ? '' : 'text-line'} />
          ))}
        </div>
        <blockquote className="flex-1 text-[.9rem] leading-relaxed text-ink-2">“{r.body}”</blockquote>
        <figcaption className="flex items-center gap-3 border-t border-line pt-3.5">
          <img
            src={r.avatar} alt=""
            className="h-10 w-10 rounded-full object-cover ring-2 ring-mint"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div>
            <p className="text-[.88rem] font-semibold text-ink">{r.name}</p>
            <p className="inline-flex items-center gap-1 text-[.74rem] text-ink-3">
              <PinIcon size={11} /> {r.area}
            </p>
          </div>
        </figcaption>
      </figure>
    </TiltCard>
  )
}

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="wrap">
        <Reveal className="mb-10 text-center">
          <span className="eyebrow mx-auto">From the neighborhood</span>
          <h2 className="mt-2 font-display text-[2rem] leading-tight text-forest sm:text-[2.5rem]">
            What the regulars say
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[.95rem] text-ink-2">
            Six hundred-odd households between Sankhamul and Tinkune. These are a few of them.
          </p>
        </Reveal>
      </div>

      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-cream to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-cream to-transparent" />
        <Marquee speed={52} className="py-3">
          {REVIEWS.map((r) => <Card key={`a-${r.name}`} r={r} />)}
        </Marquee>
        <Marquee speed={62} reverse className="py-3">
          {[...REVIEWS].reverse().map((r) => <Card key={`b-${r.name}`} r={r} />)}
        </Marquee>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="wrap mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center"
      >
        {[['4.8/5', 'average rating'], ['600+', 'households served'], ['98%', 'delivered on time']].map(([v, l]) => (
          <div key={l}>
            <p className="font-display text-[1.7rem] font-semibold text-forest">{v}</p>
            <p className="text-[.75rem] uppercase tracking-[.12em] text-ink-3">{l}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
