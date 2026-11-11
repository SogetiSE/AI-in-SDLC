import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiscountCodeForm } from './DiscountCodeForm';

const applied = { code: 'WELCOME10', percentOff: 10, amount: 1109 };

function setup(props: Partial<Parameters<typeof DiscountCodeForm>[0]> = {}) {
  const onApply = vi.fn();
  const onRemove = vi.fn();
  const utils = render(
    <DiscountCodeForm discount={null} error={null} pending={false} onApply={onApply} onRemove={onRemove} {...props} />,
  );
  return { ...utils, onApply, onRemove, input: screen.getByLabelText('Discount code') as HTMLInputElement };
}

describe('DiscountCodeForm', () => {
  it('input has an accessible label', () => {
    const { input } = setup();
    expect(input.tagName).toBe('INPUT');
  });

  it('submits trimmed input via onApply', () => {
    const { input, onApply } = setup();
    fireEvent.change(input, { target: { value: '  welcome10 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('welcome10');
  });

  it('Apply disabled while pending or empty', () => {
    const { input, rerender, onApply, onRemove } = setup();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    fireEvent.change(input, { target: { value: 'WELCOME10' } });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
    rerender(<DiscountCodeForm discount={null} error={null} pending onApply={onApply} onRemove={onRemove} />);
    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();
  });

  it('with a discount applied, submitting another code calls onApply and the 409 alert renders while the applied code stays', () => {
    const { input, onApply, onRemove, rerender } = setup({ discount: applied });
    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'BREW15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('BREW15');

    const message = 'Only one discount code can be used per order. Remove WELCOME10 to use a different code.';
    rerender(<DiscountCodeForm discount={applied} error={message} pending={false} onApply={onApply} onRemove={onRemove} />);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('−$11.09')).toBeInTheDocument();
  });

  it('focus returns to the input after an error', () => {
    const { input, onApply, onRemove, rerender } = setup();
    fireEvent.change(input, { target: { value: 'NOPE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    input.blur();
    rerender(
      <DiscountCodeForm discount={null} error="This discount code is not valid." pending={false} onApply={onApply} onRemove={onRemove} />,
    );
    expect(input).toHaveFocus();
  });

  it('Remove calls onRemove', () => {
    const { onRemove } = setup({ discount: applied });
    fireEvent.click(screen.getByRole('button', { name: 'Remove discount code WELCOME10' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
