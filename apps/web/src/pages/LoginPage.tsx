import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api-client'

type FormValues = { email: string; password: string }

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

const inputClass =
  'w-full border border-[#888c8c] rounded-[3px] px-2.5 py-2 text-sm bg-white ' +
  'focus:outline-none focus:border-[#e77600] focus:ring-2 focus:ring-[#e77600]/30'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  async function onSubmit(values: FormValues) {
    setServerError('')
    try {
      await login(values.email, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setServerError('Your email or password is incorrect.')
      } else if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Unexpected error. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-8 pb-10">
      <h1 className="text-3xl font-bold tracking-tight text-amz-navy mb-5">
        support<span className="text-amz-orange">desk</span>
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-[350px] border border-amz-border rounded-lg p-5 space-y-4"
      >
        <h2 className="text-[28px] leading-8 font-normal">Sign in</h2>

        {serverError && (
          <div role="alert" className="border border-[#c40000] rounded-lg p-3 flex gap-2 text-sm">
            <span className="text-[#c40000] font-bold" aria-hidden="true">!</span>
            <div>
              <p className="text-[#c40000] font-bold">There was a problem</p>
              <p>{serverError}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-bold mb-1">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={inputClass}
            {...register('email', {
              required: 'Enter your email',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <p className="text-xs text-[#c40000] mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-bold mb-1">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className={`${inputClass} pr-10`}
              {...register('password', { required: 'Enter your password' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-amz-navy focus:outline-none focus:ring-2 focus:ring-[#e77600]/40 rounded"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-[#c40000] mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amz-yellow hover:bg-amz-yellow-dark border border-[#fcd200] rounded-full py-2 text-sm shadow-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#e77600]/50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-xs text-slate-600 leading-5">
          Use your SupportDesk account to view and manage support tickets.
        </p>
      </form>

      <p className="text-xs text-slate-500 mt-8">© 2026 SupportDesk</p>
    </div>
  )
}