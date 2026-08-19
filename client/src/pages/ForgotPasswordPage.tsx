import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authService'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isFormValid = isEmailValid && !submitting

  function validateField(): void {
    if (!email) setEmailError('Email is required')
    else if (!isEmailValid) setEmailError('Invalid email format')
    else setEmailError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!email) { setEmailError('Email is required'); return }
    if (!isEmailValid) { setEmailError('Invalid email format'); return }

    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-center text-3xl font-bold text-text-primary font-display">
          Forgot Password
        </h1>

        {sent ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mb-2 font-display text-lg font-bold text-text-primary">Check your inbox</h2>
            <p className="text-sm text-text-secondary">
              If an account exists for <span className="font-semibold text-text-primary">{email}</span>, a
              password reset link has been sent to it. In this dev build the link is logged to the
              server console — open the terminal running the backend and click it there.
            </p>
            <Link to="/login" className="mt-5 inline-block">
              <Button variant="outline">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              Enter your account email and we&rsquo;ll send you a link to reset your password.
            </p>
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
              onBlur={validateField}
              error={emailError}
            />
            <Button type="submit" disabled={!isFormValid} className="mt-2">
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-text-secondary">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-text-primary underline hover:text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
