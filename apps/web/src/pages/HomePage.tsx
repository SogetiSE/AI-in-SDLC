import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { api } from '../services/apiClient';

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);
  const deferredCategory = useDeferredValue(selectedCategory === 'All' ? undefined : selectedCategory);
  const { products, loading, error } = useProducts(deferredCategory);
  const { addItem, error: cartError } = useCart();

  useEffect(() => {
    let active = true;

    api
      .getCategories()
      .then((response) => {
        if (active) {
          setCategories(response.data);
        }
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const categoryOptions = ['All', ...categories];

  const handleSelectCategory = (category: string) => {
    startTransition(() => {
      setSelectedCategory(category);
    });
  };

  return (
    <>
      <section className="hero-panel">
        <div className="hero-panel__content">
          <span className="hero-panel__eyebrow">New Season Collection</span>
          <h1 className="hero-panel__title">Elevate every cup, every ritual, every day.</h1>
          <p className="hero-panel__copy">
            Discover our curated selection of specialty coffee, precision brewing gear, and lifestyle accessories designed for those who appreciate the finer details.
          </p>
        </div>
        <div className="hero-panel__aside">
          <div className="hero-note">
            <span className="hero-note__label">Collections</span>
            <p>From single-origin espresso blends to handcrafted brewing equipment and everyday carry essentials.</p>
          </div>
          <div className="hero-note">
            <span className="hero-note__label">Free Shipping</span>
            <p>Complimentary shipping on all orders over $75. Crafted with care, delivered to your door.</p>
          </div>
        </div>
      </section>

      <section className="catalog-shell">
        <div className="catalog-shell__header">
          <div>
            <h2 className="page-title">Curated Collections</h2>
            <p className="catalog-shell__copy">Browse by category to find exactly what you're looking for.</p>
          </div>
          <div className="category-filter" role="tablist" aria-label="Filter products by category">
            {categoryOptions.map((category) => (
              <button
                key={category}
                className={`category-filter__chip${selectedCategory === category ? ' category-filter__chip--active' : ''}`}
                onClick={() => {
                  handleSelectCategory(category);
                }}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="loading">Loading products...</div> : null}
        {error ? <div className="empty-state">Error: {error}</div> : null}
        {cartError ? <div className="empty-state">Cart error: {cartError}</div> : null}

        {!loading && !error ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                imageUrl={product.imageUrl}
                category={product.category}
                averageRating={product.rating?.averageRating}
                reviewCount={product.rating?.reviewCount}
                onAddToCart={() => {
                  void addItem(product.id, 1);
                }}
              />
            ))}
          </div>
        ) : null}

        {!loading && !error && products.length === 0 ? <div className="empty-state">No products available.</div> : null}
      </section>
    </>
  );
}
