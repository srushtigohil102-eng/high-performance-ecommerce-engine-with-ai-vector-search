import type { ReviewsResponse, Review, ReviewPayload } from '../types'
import { apiClient } from './apiClient'

interface ReviewResponse {
  id?: string
  _id?: string
  user: { _id?: string; id?: string; name: string }
  rating: number
  title?: string
  comment: string
  createdAt?: string
}

function normalizeReview(raw: ReviewResponse): Review {
  return {
    id: raw.id ?? raw._id ?? '',
    user: {
      id: raw.user?.id ?? raw.user?._id ?? '',
      name: raw.user?.name ?? 'Anonymous',
    },
    rating: raw.rating ?? 0,
    title: raw.title,
    comment: raw.comment ?? '',
    createdAt: raw.createdAt ?? '',
  }
}

export async function getProductReviews(
  productId: string,
  params: { page?: number; limit?: number } = {},
): Promise<ReviewsResponse> {
  const { data } = await apiClient.get<ReviewsResponse>(`/products/${productId}/reviews`, {
    params,
  })

  return {
    reviews: (data.reviews ?? []).map(normalizeReview),
    page: data.page ?? params.page ?? 1,
    limit: data.limit ?? params.limit ?? 10,
    total: data.total ?? 0,
    totalPages: data.totalPages ?? 1,
    averageRating: data.averageRating ?? 0,
    ratingCount: data.ratingCount ?? 0,
  }
}

export async function createReview(productId: string, payload: ReviewPayload): Promise<Review> {
  const { data } = await apiClient.post<ReviewResponse>(`/products/${productId}/reviews`, payload)
  return normalizeReview(data)
}

export async function updateReview(reviewId: string, payload: Partial<ReviewPayload>): Promise<Review> {
  const { data } = await apiClient.put<ReviewResponse>(`/reviews/${reviewId}`, payload)
  return normalizeReview(data)
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/reviews/${reviewId}`)
}
