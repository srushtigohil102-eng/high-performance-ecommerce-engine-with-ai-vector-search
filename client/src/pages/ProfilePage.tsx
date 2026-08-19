import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  KeyRound,
  Package,
  MapPin,
  Heart,
  Plus,
  Pencil,
  Trash2,
  Mail,
  ShieldCheck,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useWishlist } from '../hooks/useWishlist'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import OrderStatusBadge from '../components/OrderStatusBadge'
import { getOrders } from '../services/orderService'
import {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getApiErrorMessage,
  type AddressPayload,
} from '../services/profileService'
import { formatCurrency } from '../utils/formatCurrency'
import type { User as UserType, UserAddress, Order } from '../types'

type TabKey = 'profile' | 'password' | 'orders' | 'addresses' | 'wishlist'

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'profile', label: 'Profile Info', icon: User },
  { key: 'password', label: 'Change Password', icon: KeyRound },
  { key: 'orders', label: 'My Orders', icon: Package },
  { key: 'addresses', label: 'My Addresses', icon: MapPin },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
]

// ─── Profile Info ───────────────────────────────────────────────────────────

interface ProfileInfoTabProps {
  profile: UserType
  onUpdated: (user: UserType) => void
}

function ProfileInfoTab({ profile, onUpdated }: ProfileInfoTabProps) {
  const { showToast } = useToast()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [verificationNotice, setVerificationNotice] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isFormValid = name.trim().length >= 1 && isEmailValid

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isFormValid) return
    setSaving(true)
    setFormError('')
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim() })
      onUpdated(updated)
      setVerificationNotice(updated.email !== profile.email)
      showToast('Profile updated successfully.')
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-text-primary">{profile.name}</h2>
            <p className="truncate text-sm text-text-secondary">{profile.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {profile.emailVerified ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  <span className="font-medium text-success">Email verified</span>
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                  <span className="font-medium text-warning">Email not verified</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Profile Info</h3>
        {verificationNotice && (
          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-primary">
            Your email changed — a verification link has been sent to the new address. Please verify
            it to keep your account secure.
          </div>
        )}
        {formError && (
          <div
            className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {formError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setFormError('')
            }}
            onBlur={() => setNameError(!name.trim() ? 'Name is required' : '')}
            error={nameError}
          />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFormError('')
            }}
            onBlur={() => setEmailError(!isEmailValid ? 'Invalid email format' : '')}
            error={emailError}
          />
          <p className="text-xs text-text-secondary">
            Changing your email will require you to verify the new address.
          </p>
          <Button type="submit" disabled={!isFormValid || saving} className="sm:w-fit">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Change Password ────────────────────────────────────────────────────────

function ChangePasswordTab() {
  const { showToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ current: '', next: '', confirm: '' })

  const isNewValid = newPassword.length >= 8
  const isConfirmValid = confirm.length > 0 && confirm === newPassword
  const isFormValid = currentPassword.length > 0 && isNewValid && isConfirmValid

  function validateField(field: 'current' | 'next' | 'confirm') {
    if (field === 'current') {
      setFieldErrors((prev) => ({
        ...prev,
        current: !currentPassword ? 'Current password is required' : '',
      }))
    } else if (field === 'next') {
      setFieldErrors((prev) => ({
        ...prev,
        next: !newPassword
          ? 'New password is required'
          : !isNewValid
            ? 'New password must be at least 8 characters'
            : '',
      }))
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        confirm: !confirm
          ? 'Please confirm your new password'
          : confirm !== newPassword
            ? 'Passwords do not match'
            : '',
      }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isFormValid) return
    setSaving(true)
    setError('')
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      showToast('Password changed successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6 shadow-sm"
    >
      <h3 className="mb-1 font-display text-base font-semibold text-text-primary">Change Password</h3>
      <p className="mb-4 text-sm text-text-secondary">
        Choose a new password to secure your account. Other sessions will be signed out.
      </p>
      {error && (
        <div
          className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <Input
          label="Current Password"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value)
            setError('')
          }}
          onBlur={() => validateField('current')}
          error={fieldErrors.current}
        />
        <Input
          label="New Password"
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={() => validateField('next')}
          error={fieldErrors.next}
        />
        <Input
          label="Confirm New Password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => validateField('confirm')}
          error={fieldErrors.confirm}
        />
        <Button type="submit" disabled={!isFormValid || saving} className="sm:w-fit">
          {saving ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </form>
  )
}

// ─── My Orders ──────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getOrders()
      setOrders(data)
    } catch {
      setError('Failed to load your orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (loading) {
    return <LoadingSpinner size="md" message="Loading your orders..." />
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-error">{error}</p>
        <Button variant="secondary" onClick={fetchOrders} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-text-primary">My Orders</h3>
        {orders.length > 0 && (
          <Link
            to="/orders"
            className="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View all
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="mb-2 font-medium text-text-primary">You haven&apos;t placed any orders yet</p>
          <p className="mb-4 text-sm text-text-secondary">Start shopping and your orders will appear here.</p>
          <Link to="/">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {orders.slice(0, 5).map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface-elevated/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-bold text-text-primary">
                      #{order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' · '}
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-bold text-accent">{formatCurrency(order.total)}</span>
                  <ChevronRight
                    className="h-4 w-4 text-text-secondary transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── My Addresses ───────────────────────────────────────────────────────────

const EMPTY_ADDRESS: AddressPayload = {
  label: '',
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  isDefault: false,
}

function AddressesTab() {
  const { showToast } = useToast()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressPayload>(EMPTY_ADDRESS)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAddresses()
      setAddresses(data)
    } catch {
      setError('Failed to load your addresses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  function openAdd() {
    setForm(EMPTY_ADDRESS)
    setEditingId(null)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(addr: UserAddress) {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      phone: addr.phone,
      isDefault: addr.isDefault,
    })
    setEditingId(addr.id)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editingId) {
        await updateAddress(editingId, form)
        showToast('Address updated.')
      } else {
        await createAddress(form)
        showToast('Address added.')
      }
      setFormOpen(false)
      await fetchAddresses()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this address?')) return
    try {
      await deleteAddress(id)
      showToast('Address deleted.')
      await fetchAddresses()
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not delete the address.'), 'error')
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await updateAddress(id, { isDefault: true })
      await fetchAddresses()
      showToast('Default address updated.')
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not update the address.'), 'error')
    }
  }

  const isFormValid =
    form.label.trim() &&
    form.fullName.trim() &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-text-primary">My Addresses</h3>
        {!formOpen && (
          <Button variant="secondary" onClick={openAdd} className="px-4 py-2 text-xs">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add Address
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-sm text-error">{error}</p>
          <Button variant="secondary" onClick={fetchAddresses} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="md" message="Loading addresses..." />
      ) : (
        <>
          {addresses.length === 0 && !formOpen && (
            <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-text-secondary/40" aria-hidden="true" />
              <p className="mb-1 font-medium text-text-primary">No saved addresses</p>
              <p className="mb-4 text-sm text-text-secondary">
                Add an address to speed up checkout.
              </p>
              <Button onClick={openAdd}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add Address
              </Button>
            </div>
          )}

          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              <h4 className="mb-4 font-display text-sm font-semibold text-text-primary">
                {editingId ? 'Edit Address' : 'Add Address'}
              </h4>
              {formError && (
                <div
                  className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
                  role="alert"
                >
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Label"
                  type="text"
                  required
                  placeholder="e.g. Home, Office"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Address Line 1"
                    type="text"
                    required
                    value={form.addressLine1}
                    onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address Line 2 (optional)"
                    type="text"
                    value={form.addressLine2 ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
                  />
                </div>
                <Input
                  label="City"
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
                <Input
                  label="State"
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
                <Input
                  label="Postal Code"
                  type="text"
                  required
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <label className="mt-4 flex w-fit items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={Boolean(form.isDefault)}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Set as default address
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="submit" disabled={!isFormValid || saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Address'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {addresses.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(addr)}
                        aria-label={`Edit ${addr.label} address`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        aria-label={`Delete ${addr.label} address`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-text-primary">{addr.fullName}</p>
                  <p className="text-sm text-text-secondary">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  {addr.phone && <p className="mt-1 text-sm text-text-secondary">{addr.phone}</p>}
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Wishlist ───────────────────────────────────────────────────────────────

function WishlistTab() {
  const { items } = useWishlist()
  return (
    <Link
      to="/wishlist"
      className="block rounded-xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Heart className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display font-semibold text-text-primary">My Wishlist</p>
            <p className="text-sm text-text-secondary">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-text-secondary" aria-hidden="true" />
      </div>
    </Link>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { isAuthenticated, user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [profile, setProfile] = useState<UserType | null>(user)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnTo=/account')
      return
    }
    let cancelled = false
    getProfile()
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {
        // Fall back to the AuthContext snapshot if the fetch fails.
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, navigate])

  const handleProfileUpdated = useCallback(
    async (updated: UserType) => {
      setProfile(updated)
      await refreshUser()
    },
    [refreshUser],
  )

  if (!isAuthenticated) return null

  const renderTabButton = (tab: (typeof TABS)[number], variant: 'sidebar' | 'bar') => {
    const isActive = activeTab === tab.key
    const Icon = tab.icon
    if (variant === 'bar') {
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => setActiveTab(tab.key)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
            isActive
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-surface text-text-secondary hover:border-primary hover:text-primary'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {tab.label}
        </button>
      )
    }
    return (
      <button
        key={tab.key}
        type="button"
        onClick={() => setActiveTab(tab.key)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {tab.label}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">My Account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your profile, password, orders, and addresses.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <nav
            className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3 shadow-sm"
            aria-label="Account sections"
          >
            {TABS.map((tab) => renderTabButton(tab, 'sidebar'))}
          </nav>
        </aside>

        {/* Mobile horizontal scrollable tab bar */}
        <nav
          className="flex gap-2 overflow-x-auto pb-2 thin-scrollbar lg:hidden"
          aria-label="Account sections"
        >
          {TABS.map((tab) => renderTabButton(tab, 'bar'))}
        </nav>

        {/* Active tab content */}
        <section className="min-w-0">
          {activeTab === 'profile' &&
            (profileLoading ? (
              <LoadingSpinner size="md" message="Loading your profile..." />
            ) : profile ? (
              <ProfileInfoTab profile={profile} onUpdated={handleProfileUpdated} />
            ) : (
              <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
                <p className="text-sm text-text-secondary">Could not load your profile.</p>
                <Link to="/login">
                  <Button className="mt-4">Sign in</Button>
                </Link>
              </div>
            ))}
          {activeTab === 'password' && <ChangePasswordTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'wishlist' && <WishlistTab />}
        </section>
      </div>
    </div>
  )
}
