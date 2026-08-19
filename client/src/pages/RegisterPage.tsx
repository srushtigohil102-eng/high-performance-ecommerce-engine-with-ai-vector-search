import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import Button from '../components/Button'
import Input from '../components/Input'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, authError, clearError, user } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
    }
  }, [user, navigate])

  const isNameValid = name.trim().length >= 1
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 8
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === password
  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isConfirmValid

  function validateField(field: 'name' | 'email' | 'password' | 'confirm'): void {
    if (field === 'name') {
      if (!name.trim()) setNameError('Name is required')
      else setNameError('')
    } else if (field === 'email') {
      if (!email) setEmailError('Email is required')
      else if (!isEmailValid) setEmailError('Invalid email format')
      else setEmailError('')
    } else if (field === 'password') {
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

    let valid = true
    if (!name.trim()) { setNameError('Name is required'); valid = false }
    else { setNameError('') }

    if (!email) { setEmailError('Email is required'); valid = false }
    else if (!isEmailValid) { setEmailError('Invalid email format'); valid = false }
    else { setEmailError('') }

    if (!password) { setPasswordError('Password is required'); valid = false }
    else if (!isPasswordValid) { setPasswordError('Password must be at least 8 characters'); valid = false }
    else { setPasswordError('') }

    if (!confirmPassword) { setConfirmError('Please confirm your password'); valid = false }
    else if (confirmPassword !== password) { setConfirmError('Passwords do not match'); valid = false }
    else { setConfirmError('') }

    if (!valid) return

    setSubmitting(true)
    try {
      const success = await register(name, email, password)
      if (success) {
        showToast('Account created — check the server console for your email verification link.', 'info')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Create Account
        </h1>
        {authError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">
            {authError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 font-semibold underline hover:text-red-900 dark:hover:text-red-100"
            >
              Dismiss
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError() }}
            onBlur={() => validateField('name')}
            error={nameError}
          />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError() }}
            onBlur={() => validateField('email')}
            error={emailError}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError() }}
            onBlur={() => validateField('password')}
            error={passwordError}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError() }}
            onBlur={() => validateField('confirm')}
            error={confirmError}
          />
          <Button type="submit" disabled={!isFormValid || submitting} className="mt-2">
            {submitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gray-900 underline hover:text-gray-700 dark:text-white dark:hover:text-gray-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
