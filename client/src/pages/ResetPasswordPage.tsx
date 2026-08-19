import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authService'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isPasswordValid = password.length >= 8
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === password
  const isFormValid = isPasswordValid && isConfirmValid && !submitting

  function validateField(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      if (!password) setPasswordError('Password is required')
      else if (!isPasswordValid) setPasswordError('Password must be at least 8 characters')
      else setPasswordError('')
    } else {
      if (!confirmPassword) setConfirmError('Please confirm your password')
      else if (confirmPassword !== password) setConfirmError('Passwords do not match')
      else setConfirmError('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!isPasswordValid) { setPasswordError('Password must be at least 8 characters'); return }
    if (confirmPassword !== password) { setConfirmError('Passwords do not match'); return }

    if (!token) {
      setStatus('error')
      setErrorMessage('This reset link is invalid. Please request a new one.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token, password)
      setStatus('success')
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        'This reset link is invalid or has expired. Please request a new one.'
      setStatus('error')
      setErrorMessage(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <div className="w-full rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
          <h1 className="mb-2 font-display text-lg font-bold text-text-primary">Invalid Reset Link</h1>
          <p className="mb-4 text-sm text-text-secondary">
            This password reset link is missing its token and can&rsquo;t be used. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button variant="outline">Request a new link</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-center font-display text-3xl font-bold text-text-primary">
          Reset Password
        </h1>

        {status === 'success' ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mb-2 font-display text-lg font-bold text-text-primary">Password updated</h2>
            <p className="text-sm text-text-secondary">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link to="/login" className="mt-5 inline-block">
              <Button>Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {email && (
              <p className="text-sm text-text-secondary">
                Resetting the password for <span className="font-semibold text-text-primary">{email}</span>
              </p>
            )}
            {status === 'error' && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">
                {errorMessage}
              </div>
            )}
            <Input
              label="New Password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
              onBlur={() => validateField('password')}
              error={passwordError}
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError('') }}
              onBlur={() => validateField('confirm')}
              error={confirmError}
            />
            <Button type="submit" disabled={!isFormValid} className="mt-2">
              {submitting ? 'Updating...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
