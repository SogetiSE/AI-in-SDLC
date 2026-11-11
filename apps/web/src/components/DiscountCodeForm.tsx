import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AppliedDiscount } from '@zava/shared';
import { formatPrice } from '@zava/shared';

interface DiscountCodeFormProps {
  discount: AppliedDiscount | null;
  error: string | null;
  pending: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
}

/**
 * Enter or remove a discount code. The input stays visible while a code is applied,
 * so trying a second code shows the server's "only one code" message (issue #3).
 */
export function DiscountCodeForm({ discount, error, pending, onApply, onRemove }: DiscountCodeFormProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = code.trim();

  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  const appliedCode = discount?.code;
  useEffect(() => {
    if (appliedCode) setCode('');
  }, [appliedCode]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || pending) return;
    onApply(trimmed);
  };

  return (
    <div className="discount-form">
      {discount && (
        <div className="discount-form__applied">
          <span>
            <strong>{discount.code}</strong> applied
          </span>
          <span className="discount-form__amount">−{formatPrice(discount.amount)}</span>
          <button
            type="button"
            className="btn btn--secondary discount-form__remove"
            onClick={onRemove}
            disabled={pending}
            aria-label={`Remove discount code ${discount.code}`}
          >
            Remove
          </button>
        </div>
      )}
      <form className="discount-form__row" onSubmit={submit} noValidate>
        <label className="checkout__label" htmlFor="discount-code">
          Discount code
        </label>
        <div className="discount-form__controls">
          <input
            ref={inputRef}
            id="discount-code"
            className="checkout__input"
            type="text"
            autoComplete="off"
            maxLength={32}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'discount-code-error' : undefined}
          />
          <button type="submit" className="btn btn--primary" disabled={!trimmed || pending}>
            {pending ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </form>
      {error && (
        <p id="discount-code-error" className="discount-form__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
