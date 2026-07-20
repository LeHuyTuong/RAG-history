import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from './Pagination';

describe('Pagination Component', () => {
  it('should not render anything if totalPages <= 1', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the correct number of pages and dots', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);
    
    // Pages expected: 1, ..., 4, 5, 6, ..., 10
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // There should be two sets of dots
    const dots = screen.getAllByText('...');
    expect(dots).toHaveLength(2);
  });

  it('should disable previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
    
    const prevButton = screen.getByText('chevron_left').parentElement;
    expect(prevButton).toBeDisabled();
    
    const nextButton = screen.getByText('chevron_right').parentElement;
    expect(nextButton).not.toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />);
    
    const prevButton = screen.getByText('chevron_left').parentElement;
    expect(prevButton).not.toBeDisabled();
    
    const nextButton = screen.getByText('chevron_right').parentElement;
    expect(nextButton).toBeDisabled();
  });

  it('should trigger onPageChange with correct arguments', () => {
    const onPageChangeMock = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChangeMock} />);
    
    // Click page 4
    fireEvent.click(screen.getByText('4'));
    expect(onPageChangeMock).toHaveBeenCalledWith(4);
    
    // Click Next button
    const nextButton = screen.getByText('chevron_right').parentElement;
    fireEvent.click(nextButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(4); // 3 + 1
    
    // Click Previous button
    const prevButton = screen.getByText('chevron_left').parentElement;
    fireEvent.click(prevButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(2); // 3 - 1
  });
});
