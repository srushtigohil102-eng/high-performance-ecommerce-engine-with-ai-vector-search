import type { Product } from '../types'
import { mockProducts } from '../data/mockProducts'

const MOCK_DELAY_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getProducts(): Promise<Product[]> {
  await delay(MOCK_DELAY_MS)
  return [...mockProducts]
}

export async function getProductById(id: string): Promise<Product | null> {
  await delay(MOCK_DELAY_MS)
  return mockProducts.find((p) => p.id === id) ?? null
}
