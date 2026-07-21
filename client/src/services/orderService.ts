import { apiClient } from './apiClient'
import type { PlaceOrderPayload, Order } from '../types'

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<{ order: Order }>('/orders', payload)
  return data.order
}

export async function getOrderById(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<{ order: Order }>(`/orders/${orderId}`)
  return data.order
}
