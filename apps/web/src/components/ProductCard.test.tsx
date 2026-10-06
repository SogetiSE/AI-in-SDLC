import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';

const product = {
  id: '1',
  name: 'Zava Espresso Blend',
  description: 'Rich dark-roast coffee',
  price: 1899,
  imageUrl: '/images/espresso.jpg',
  category: 'Coffee',
  stock: 10,
};

function renderCard(stock = product.stock, onAddToCart?: () => void) {
  return render(
    <BrowserRouter>
      <ProductCard {...product} stock={stock} onAddToCart={onAddToCart} />
    </BrowserRouter>,
  );
}

describe('ProductCard', () => {
  it('renders product name', () => {
    renderCard();
    expect(screen.getByText('Zava Espresso Blend')).toBeDefined();
  });

  it('renders formatted price', () => {
    renderCard();
    expect(screen.getByText('$18.99')).toBeDefined();
  });

  it('renders category', () => {
    renderCard();
    expect(screen.getByText('Coffee')).toBeDefined();
  });

  it('links to product detail page', () => {
    renderCard();
    const links = screen.getAllByRole('link');
    expect(links[0].getAttribute('href')).toBe('/products/1');
  });

  it('shows Add to Cart button', () => {
    renderCard();
    expect(screen.getByText('Add to Cart')).toBeDefined();
  });

  it('shows Out of stock and prevents adding a zero-stock product to the cart', () => {
    const onAddToCart = vi.fn();
    renderCard(0, onAddToCart);

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Add to Cart' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it('allows adding an in-stock product to the cart without an Out of stock label', () => {
    const onAddToCart = vi.fn();
    renderCard(1, onAddToCart);

    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Add to Cart' });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onAddToCart).toHaveBeenCalledOnce();
  });
});
