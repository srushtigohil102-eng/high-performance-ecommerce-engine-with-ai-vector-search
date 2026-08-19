import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { resendVerification } from '../services/authService'

// Soft, dismissible reminder shown to logged-in but unverified users. It never
// blocks shopping — verification is optional in this dev-mode flow.
export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)

  const showBanner = isAuthenticated && user && !user.emailVerified && !dismissed

  // If the account becomes verified while mounted (e.g. verified in another
  // tab), stop showing the banner.
  useEffect(() => {
    if (user?.emailVerified) setDismissed(false)
  }, [user?.emailVerified])

  if (!showBanner) return null

  async function handleResend() {
    if (!user || resending) return
    setResending(true)
    try {
      await resendVerification(user.email)
      showToast('Verification email sent — check the server console.', 'info')
    } catch {
      showToast('Could not resend verification email. Please try again.', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="border-b border-border bg-warning/10 animate-slide-down" role="region" aria-label="Email verification reminder">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <svg className="h-5 w-5 shrink-0 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <p className="flex-1 text-sm text-text-primary">
          Please verify your email to secure your account.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-50"
        >
          {resending ? 'Sending...' : 'Resend email'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary"
          aria-label="Dismiss verification reminder"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
