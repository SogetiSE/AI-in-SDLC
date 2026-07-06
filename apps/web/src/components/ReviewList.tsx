import { useState, useEffect, useCallback } from 'react';
import { StarRating } from './StarRating';
import { api } from '../services/apiClient';

interface ReviewData {
  id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ReviewListProps {
  productId: string;
  refreshKey?: number;
}

export function ReviewList({ productId, refreshKey }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [aggregate, setAggregate] = useState({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProductReviews(productId, page);
      setReviews(res.data);
      setAggregate(res.aggregate);
      setTotal(res.total);
    } catch {
      // Silently handle — empty reviews state is fine
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshKey]);

  if (loading && reviews.length === 0) {
    return <div className="review-list__loading">Loading reviews...</div>;
  }

  return (
    <div className="review-list">
      {aggregate.reviewCount > 0 && (
        <div className="review-list__summary">
          <StarRating rating={aggregate.averageRating} size="md" />
          <span className="review-list__summary-text">
            {aggregate.averageRating.toFixed(1)} out of 5 ({aggregate.reviewCount} review{aggregate.reviewCount !== 1 ? 's' : ''})
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="review-list__empty">No reviews yet. Be the first to review this product!</p>
      ) : (
        <>
          <ul className="review-list__items">
            {reviews.map((review) => (
              <li key={review.id} className="review-list__item">
                <div className="review-list__item-header">
                  <span className="review-list__author">{review.userName}</span>
                  <StarRating rating={review.rating} size="sm" />
                  <span className="review-list__date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-list__text">{review.text}</p>
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
