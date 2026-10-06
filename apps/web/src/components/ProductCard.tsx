import { Link } from 'react-router-dom';
import { formatPrice } from '@zava/shared';
import { StarRating } from './StarRating';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  onAddToCart?: () => void;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  category,
  stock,
  averageRating,
  reviewCount,
  onAddToCart,
}: ProductCardProps): JSX.Element {
  return (
    <div className="product-card">
      <div className="product-card__media">
        <Link to={`/products/${id}`}>
          <img className="product-card__image" src={imageUrl} alt={name} loading="lazy" />
        </Link>
        <div className="product-card__topline">
          <span className="product-card__category">{category}</span>
          <span className="product-card__label">{stock === 0 ? 'Out of stock' : 'Curated'}</span>
        </div>
      </div>
      <div className="product-card__body">
        <Link to={`/products/${id}`}>
          <h3 className="product-card__name">{name}</h3>
        </Link>
        {reviewCount !== undefined && reviewCount > 0 && (
          <div className="product-card__rating">
            <StarRating rating={averageRating ?? 0} count={reviewCount} size="sm" />
          </div>
        )}
        <p className="product-card__description">{description}</p>
        <p className="product-card__price">{formatPrice(price)}</p>
      </div>
      <div className="product-card__actions">
        <button className="btn btn--primary btn--full" disabled={stock === 0} onClick={onAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
