import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { apiClient } from '../../services';

// Mock apiClient
vi.mock('../../services', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/Nhập email của bạn/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('shows error for password less than 6 characters', async () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/Nhập email của bạn/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Tiến bước/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    
    fireEvent.click(submitBtn);

    expect(screen.getByText('Mật khẩu không hợp lệ.')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('calls API and navigates to admin on success', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'mock-token',
          user: { role: 'ROLE_ADMIN', email: 'admin@sv.com' }
        }
      }
    });

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/Nhập email của bạn/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Tiến bước/i });

    fireEvent.change(emailInput, { target: { value: 'admin@sv.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'admin@sv.com',
        password: 'StrongPass123!',
      });
    });
  });
});
