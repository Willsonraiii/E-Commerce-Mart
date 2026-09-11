import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Seo from '../components/Seo'
import { ArrowRight, SearchIcon } from '../components/Icons'
import { useCart } from '../context/CartContext'

export default function NotFound() {
  const { setSearchOpen } = useCart()
  return (
    <>
      <Seo title="Page not found — Yalambar Store" description="That shelf is empty." path="/404" />
      <section className="wrap grid min-h-[62vh] place-items-center py-16 text-center">
        <div>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="font-display text-[6rem] font-semibold leading-none text-transparent sm:text-[8rem]"
            style={{ backgroundImage: 'linear-gradient(135deg,#3d8a58,#c4962a)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
          >
            404
          </motion.p>
          <h1 className="mt-2 font-display text-[1.8rem] text-forest sm:text-[2.2rem]">That shelf is empty</h1>
          <p className="mx-auto mt-2 max-w-sm text-[.95rem] text-ink-2">
            The page you were looking for isn't stocked here. Try the shop, or ask at the counter.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn btn-primary">Back home <ArrowRight size={17} /></Link>
            <button onClick={() => setSearchOpen(true)} className="btn btn-ghost"><SearchIcon size={17} /> Search products</button>
          </div>
        </div>
      </section>
    </>
  )
}
