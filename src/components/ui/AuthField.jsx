import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { EyeIcon, CheckIcon } from '../Icons'

/**
 * Frosted floating-label field. Uses the iOS glass material so it reads
 * as a translucent pane over whatever colour sits behind the card.
 */
export default function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  required,
  autoComplete,
  placeholder,
  name,
  inputMode,
  valid = false,
  hint,
  children,
}) {
  const id = useId()
  const [focus, setFocus] = useState(false)
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const filled = String(value ?? '').length > 0
  const lifted = focus || filled

  return (
    <div className="relative">
      <div
        className={cn(
          'glass-field relative rounded-2xl',
          focus && 'glass-field-focus',
        )}
      >
        {Icon && (
          <span
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 z-[2] -translate-y-1/2 transition-colors',
              focus ? 'text-leaf' : 'text-ink-3',
            )}
          >
            <Icon size={17} />
          </span>
        )}

        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute z-[2] origin-left transition-all duration-200',
            Icon ? 'left-11' : 'left-4',
            lifted
              ? 'top-[7px] text-[.68rem] font-semibold uppercase tracking-wider'
              : 'top-1/2 -translate-y-1/2 text-[.92rem]',
            focus ? 'text-leaf' : 'text-ink-3',
          )}
        >
          {label}
        </label>

        <input
          id={id}
          name={name}
          type={isPassword && reveal ? 'text' : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={lifted ? placeholder : ''}
          className={cn(
            'relative z-[2] w-full bg-transparent pb-2 pt-6 text-[.95rem] text-ink outline-none placeholder:text-ink-3/55',
            Icon ? 'pl-11' : 'pl-4',
            isPassword || valid ? 'pr-12' : 'pr-4',
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 z-[3] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/60 hover:text-leaf"
          >
            <EyeIcon size={17} />
            {reveal && (
              <span className="pointer-events-none absolute h-[1.5px] w-[19px] rotate-45 rounded bg-current" />
            )}
          </button>
        )}

        {!isPassword && valid && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-4 top-1/2 z-[3] grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-leaf-glow/25 text-leaf"
          >
            <CheckIcon size={12} />
          </motion.span>
        )}
      </div>

      {(hint || children) && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
          {hint ? <span className="text-[.76rem] text-ink-3">{hint}</span> : <span />}
          {children}
        </div>
      )}
    </div>
  )
}
