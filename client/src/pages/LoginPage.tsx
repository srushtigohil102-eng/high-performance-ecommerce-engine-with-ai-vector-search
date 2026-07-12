import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Input from '../components/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
        navigate('/admin', { replace: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Admin Login
        </h1>
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
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateField('email')}
            error={emailError}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
