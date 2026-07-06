interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  if (half) {
    return (
      <svg className="star-rating__star star-rating__star--half" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          fill="url(#halfGrad)"
          stroke="currentColor"
          strokeWidth="1.5"
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    );
  }
  return (
    <svg className={`star-rating__star ${filled ? 'star-rating__star--filled' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}

export function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<StarIcon key={i} filled />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarIcon key={i} filled={false} half />);
    } else {
      stars.push(<StarIcon key={i} filled={false} />);
    }
  }

  return (
    <span className={`star-rating star-rating--${size}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {stars}
      {count !== undefined && <span className="star-rating__count">({count})</span>}
    </span>
  );
}
