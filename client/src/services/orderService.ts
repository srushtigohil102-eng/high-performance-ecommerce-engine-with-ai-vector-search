import { apiClient } from './apiClient'
import { mockOrders } from '../data/mockOrders'
import type { PlaceOrderPayload, Order } from '../types'

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<{ order: Order }>('/orders', payload)
  return data.order
}

export async function getOrderById(orderId: string): Promise<Order> {
  try {
    const { data } = await apiClient.get<{ order: Order }>(`/orders/${orderId}`)
    return data.order
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[orderService] API unavailable, falling back to mock data', err)
      return mockOrders.find((o) => o.id === orderId) ?? mockOrders[0]
    }
    throw new Error('Failed to load order. Please try again later.')
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const { data } = await apiClient.get<{ orders: Order[] }>('/orders')
    return data.orders
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[orderService] API unavailable, falling back to mock data', err)
      return mockOrders
    }
    throw new Error('Failed to load orders. Please try again later.')
  }
}
