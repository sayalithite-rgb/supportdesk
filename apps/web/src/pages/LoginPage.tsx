import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ApiError } from '../lib/api-client'
import { useAuth } from '../lib/auth'
import { createAccount, requestOneTimeCode, verifyOneTimeCode } from '../lib/auth-service'
import './LoginPage.css'

type FormValues = { fullName: string; email: string; password: string; confirmPassword: string }
type Mode = 'signin' | 'create'
type Step = 'password' | 'code' | 'forgot'
type Language = 'en' | 'hi'

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.7 10.7 0 0112 5c4.5 0 8.3 2.9 9.5 7a10.8 10.8 0 01-3 4.5M6.2 6.2A10.5 10.5 0 002.5 12c.5 1.7 1.5 3.2 2.8 4.4A10.2 10.2 0 0012 19c.9 0 1.8-.1 2.6-.4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function Spinner() {
  return <span aria-hidden="true" className="login-spinner" />
}

function passwordStrength(password: string) {
  const score = [
    password.length >= 8,
    password.length >= 10,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  const labels = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const codeRefs = useRef<Array<HTMLInputElement | null>>([])
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<Mode>('signin')
  const [language, setLanguage] = useState<Language>('en')
  const [step, setStep] = useState<Step>(location.pathname === '/forgot-password' ? 'forgot' : 'password')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(0)
  const [codeError, setCodeError] = useState('')
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: 'onBlur', reValidateMode: 'onBlur', defaultValues: { email: '' } })
  const email = watch('email')
  const password = watch('password') ?? ''
  const strength = passwordStrength(password)
  const navCopy = language === 'en'
    ? {
        contact: 'Contact us',
        support: 'Support',
        account: 'My account',
        search: 'Search',
        create: 'Create account',
        workspace: 'Support workspace',
        contactTitle: 'Contact SupportDesk',
        email: 'Email',
        phone: 'Phone',
        supportTitle: 'Support',
        helpCenter: 'Help center',
        hours: 'Support hours: Mon–Fri, 9 AM–5 PM',
        signIn: 'Sign in',
      }
    : {
        contact: 'संपर्क करें',
        support: 'सहायता',
        account: 'मेरा खाता',
        search: 'खोजें',
        create: 'खाता बनाएँ',
        workspace: 'सपोर्ट कार्यक्षेत्र',
        contactTitle: 'SupportDesk से संपर्क करें',
        email: 'ईमेल',
        phone: 'फ़ोन',
        supportTitle: 'सहायता',
        helpCenter: 'सहायता केंद्र',
        hours: 'सहायता समय: सोम–शुक्र, सुबह 9–शाम 5',
        signIn: 'साइन इन',
      }

  useEffect(() => {
    emailRef.current?.focus()
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current)
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function changeMode(next: Mode) {
    setMode(next)
    setStep('password')
    setFormError('')
    setSuccess('')
    setShowPassword(false)
    clearErrors()
  }

  async function onSubmit(values: FormValues) {
    setFormError('')
    setSuccess('')
    try {
      if (mode === 'create') {
        await createAccount(values.fullName.trim(), values.email.trim(), values.password)
        await login(values.email.trim(), values.password)
        setSuccess('Account created. Taking you to your dashboard…')
        successTimer.current = setTimeout(() => navigate('/', { replace: true }), 900)
        return
      }

      await login(values.email.trim(), values.password)
      navigate(from || '/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Email or password is incorrect.')
      } else if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_REGISTERED') {
        setFormError('An account with this email already exists. Sign in instead.')
      } else if (error instanceof ApiError && error.status === 400 && mode === 'create') {
        setFormError(error.message)
      } else if (error instanceof Error) {
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    }
  }

  async function startCodeFlow() {
    setFormError('')
    const validEmail = /^\S+@\S+\.\S+$/.test(email?.trim() ?? '')
    if (!validEmail) {
      setError('email', { type: 'manual', message: 'Enter a valid email address' })
      emailRef.current?.focus()
      return
    }
    setStep('code')
    setCodeError('')
    setCode(['', '', '', '', '', ''])
    setCooldown(30)
    try {
      await requestOneTimeCode(email.trim())
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'One-time code sign-in is unavailable.')
    }
  }

  async function resendCode() {
    if (cooldown > 0) return
    setCodeError('')
    setCooldown(30)
    try {
      await requestOneTimeCode(email.trim())
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'One-time code sign-in is unavailable.')
    }
  }

  async function submitCode() {
    const value = code.join('')
    if (value.length !== 6) {
      setCodeError('Enter the 6-digit code.')
      return
    }
    setCodeError('')
    try {
      await verifyOneTimeCode(email.trim(), value)
      navigate(from || '/', { replace: true })
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Code verification is unavailable.')
    }
  }

  function updateCode(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setCode((current) => current.map((item, position) => position === index ? digit : item))
    setCodeError('')
    if (digit && index < 5) codeRefs.current[index + 1]?.focus()
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    event.preventDefault()
    setCode(Array.from({ length: 6 }, (_, index) => digits[index] ?? ''))
    codeRefs.current[Math.min(digits.length, 5)]?.focus()
  }

  function handleCodeKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === 'Backspace' && !code[index] && index > 0) codeRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) codeRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) codeRefs.current[index + 1]?.focus()
  }

  const emailField = register('email', {
    required: 'Enter a valid email address',
    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
  })
  const passwordField = register('password', {
    required: 'Enter your password',
    ...(mode === 'create' ? {
      minLength: { value: 10, message: 'Password must be at least 10 characters and include a letter and a number' },
      validate: (value) => /[A-Za-z]/.test(value) && /\d/.test(value) || 'Password must include a letter and a number',
    } : {}),
  })

  return (
    <main className="login-page">
      <nav className="login-nav" aria-label="Login page navigation">
        <div className="login-nav-inner">
          <div className="login-nav-utility">
            <label className="login-language">
              <span className="sr-only">Language</span>
              <span aria-hidden="true">◎</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Language">
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
              <span aria-hidden="true">⌄</span>
            </label>

            <details className="login-nav-menu">
              <summary>{navCopy.contact}</summary>
              <div className="login-nav-popover">
                <strong>{navCopy.contactTitle}</strong>
                <span>{navCopy.email}: support@supportdesk.test</span>
                <span>{navCopy.phone}: +1 (800) 555-0142</span>
              </div>
            </details>

            <details className="login-nav-menu">
              <summary>{navCopy.support}<span aria-hidden="true">⌄</span></summary>
              <div className="login-nav-popover">
                <strong>{navCopy.supportTitle}</strong>
                <a href="mailto:support@supportdesk.test">{navCopy.helpCenter}</a>
                <span>{navCopy.hours}</span>
              </div>
            </details>

            <details className="login-nav-menu">
              <summary>{navCopy.account}<span aria-hidden="true">⌄</span></summary>
              <div className="login-nav-popover">
                <strong>{navCopy.account}</strong>
                <button type="button" onClick={() => changeMode('signin')}>{navCopy.signIn}</button>
                <button type="button" onClick={() => changeMode('create')}>{navCopy.create}</button>
              </div>
            </details>

            <span className="login-nav-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="9" r="3" />
                <path strokeLinecap="round" d="M5.5 19a7 7 0 0113 0" />
              </svg>
            </span>
          </div>

          <div className="login-nav-main">
            <Link to="/login" className="login-nav-brand" aria-label="SupportDesk home">
              <span className="login-nav-mark">SD</span>
              <span className="login-nav-brand-copy">
                <strong><span>support</span><em>desk</em></strong>
                <small>{navCopy.workspace}</small>
              </span>
            </Link>
            <div className="login-nav-actions">
              <label className="login-nav-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-4-4" />
                </svg>
                <span className="sr-only">{navCopy.search}</span>
                <input type="search" placeholder={navCopy.search} />
              </label>
              <button type="button" className="login-nav-create" onClick={() => changeMode('create')}>
                {navCopy.create}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="login-shell">
        <header className="login-brand">
          <h1 className="login-wordmark"><span>support</span><strong>desk</strong></h1>
          <p>Use your SupportDesk account to view and manage support tickets.</p>
        </header>

        <section className="login-card" aria-labelledby="login-heading">
          {step === 'forgot' ? (
            <div className="login-forgot">
              <h2 id="login-heading">Forgot password?</h2>
              <p>Password reset is not available yet. Contact your SupportDesk administrator for help.</p>
              <Link to="/login" className="login-text-link">Back to sign in</Link>
            </div>
          ) : step === 'code' ? (
            <div className="login-form">
              <h2 id="login-heading" className="login-heading">Check your email</h2>
              <p className="login-code-email">
                <input aria-label="Email address" className="login-input" value={email || ''} readOnly />
                <button type="button" className="login-text-link" onClick={() => setStep('password')}>Change</button>
              </p>
              <label className="login-label" htmlFor="code-0">6-digit code</label>
              <div className="login-code-boxes" role="group" aria-label="6-digit verification code">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { codeRefs.current[index] = element }}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${index + 1}`}
                    aria-invalid={Boolean(codeError)}
                    aria-describedby={codeError ? 'code-error' : undefined}
                    value={digit}
                    onChange={(event) => updateCode(index, event.target.value)}
                    onPaste={pasteCode}
                    onKeyDown={(event) => handleCodeKeyDown(event, index)}
                  />
                ))}
              </div>
              {(codeError || errors.email?.message) && (
                <p className="login-error" id="code-error" aria-live="polite">{codeError || errors.email?.message}</p>
              )}
              <button type="button" className="login-primary" onClick={() => void submitCode()}>Verify code</button>
              <p className="login-code-links">
                <button type="button" className="login-text-link" disabled={cooldown > 0} onClick={() => void resendCode()}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </p>
              <button type="button" className="login-text-link login-back-link" onClick={() => setStep('password')}>
                Back to password sign in
              </button>
            </div>
          ) : (
            <>
              <div className="login-tabs" role="tablist" aria-label="Account options">
                <span className={`login-tab-indicator ${mode === 'create' ? 'is-create' : ''}`} aria-hidden="true" />
                <button
                  type="button"
                  role="tab"
                  id="signin-tab"
                  aria-selected={mode === 'signin'}
                  aria-controls="login-panel"
                  className="login-tab"
                  onClick={() => changeMode('signin')}
                >Sign In</button>
                <button
                  type="button"
                  role="tab"
                  id="create-tab"
                  aria-selected={mode === 'create'}
                  aria-controls="login-panel"
                  className="login-tab"
                  onClick={() => changeMode('create')}
                >Create Account</button>
              </div>

              <form id="login-panel" role="tabpanel" aria-labelledby={mode === 'signin' ? 'signin-tab' : 'create-tab'} onSubmit={handleSubmit(onSubmit)} noValidate>
                <h2 id="login-heading" className="login-heading">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>

                {formError && <div className="login-banner" role="alert" aria-live="polite">{formError}</div>}
                {success && <div className="login-success" role="status" aria-live="polite">{success}</div>}

                {mode === 'create' && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="fullName">Full name</label>
                    <input
                      id="fullName"
                      autoComplete="name"
                      placeholder="Your name"
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      className="login-input"
                      {...register('fullName', { required: 'Enter your full name', maxLength: { value: 100, message: 'Name must be 100 characters or fewer' } })}
                    />
                    {errors.fullName && <p className="login-error" id="fullName-error" aria-live="polite">{errors.fullName.message}</p>}
                  </div>
                )}

                <div className="login-field">
                  <label className="login-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="name@company.com"
                    autoFocus
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="login-input"
                    {...emailField}
                    ref={(element) => {
                      emailField.ref(element)
                      emailRef.current = element
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        passwordRef.current?.focus()
                      }
                    }}
                  />
                  {errors.email && <p className="login-error" id="email-error" aria-live="polite">{errors.email.message}</p>}
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="password">Password</label>
                  <div className="login-password-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="Enter your password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={[errors.password ? 'password-error' : '', capsLock ? 'capslock-warning' : ''].filter(Boolean).join(' ') || undefined}
                      className="login-input login-password-input"
                      {...passwordField}
                      ref={(element) => {
                        passwordField.ref(element)
                        passwordRef.current = element
                      }}
                      onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                      onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                    />
                    <button
                      type="button"
                      className="login-eye"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((value) => !value)}
                    ><EyeIcon hidden={!showPassword} /></button>
                  </div>
                  {errors.password && <p className="login-error" id="password-error" aria-live="polite">{errors.password.message}</p>}
                  {capsLock && <p className="login-muted-warning" id="capslock-warning" aria-live="polite">Caps Lock is on</p>}
                  {mode === 'create' && (
                    <div className="login-strength" aria-live="polite" aria-label={`Password strength: ${strength.label}`}>
                      <div className="login-strength-bars">
                        {[1, 2, 3, 4].map((segment) => (
                          <span key={segment} className={segment <= strength.score ? `strength-${strength.score}` : ''} />
                        ))}
                      </div>
                      <span>{strength.label}</span>
                    </div>
                  )}
                </div>

                {mode === 'create' && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="confirmPassword">Confirm password</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      className="login-input"
                      {...register('confirmPassword', {
                        required: 'Confirm your password',
                        validate: (value) => value === password || "Passwords don't match",
                      })}
                    />
                    {errors.confirmPassword && <p className="login-error" id="confirmPassword-error" aria-live="polite">{errors.confirmPassword.message}</p>}
                  </div>
                )}

                <button type="submit" className="login-primary" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
                </button>

                {mode === 'signin' && (
                  <button type="button" className="login-text-link login-code-link" onClick={() => void startCodeFlow()}>
                    Email me a one-time code instead
                  </button>
                )}

                <div className="login-bottom-links">
                  <Link to="/forgot-password" className="login-text-link">Forgot password?</Link>
                </div>
              </form>
            </>
          )}
        </section>

        <footer className="login-footer">© 2026 SupportDesk</footer>
      </div>
    </main>
  )
}
