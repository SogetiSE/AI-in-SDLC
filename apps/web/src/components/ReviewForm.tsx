import { useState } from 'react';
import { StarRatingInput } from './StarRatingInput';
import { api, ApiError } from '../services/apiClient';

const MAX_REVIEW_TEXT_LENGTH = 2000;

interface ReviewFormProps {
  productId: string;
  onSubmitted: () => void;
}

export function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('zava_token');
  if (!token) {
    return <p className="review-form__login-prompt">Log in to write a review.</p>;
  }

  if (success) {
    return <p className="review-form__success">Thanks! Your review is pending approval.</p>;
  }

  const isValid = rating >= 1 && text.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      await api.submitReview({ productId, rating, text: text.trim() });
      setSuccess(true);
      onSubmitted();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError('You have already reviewed this product.');
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3 className="review-form__title">Write a Review</h3>
      <div className="review-form__field">
        <label className="review-form__label">Rating</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="review-form__field">
        <label className="review-form__label" htmlFor="review-text">Your review</label>
        <textarea
          id="review-text"
          className="review-form__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience with this product (min 10 characters)..."
          rows={4}
          maxLength={MAX_REVIEW_TEXT_LENGTH}
        />
        <span className="review-form__char-count">
          {text.length}/{MAX_REVIEW_TEXT_LENGTH}
        </span>
      </div>
      {error && <p className="review-form__error">{error}</p>}
      <button className="btn btn--primary" type="submit" disabled={!isValid || submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
