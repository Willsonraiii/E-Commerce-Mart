import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Seo from '../components/Seo'
import AuthLayout from '../components/AuthLayout'
import AuthField from '../components/ui/AuthField'
import { ArrowRight, ArrowLeft, MailIcon, PhoneIcon, UserIcon, PinIcon, CheckIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const LINES = [
  'Six hundred households already shop here',
  'One-tap reorder from past deliveries',
  'Saved addresses for a faster checkout',
  'Early notice on every weekly offer',
]

function strength(pw) {
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) || /[^\w]/.test(pw)) s++
  return s
}

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['#c45d2c', '#c45d2c', '#c4962a', '#3d8a58', '#2f6b47']

const STEPS = ['You', 'Security']

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { notify } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', address: '', city: 'New Baneshwor',
  })
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const s = strength(form.password)

  const emailOk = /\S+@\S+\.\S+/.test(form.email)
  const phoneOk = form.phone.replace(/\D/g, '').length >= 7
  const stepOneOk = form.name.trim().length > 1 && emailOk && phoneOk

  const go = (next) => { setDir(next > step ? 1 : -1); setStep(next); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    if (step === 0) { if (stepOneOk) go(1); return }
    setError(''); setBusy(true)
    try {
      const u = await signUp(form)
      notify(`Welcome to the shop, ${u.name.split(' ')[0]}`)
      navigate('/account', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create that account.')
      setBusy(false)
      setStep(0); setDir(-1)
    }
  }

  const slide = {
    enter: (d) => ({ opacity: 0, x: d * 34 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d * -34 }),
  }

  return (
    <>
      <Seo title="Create account — Yalambar Store" description="Create your Yalambar Store account." path="/register" />

      <AuthLayout
        reverse
        mode="register"
        heading="Join the neighbourhood"
        sub="Takes a minute. No card needed."
        lines={LINES}
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-leaf hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        {/* step rail */}
        <div className="mt-5 flex items-center gap-2.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2.5">
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i > step}
                className="flex items-center gap-2 disabled:cursor-default"
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[.72rem] font-bold transition-colors ${
                    i < step
                      ? 'bg-leaf text-mint'
                      : i === step
                        ? 'bg-forest text-mint'
                        : 'bg-white/60 text-ink-3'
                  }`}
                >
                  {i < step ? <CheckIcon size={12} /> : i + 1}
                </span>
                <span
                  className={`text-[.8rem] font-medium transition-colors ${
                    i <= step ? 'text-forest' : 'text-ink-3'
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/55">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-leaf-glow"
                    initial={false}
                    animate={{ width: step > i ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-[.85rem] text-terracotta-deep backdrop-blur"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="relative">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              {step === 0 ? (
                <motion.div
                  key="step-0"
                  custom={dir} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex flex-col gap-3.5"
                >
                  <AuthField
                    label="Full name" name="name" value={form.name} onChange={set('name')}
                    icon={UserIcon} required autoComplete="name" placeholder="Sita Gurung"
                    valid={form.name.trim().length > 1}
                  />
                  <AuthField
                    label="Email" name="email" type="email" value={form.email} onChange={set('email')}
                    icon={MailIcon} required autoComplete="email" placeholder="you@email.com"
                    valid={emailOk}
                  />
                  <AuthField
                    label="Phone" name="phone" type="tel" value={form.phone} onChange={set('phone')}
                    icon={PhoneIcon} required autoComplete="tel" placeholder="+977 98…"
                    inputMode="tel" valid={phoneOk}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="step-1"
                  custom={dir} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex flex-col gap-3.5"
                >
                  <AuthField
                    label="Password" name="password" type="password"
                    value={form.password} onChange={set('password')}
                    required autoComplete="new-password" placeholder="At least 6 characters"
                  />

                  <AnimatePresence>
                    {form.password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="-mt-1 overflow-hidden px-1"
                      >
                        <span className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1 flex-1 rounded-full"
                              initial={false}
                              animate={{ background: i < s ? COLORS[s] : 'rgba(26,23,20,.14)' }}
                              transition={{ duration: 0.25 }}
                            />
                          ))}
                        </span>
                        <span className="mt-1 block text-[.75rem] font-medium" style={{ color: COLORS[s] }}>
                          {LABELS[s]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AuthField
                    label="Delivery address" name="address" value={form.address} onChange={set('address')}
                    icon={PinIcon} autoComplete="street-address" placeholder="Sankhamul Road, house 12"
                    hint="Optional — you can add this at checkout."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-5 flex gap-2.5">
            {step > 0 && (
              <motion.button
                type="button" onClick={() => go(0)}
                whileTap={{ scale: 0.98 }}
                className="btn btn-ghost shrink-0 px-4 py-3.5"
                aria-label="Back to your details"
              >
                <ArrowLeft size={17} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: busy ? 1 : 1.012 }}
              whileTap={{ scale: 0.985 }}
              disabled={busy || (step === 0 && !stepOneOk)}
              className="btn btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-mint/40 border-t-mint" />
                : step === 0
                  ? <>Continue <ArrowRight size={17} /></>
                  : <>Create account <ArrowRight size={17} /></>}
            </motion.button>
          </div>

          <p className="mt-3.5 text-center text-[.75rem] leading-relaxed text-ink-3">
            {step === 0
              ? 'We only ask for what the rider needs to reach your door.'
              : 'Passwords are bcrypt-hashed and the session lives in an httpOnly cookie.'}
          </p>
        </form>
      </AuthLayout>
    </>
  )
}
