import axios from 'axios'
import { apiClient } from './apiClient'
import type { User, UserAddress } from '../types'

export interface UpdateProfilePayload {
  name?: string
  email?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface AddressPayload {
  label: string
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  phone?: string
  isDefault?: boolean
}

// Pull the most specific, human-readable message out of an API error so the UI
// can surface e.g. "Current password is incorrect" instead of a generic failure.
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  return err instanceof Error && err.message ? err.message : fallback
}

function normalizeProfile(raw: Record<string, unknown>): User {
  return {
    id: (raw.id ?? raw._id ?? '') as string,
    name: (raw.name ?? '') as string,
    email: (raw.email ?? '') as string,
    role: (raw.role ?? 'customer') as User['role'],
    emailVerified: Boolean(raw.emailVerified),
  }
}

function normalizeAddress(raw: Record<string, unknown>): UserAddress {
  return {
    id: (raw.id ?? raw._id ?? '') as string,
    label: (raw.label ?? '') as string,
    fullName: (raw.fullName ?? '') as string,
    addressLine1: (raw.addressLine1 ?? '') as string,
    addressLine2: (raw.addressLine2 ?? '') as string,
    city: (raw.city ?? '') as string,
    state: (raw.state ?? '') as string,
    postalCode: (raw.postalCode ?? '') as string,
    phone: (raw.phone ?? '') as string,
    isDefault: Boolean(raw.isDefault),
  }
}

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<Record<string, unknown>>('/users/me')
  return normalizeProfile(data)
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await apiClient.put<Record<string, unknown>>('/users/me', payload)
  return normalizeProfile(data)
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put('/users/me/password', payload)
}

export async function getAddresses(): Promise<UserAddress[]> {
  const { data } = await apiClient.get<Record<string, unknown>[]>('/users/me/addresses')
  return (data ?? []).map(normalizeAddress)
}

export async function createAddress(payload: AddressPayload): Promise<UserAddress> {
  const { data } = await apiClient.post<Record<string, unknown>>('/users/me/addresses', payload)
  return normalizeAddress(data)
}

export async function updateAddress(
  addressId: string,
  payload: Partial<AddressPayload>,
): Promise<UserAddress> {
  const { data } = await apiClient.put<Record<string, unknown>>(
    `/users/me/addresses/${addressId}`,
    payload,
  )
  return normalizeAddress(data)
}

export async function deleteAddress(addressId: string): Promise<void> {
  await apiClient.delete(`/users/me/addresses/${addressId}`)
}
