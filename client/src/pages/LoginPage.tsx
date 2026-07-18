import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import Button from '../components/Button'
import Input from '../components/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, authError, clearError, user } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sessionExpired = searchParams.get('session') === 'expired'

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
    }
  }, [user, navigate])

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 8
  const isFormValid = isEmailValid && isPasswordValid

  function validateField(field: 'email' | 'password'): void {
    if (field === 'email') {
      if (!email) setEmailError('Email is required')
      else if (!isEmailValid) setEmailError('Invalid email format')
      else setEmailError('')
    } else {
      if (!password) setPasswordError('Password is required')
      else if (!isPasswordValid) setPasswordError('Password must be at least 8 characters')
      else setPasswordError('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    let valid = true
    if (!email) { setEmailError('Email is required'); valid = false }
    else if (!isEmailValid) { setEmailError('Invalid email format'); valid = false }
    else { setEmailError('') }

    if (!password) { setPasswordError('Password is required'); valid = false }
    else if (!isPasswordValid) { setPasswordError('Password must be at least 8 characters'); valid = false }
    else { setPasswordError('') }

    if (!valid) return

    setSubmitting(true)
    try {
      const success = await login(email, password)
      if (success) {
        showToast('Login successful')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Sign In
        </h1>
        {sessionExpired && (
          <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800" role="alert">
            Your session has expired. Please sign in again.
          </div>
        )}
        {authError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {authError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 font-semibold underline hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError() }}
            onBlur={() => validateField('email')}
            error={emailError}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError() }}
            onBlur={() => validateField('password')}
            error={passwordError}
          />
          <Button type="submit" disabled={!isFormValid || submitting} className="mt-2">
            {submitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
