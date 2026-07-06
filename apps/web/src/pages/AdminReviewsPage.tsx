import { useState, useEffect, useCallback } from 'react';
import { StarRating } from '../components/StarRating';
import { api } from '../services/apiClient';

interface AdminReview {
  id: string;
  productName: string;
  userName: string;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await api.getAdminReviews(status, page);
      setReviews(res.data);
      setTotal(res.total);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleModerate(reviewId: string, status: 'approved' | 'rejected') {
    await api.moderateReview(reviewId, status);
    fetchReviews();
  }

  return (
    <div className="admin-reviews">
      <h1 className="admin-reviews__title">Review Moderation</h1>

      <div className="admin-reviews__filters">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`category-filter__chip${filter === s ? ' category-filter__chip--active' : ''}`}
            onClick={() => { setFilter(s); setPage(1); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">No reviews found.</div>
      ) : (
        <>
          <ul className="admin-reviews__list">
            {reviews.map((review) => (
              <li key={review.id} className="admin-reviews__item">
                <div className="admin-reviews__item-header">
                  <strong>{review.productName}</strong>
                  <span className="admin-reviews__author">by {review.userName}</span>
                  <StarRating rating={review.rating} size="sm" />
                  <span className={`status-badge status-badge--${review.status}`}>{review.status}</span>
                </div>
                <p className="admin-reviews__text">{review.text}</p>
                <div className="admin-reviews__actions">
                  <span className="admin-reviews__date">{new Date(review.createdAt).toLocaleDateString()}</span>
                  {review.status === 'pending' && (
                    <>
                      <button className="btn btn--primary btn--sm" onClick={() => handleModerate(review.id, 'approved')}>
                        Approve
                      </button>
                      <button className="btn btn--secondary btn--sm" onClick={() => handleModerate(review.id, 'rejected')}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {total > pageSize && (
            <div className="review-list__pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {Math.ceil(total / pageSize)}</span>
              <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
