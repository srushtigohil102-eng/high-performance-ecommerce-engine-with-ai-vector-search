import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import type { Review } from '../types'
import { getProductReviews, createReview, updateReview, deleteReview } from '../services/reviewService'
import Button from './Button'
import ErrorMessage from './ErrorMessage'
import LoadingSpinner from './LoadingSpinner'
import Input from './Input'
import StarRating from './StarRating'

interface ReviewSectionProps {
  productId: string
  onReviewsChanged?: () => void
}

const REVIEWS_PER_PAGE = 10

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function ReviewSection({ productId, onReviewsChanged }: ReviewSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formRating, setFormRating] = useState(0)
  const [formTitle, setFormTitle] = useState('')
  const [formComment, setFormComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchReviews = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true)
        setError('')
        const res = await getProductReviews(productId, {
          page: targetPage,
          limit: REVIEWS_PER_PAGE,
        })
        setReviews((prev) => (targetPage === 1 ? res.reviews : [...prev, ...res.reviews]))
        setAverageRating(res.averageRating)
        setRatingCount(res.ratingCount)
        setPage(res.page)
        setTotalPages(res.totalPages)
      } catch {
        setError('Failed to load reviews.')
      } finally {
        setLoading(false)
      }
    },
    [productId],
  )

  useEffect(() => {
    setReviews([])
    setPage(1)
    setTotalPages(1)
    void fetchReviews(1)
  }, [fetchReviews])

  const myReview = user ? (reviews.find((r) => r.user.id === user.id) ?? null) : null
  const hasMore = page < totalPages

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setFormRating(0)
    setFormTitle('')
    setFormComment('')
    setFormError('')
  }

  const startEdit = (review: Review) => {
    setEditingId(review.id)
    setFormRating(review.rating)
    setFormTitle(review.title ?? '')
    setFormComment(review.comment)
    setFormOpen(true)
    setFormError('')
  }

  const openNewForm = () => {
    setEditingId(null)
    setFormRating(0)
    setFormTitle('')
    setFormComment('')
    setFormOpen(true)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formRating < 1 || !formComment.trim()) {
      setFormError('Please pick a star rating and write a comment.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        rating: formRating,
        comment: formComment.trim(),
        title: formTitle.trim() || undefined,
      }
      if (editingId) {
        await updateReview(editingId, payload)
        showToast('Review updated!')
      } else {
        await createReview(productId, payload)
        showToast('Review submitted!')
      }
      closeForm()
      await fetchReviews(1)
      onReviewsChanged?.()
    } catch (err) {
      setFormError(
        (err instanceof Error && err.message) || 'Could not save your review.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (review: Review) => {
    try {
      await deleteReview(review.id)
      showToast('Review deleted.')
      await fetchReviews(1)
      onReviewsChanged?.()
    } catch (err) {
      showToast((err instanceof Error && err.message) || 'Could not delete the review.')
    }
  }

  const showForm = formOpen || (isAuthenticated && !myReview && reviews.length === 0)

  return (
    <section className="mt-14" aria-label="Customer reviews">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">Customer Reviews</h2>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={averageRating} size={18} aria-label={`Average rating ${averageRating} out of 5`} />
            <span className="text-sm font-semibold text-text-primary">
              {ratingCount > 0 ? averageRating.toFixed(1) : 'No'}
            </span>
            <span className="text-sm text-text-secondary">
              {ratingCount === 0 ? 'reviews yet' : `review${ratingCount === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
        {isAuthenticated && !myReview && !formOpen && (
          <Button variant="outline" onClick={openNewForm}>
            Write a Review
          </Button>
        )}
      </div>

      {loading && reviews.length === 0 ? (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {reviews.length === 0 && !showForm && (
            <p className="py-6 text-sm text-text-secondary">
              No reviews yet. Be the first to leave one!
            </p>
          )}

          {reviews.length > 0 && (
            <ul className="flex flex-col gap-4">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl border border-border bg-surface p-5 shadow-sm animate-card-in"
                >
                  <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{review.user.name}</span>
                      {review.user.id === user?.id && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary">{formatDate(review.createdAt)}</span>
                  </div>
                  <StarRating value={review.rating} size={14} aria-label={`${review.rating} out of 5 stars`} />
                  {review.title && (
                    <h3 className="mt-2 font-display text-sm font-bold text-text-primary">{review.title}</h3>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{review.comment}</p>
                  {review.user.id === user?.id && (
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" className="px-4 py-2 text-xs" onClick={() => startEdit(review)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="px-4 py-2 text-xs text-error hover:text-error"
                        onClick={() => handleDelete(review)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => void fetchReviews(page + 1)}
                disabled={loading}
              >
                Load More Reviews
              </Button>
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <h3 className="mb-4 font-display text-base font-bold text-text-primary">
                {editingId ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-text-primary">Your rating</span>
                  <StarRating
                    value={formRating}
                    onChange={setFormRating}
                    size={28}
                    aria-label="Select a star rating"
                  />
                </div>
                <Input
                  label="Title (optional)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={200}
                />
                <div className="flex flex-col gap-1">
                  <label htmlFor="review-comment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Comment
                  </label>
                  <textarea
                    id="review-comment"
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    required
                    placeholder="Share your experience with this product..."
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                  />
                </div>
                {formError && (
                  <p className="text-xs font-medium text-error">{formError}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Submit Review'}
                  </Button>
                  <Button variant="outline" type="button" onClick={closeForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          {!isAuthenticated && (
            <p className="mt-6 text-sm text-text-secondary">
              <Link to="/login" className="font-semibold text-primary transition hover:underline">
                Log in
              </Link>{' '}
              to write a review.
            </p>
          )}
        </>
      )}
    </section>
  )
}
