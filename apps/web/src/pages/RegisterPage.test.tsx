import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { useRegister } from '../features/auth/useAuth';
import { useAuthStore } from '../store/authStore';


vi.mock('../features/auth/useAuth', () => ({
  useRegister: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock, useLocation: () => ({ state: null }) };
});

// A component to mock the global store's state changes triggering effects
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('navigates to Dashboard upon successful registration because authStatus becomes authenticated', async () => {
    const user = userEvent.setup();

    const registerMutate = vi.fn().mockImplementation((payload) => {
      // Simulate what the real useRegister's onSuccess does: update the store
      useAuthStore.getState().setSession({ id: '1', email: payload.email }, 'fake-token');
    });

    vi.mocked(useRegister).mockReturnValue({
      mutate: registerMutate,
      isPending: false,
      error: null,
    } as never);

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/i), 'password1234');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'password1234');

    await user.click(screen.getByRole('button', { name: /Create account/i }));

    expect(registerMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password1234' }
    );

    // Because the store updated to 'authenticated', the useEffect in RegisterPage
    // should have navigated to '/'
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows an error if passwords do not match', async () => {
    const user = userEvent.setup();
    vi.mocked(useRegister).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as never);

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/i), 'password1234');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'password4321');

    await user.click(screen.getByRole('button', { name: /Create account/i }));

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('shows an error if password is too short', async () => {
    const user = userEvent.setup();
    vi.mocked(useRegister).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as never);

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/i), 'short');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'short');

    await user.click(screen.getByRole('button', { name: /Create account/i }));

    expect(screen.getByText(/Password must be at least 12 characters/i)).toBeInTheDocument();
  });
});
