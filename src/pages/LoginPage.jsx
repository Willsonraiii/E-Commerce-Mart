import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Seo from '../components/Seo'
import AuthLayout from '../components/AuthLayout'
import AuthField from '../components/ui/AuthField'
import { ArrowRight, MailIcon, ShieldIcon, UserIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const LINES = [
  'Free delivery on orders over Rs. 1,500',
  'Produce picked and weighed this morning',
  'Your bag follows you across every device',
  'Reorder your last delivery in one tap',
]

/**
 * Demo credential chips are a preview convenience only — they publish a
 * working admin login. Gated behind VITE_SHOW_DEMO_LOGINS so a real
 * deployment (where the flag is absent/false) never renders them.
 */
const SHOW_DEMOS = import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true'

const DEMOS = [
  {
    role: 'Customer',
    email: 'demo@yalambermart.com.np',
    password: 'demo1234',
    Icon: UserIcon,
    blurb: 'Browse, order and track',
  },
  {
    role: 'Admin',
    email: 'admin@yalambermart.com.np',
    password: 'admin123',
    Icon: ShieldIcon,
    blurb: 'Full store console',
  },
]

export default function LoginPage() {
  const { signIn } = useAuth()
  const { notify } = useCart()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const u = await signIn(form)
      notify(`Welcome back, ${u.name.split(' ')[0]}`)
      navigate(u.role === 'admin' ? '/admin' : (state?.from || '/account'), { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed.')
      setBusy(false)
    }
  }

  const useDemo = (d) => {
    setForm({ email: d.email, password: d.password })
    setError('')
  }

  return (
    <>
      <Seo title="Sign in — Yalambar Store" description="Sign in to your Yalambar Store account." path="/login" />

      <AuthLayout
        mode="login"
        heading="Welcome back"
        sub="Sign in to pick up right where you left off."
        lines={LINES}
        footer={
          <>
            New to the shop?{' '}
            <Link to="/register" className="font-semibold text-leaf hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3.5">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 2 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-[.85rem] text-terracotta-deep backdrop-blur"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AuthField
            label="Email or phone"
            name="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            icon={MailIcon}
            required
            autoComplete="username"
            placeholder="you@email.com"
            valid={/\S+@\S+\.\S+/.test(form.email)}
          />

          <AuthField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          >
            <button
              type="button"
              onClick={() => notify('Call the shop on +977 1-5901840 to reset.', 'info')}
              className="text-[.78rem] font-medium text-leaf hover:underline"
            >
              Forgot password?
            </button>
          </AuthField>

          <motion.button
            whileHover={{ scale: busy ? 1 : 1.015 }}
            whileTap={{ scale: 0.985 }}
            disabled={busy}
            className="btn btn-primary mt-2 w-full py-3.5 disabled:opacity-70"
          >
            {busy
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-mint/40 border-t-mint" />
              : <>Sign in <ArrowRight size={17} /></>}
          </motion.button>
        </form>

        {SHOW_DEMOS && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-ink-3/20" />
              <span className="text-[.72rem] font-bold uppercase tracking-[.14em] text-ink-3">
                Or try a demo
              </span>
              <span className="h-px flex-1 bg-ink-3/20" />
            </div>

            <div className="grid gap-2.5">
              {DEMOS.map((d) => {
                const active = form.email === d.email
                return (
                  <motion.button
                    key={d.role}
                    type="button"
                    onClick={() => useDemo(d)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass-field group relative overflow-hidden rounded-2xl p-3 text-left ${
                      active ? 'glass-field-focus' : ''
                    }`}
                  >
                    <span className="relative z-[2] flex items-center gap-2.5">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                          active ? 'bg-leaf text-mint' : 'bg-white/70 text-leaf group-hover:bg-white'
                        }`}
                      >
                        <d.Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[.86rem] font-semibold text-ink">{d.role}</span>
                        <span className="block text-[.74rem] text-ink-3">{d.blurb}</span>
                      </span>
                      <span className="shrink-0 text-[.72rem] font-semibold text-leaf">
                        {active ? 'Filled' : 'Use'}
                      </span>
                    </span>
                    {active && (
                      <motion.span
                        layoutId="demo-active"
                        className="absolute inset-x-0 bottom-0 z-[3] h-[3px] bg-leaf-glow"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
            <p className="mt-2.5 text-center text-[.72rem] text-ink-3">
              Preview only — hidden when <code className="font-mono">VITE_SHOW_DEMO_LOGINS</code> is off.
            </p>
          </div>
        )}
      </AuthLayout>
    </>
  )
}
