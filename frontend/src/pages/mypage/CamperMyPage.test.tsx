import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as orgApi from '@/api/organization';
import CamperMyPage from './CamperMyPage';

// AuthContext mock
vi.mock('@/store/AuthContext', () => ({
  useAuth: () => ({
    user: { name: '한지은' },
  }),
}));

// react-router mock
vi.mock('react-router', () => ({
  useParams: () => ({ orgId: 'test-org-id' }),
}));

// SVG mock
interface IconProps {
  [key: string]: unknown;
}

vi.mock('@/assets/icons/user.svg?react', () => ({
  // eslint-disable-next-line react/jsx-props-no-spreading
  default: (props: IconProps) => <span data-testid="user-icon" {...props}>👤</span>,
}));
vi.mock('@/assets/icons/pencil.svg?react', () => ({
  // eslint-disable-next-line react/jsx-props-no-spreading
  default: (props: IconProps) => <span data-testid="pencil-icon" {...props}>✏️</span>,
}));
vi.mock('@/assets/icons/check.svg?react', () => ({
  // eslint-disable-next-line react/jsx-props-no-spreading
  default: (props: IconProps) => <span data-testid="check-icon" {...props}>✅</span>,
}));
vi.mock('@/assets/icons/x-mark.svg?react', () => ({
  // eslint-disable-next-line react/jsx-props-no-spreading
  default: (props: IconProps) => <span data-testid="x-mark-icon" {...props}>❌</span>,
}));

// Mock API
const mockProfile = {
  camperId: 'J283',
  name: '한지은',
  username: 'hanpengbutt',
  track: 'WEB' as const,
  groupNumber: 20,
  slackMemberId: null,
  profileUrl: 'https://example.com/avatar.jpg',
};

describe('CamperMyPage', () => {
  beforeEach(() => {
    vi.spyOn(orgApi, 'getMyCamperProfile').mockResolvedValue(mockProfile);
    vi.spyOn(orgApi, 'updateMyCamperProfile').mockResolvedValue({
      ...mockProfile,
      slackMemberId: 'U123456',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders camper name and ID after loading', async () => {
    render(<CamperMyPage />);
    
    await waitFor(() => {
        expect(screen.getByText('J283 한지은')).toBeInTheDocument();
    });
  });

  it('renders info rows correctly', async () => {
    render(<CamperMyPage />);
    
    await waitFor(() => {
        expect(screen.getByText('@hanpengbutt')).toBeInTheDocument();
        expect(screen.getByText('WEB')).toBeInTheDocument();
        expect(screen.getByText('WEB20')).toBeInTheDocument();
    });
  });

  it('updates slack ID via API', async () => {
    const user = userEvent.setup();
    render(<CamperMyPage />);

    await waitFor(() => {
        expect(screen.getByText('ID 등록하기')).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId('pencil-icon'));
    
    // Type ID
    const input = screen.getByPlaceholderText('Member ID');
    await user.type(input, 'U123456');
    
    // Click save
    await user.click(screen.getByTestId('check-icon'));

    // Verify API called
    expect(orgApi.updateMyCamperProfile).toHaveBeenCalledWith('test-org-id', { slackMemberId: 'U123456' });

    // Check if UI updated
    await waitFor(() => {
        expect(screen.getByText('U123456')).toBeInTheDocument();
    });
  });
});
