import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { verifyEmail, resendVerification } from '../services/authService'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const { isAuthenticated, refreshUser } = useAuth()
  const { showToast } = useToast()

  const [status, setStatus] = useState<Status>('verifying')
  const [resending, setResending] = useState(false)
  const verifyAttemptedRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    // The token is single-use server-side; the request must never re-fire even
    // if this effect re-runs (e.g. context identity changes after refreshUser).
    if (verifyAttemptedRef.current) return
    verifyAttemptedRef.current = true

    let cancelled = false
    verifyEmail(token)
      .then(() => {
        if (cancelled) return
        setStatus('success')
        if (isAuthenticated) {
          void refreshUser()
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleResend() {
    if (!email) return
    setResending(true)
    try {
      await resendVerification(email)
      showToast('Verification email sent — check the server console.', 'info')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <LoadingSpinner />
            <p className="text-sm text-text-secondary">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mb-2 font-display text-xl font-bold text-text-primary">Email verified</h1>
            <p className="mb-6 text-sm text-text-secondary">
              Your email address has been verified. Thanks for confirming it.
            </p>
            {isAuthenticated ? (
              <Link to="/" onClick={() => showToast('Email verified successfully')}>
                <Button>Continue Shopping</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
              <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="mb-2 font-display text-xl font-bold text-text-primary">Verification link invalid</h1>
            <p className="mb-6 text-sm text-text-secondary">
              This link is invalid or has expired. {email ? 'You can request a new verification email below.' : 'Please request a new one.'}
            </p>
            {email && (
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending}
                className="mb-3"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </Button>
            )}
            <div className="flex justify-center gap-3">
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
