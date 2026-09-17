import { motion } from 'framer-motion'

/**
 * Wrap any section/heading/card with this to have it settle into place as
 * it enters the viewport, instead of the whole page appearing at once.
 * Deliberately restrained (one movement, one timing curve) rather than a
 * different flourish per section — see usage notes below.
 *
 *   <Reveal><h2>Featured on the racks</h2></Reveal>
 *   <Reveal delay={0.08}><ProductGrid /></Reveal>
 *   <Reveal as="span" y={0} fade> ...inline text... </Reveal>
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 18,
  duration = 0.6,
  once = true,
  className,
}) {
  const Tag = motion[as] || motion.div
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Tag>
  )
}

/**
 * For a group of siblings (e.g. a product grid) that should settle in as
 * one wave with a slight stagger, rather than each getting its own <Reveal>
 * with a hand-picked delay.
 *
 *   <RevealGroup className="grid grid-cols-5 gap-4">
 *     {products.map(p => <ProductCard key={p.id} {...p} />)}
 *   </RevealGroup>
 */
export function RevealGroup({ children, className, stagger = 0.06, once = true }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className, y = 16 }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
