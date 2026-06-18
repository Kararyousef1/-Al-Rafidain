/**
 * اختبارات وحدة لمكون Button
 * ════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/ui/Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>اضغط هنا</Button>);
    expect(screen.getByText('اضغط هنا')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>انقر</Button>);
    fireEvent.click(screen.getByText('انقر'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>معطل</Button>);
    fireEvent.click(screen.getByText('معطل'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not trigger click when loading', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>جار التحميل</Button>);
    fireEvent.click(screen.getByText('جار التحميل'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with primary variant by default', () => {
    const { container } = render(<Button>افتراضي</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('from-indigo-500');
  });

  it('renders with danger variant', () => {
    const { container } = render(<Button variant="danger">خطر</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-red-500');
  });

  it('renders with secondary variant', () => {
    const { container } = render(<Button variant="secondary">ثانوي</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-white');
  });

  it('renders with fullWidth when specified', () => {
    const { container } = render(<Button fullWidth>كامل</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('w-full');
  });

  it('renders with icon on the right by default', () => {
    const { container } = render(
      <Button icon={<span data-testid="icon">🔍</span>}>بحث</Button>
    );
    const button = container.querySelector('button');
    const icon = screen.getByTestId('icon');
    // يجب أن يأتي الأيقون بعد النص في DOM (بسبب iconPosition الافتراضي = right)
    expect(button?.innerHTML.indexOf('بحث')).toBeLessThan(button?.innerHTML.indexOf('🔍') ?? 0);
  });

  it('renders with icon on the left when specified', () => {
    const { container } = render(
      <Button icon={<span data-testid="icon">🔍</span>} iconPosition="left">بحث</Button>
    );
    const button = container.querySelector('button');
    expect(button?.innerHTML.indexOf('🔍')).toBeLessThan(button?.innerHTML.indexOf('بحث') ?? 0);
  });

  it('does not show icon when loading is true', () => {
    render(
      <Button icon={<span data-testid="icon">🔍</span>} loading>جار التحميل</Button>
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">زر</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders with different sizes', () => {
    const { container: small } = render(<Button size="sm">صغير</Button>);
    expect(small.querySelector('button')).toHaveClass('text-sm');
  });

  it('passes through additional props', () => {
    render(<Button type="submit" data-testid="submit-btn">إرسال</Button>);
    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
