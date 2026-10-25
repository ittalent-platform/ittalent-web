import { MemoryRouter } from 'react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { BroadcastNotificationsPage } from '@/features/admin/broadcast-notifications/broadcast-notifications-page';
import * as broadcastQueries from '@/features/admin/broadcast-notifications/broadcast-notifications.queries';
import type { BroadcastNotificationDto } from '@/features/admin/broadcast-notifications/broadcast-notifications.types';

import { ToastProvider } from '@/components/toast/toast-provider';

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const mockBroadcast1: BroadcastNotificationDto = {
  id: '67900124c8097df77a6e0001',
  title: 'Platform Maintenance Notice',
  content: 'The platform will be undergoing scheduled maintenance this Sunday midnight.',
  category: 'System Maintenance',
  targetAudience: 'All Users',
  priority: 'High',
  actionUrl: 'https://status.italent.com',
  actionLabel: 'Status Page',
  channels: ['In-App Inbox'],
  status: 'Sent',
  scheduledAt: null,
  sentAt: '2026-10-20T10:00:00.000Z',
  sender: {
    id: 'admin_1',
    email: 'admin@italent.com',
    fullName: 'System Administrator',
    role: 'admin',
  },
  deliveryMetrics: {
    targetedCount: 1500,
    deliveredCount: 1500,
    readCount: 1200,
    readPercentage: 80,
  },
  createdAt: '2026-10-20T09:30:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
};

const mockBroadcast2: BroadcastNotificationDto = {
  id: '67900124c8097df77a6e0002',
  title: 'Feature Release Announcement',
  content: 'Candidate portfolio links and project showcases are now available.',
  category: 'Feature Update',
  targetAudience: 'Applicants only',
  priority: 'Normal',
  channels: ['In-App Inbox'],
  status: 'Scheduled',
  scheduledAt: '2026-10-25T09:00:00.000Z',
  sentAt: null,
  deliveryMetrics: {
    targetedCount: 0,
    deliveredCount: 0,
    readCount: 0,
    readPercentage: 0,
  },
  createdAt: '2026-10-21T08:00:00.000Z',
  updatedAt: '2026-10-21T08:00:00.000Z',
};

describe('Broadcast Notifications Feature Tests (UC 01 - UC 07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page header, metric cards, and broadcast table', () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [mockBroadcast1, mockBroadcast2],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: { total: 2, drafts: 0, scheduled: 1, sent: 1 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    expect(screen.getByText('Broadcast Notifications')).toBeInTheDocument();
    expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Platform Maintenance Notice')).toBeInTheDocument();
    expect(screen.getByText('Feature Release Announcement')).toBeInTheDocument();
    expect(screen.getByText('Create Broadcast')).toBeInTheDocument();
  });

  it('opens Create Broadcast dialog when clicking Create Broadcast button', () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        summary: { total: 0, drafts: 0, scheduled: 0, sent: 0 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    const createBtn = screen.getByRole('button', { name: /create broadcast/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Compose an announcement message to broadcast across user accounts. You can dispatch immediately or save as draft.')).toBeInTheDocument();
  });

  it('validates required field lengths on submission', async () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        summary: { total: 0, drafts: 0, scheduled: 0, sent: 0 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    const createBtn = screen.getByRole('button', { name: /create broadcast/i });
    fireEvent.click(createBtn);

    // Try submitting empty form
    const publishBtn = screen.getByRole('button', { name: /publish broadcast/i });
    fireEvent.click(publishBtn);

    expect(await screen.findByText(/title must be at least 5 characters/i)).toBeInTheDocument();
  });

  it('opens detail drawer when clicking a broadcast item in the table', () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [mockBroadcast1],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: { total: 1, drafts: 0, scheduled: 0, sent: 1 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    vi.spyOn(broadcastQueries, 'useBroadcastDetailQuery').mockReturnValue({
      data: mockBroadcast1,
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastDetailQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    const rowItem = screen.getByText('Platform Maintenance Notice');
    fireEvent.click(rowItem);

    expect(screen.getByText('Message Content & Preview')).toBeInTheDocument();
    expect(screen.getByText('Delivery & Engagement Analytics')).toBeInTheDocument();
    expect(screen.getAllByText('Status Page').length).toBeGreaterThan(0);
  });

  it('blocks unsafe javascript: URLs from rendering as clickable links in detail dialog', () => {
    const maliciousBroadcast: BroadcastNotificationDto = {
      ...mockBroadcast1,
      id: 'malicious_1',
      title: 'Malicious Action Announcement',
      actionUrl: 'javascript:alert(1)',
      actionLabel: 'Click Me',
    };

    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [maliciousBroadcast],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: { total: 1, drafts: 0, scheduled: 0, sent: 1 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    vi.spyOn(broadcastQueries, 'useBroadcastDetailQuery').mockReturnValue({
      data: maliciousBroadcast,
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastDetailQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    fireEvent.click(screen.getByText('Malicious Action Announcement'));

    // Verify anchor with javascript: is NOT rendered
    const link = screen.queryByRole('link', { name: /click me/i });
    expect(link).toBeNull();
    expect(screen.getByText(/external link blocked for security/i)).toBeInTheDocument();
  });

  it('shows Archive action for Sent broadcasts and Reschedule action for Scheduled broadcasts in detail dialog', () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [mockBroadcast1, mockBroadcast2],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: { total: 2, drafts: 0, scheduled: 1, sent: 1 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    vi.spyOn(broadcastQueries, 'useBroadcastDetailQuery').mockReturnValue({
      data: mockBroadcast1, // Sent broadcast
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastDetailQuery>);

    const { unmount } = renderWithClient(<BroadcastNotificationsPage />);

    // Open Sent broadcast detail
    fireEvent.click(screen.getByText('Platform Maintenance Notice'));
    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();

    unmount();

    // Now test Scheduled broadcast detail
    vi.spyOn(broadcastQueries, 'useBroadcastDetailQuery').mockReturnValue({
      data: mockBroadcast2, // Scheduled broadcast
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastDetailQuery>);

    renderWithClient(<BroadcastNotificationsPage />);
    fireEvent.click(screen.getByText('Feature Release Announcement'));
    expect(screen.getByRole('button', { name: /reschedule/i })).toBeInTheDocument();
  });

  it('prompts confirmation modal before immediately publishing broadcast', async () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        summary: { total: 0, drafts: 0, scheduled: 0, sent: 0 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    // Open create dialog
    fireEvent.click(screen.getByRole('button', { name: /create broadcast/i }));

    // Fill valid form inputs
    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/message content/i);
    fireEvent.change(titleInput, { target: { value: 'Valid Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Valid announcement content exceeding ten chars' } });

    // Submit via Publish Broadcast button
    const publishBtn = screen.getByRole('button', { name: /publish broadcast/i });
    fireEvent.click(publishBtn);

    // Confirmation dialog should appear with confirm button
    expect(await screen.findByText(/publish to all users now\?/i)).toBeInTheDocument();
    expect(screen.getByText(/the announcement will be broadcast immediately/i)).toBeInTheDocument();
  });

  it('renders history timeline in detail dialog and offers duplicate action', () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [mockBroadcast1],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: { total: 1, drafts: 0, scheduled: 0, sent: 1 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    vi.spyOn(broadcastQueries, 'useBroadcastDetailQuery').mockReturnValue({
      data: mockBroadcast1,
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastDetailQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    // Open detail dialog
    fireEvent.click(screen.getByText('Platform Maintenance Notice'));

    // Check History timeline presence
    expect(screen.getByText(/announcement history/i)).toBeInTheDocument();
    expect(screen.getByText(/created announcement draft/i)).toBeInTheDocument();
    expect(screen.getByText(/dispatched to 1500 recipients/i)).toBeInTheDocument();

    // Check Duplicate button
    const duplicateBtn = screen.getByRole('button', { name: /duplicate/i });
    expect(duplicateBtn).toBeInTheDocument();

    // Click Duplicate -> should open Create Broadcast dialog prefilled with Copy
    fireEvent.click(duplicateBtn);
    expect(screen.getByDisplayValue('Platform Maintenance Notice (Copy)')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockBroadcast1.content)).toBeInTheDocument();
  });

  it('renders active filter chips when filters are applied and clears on Clear All', () => {
    vi.spyOn(broadcastQueries, 'useBroadcastsListQuery').mockReturnValue({
      data: {
        items: [mockBroadcast1],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: { total: 1, drafts: 0, scheduled: 0, sent: 1 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof broadcastQueries.useBroadcastsListQuery>);

    renderWithClient(<BroadcastNotificationsPage />);

    // Type search
    const searchInput = screen.getByPlaceholderText(/search by announcement title/i);
    fireEvent.change(searchInput, { target: { value: 'Maintenance' } });

    // Active filter chip should appear
    expect(screen.getByText(/active filters/i)).toBeInTheDocument();
    expect(screen.getByText(/search: "maintenance"/i)).toBeInTheDocument();

    // Clear all filters
    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllBtn);

    expect(screen.queryByText(/search: "maintenance"/i)).toBeNull();
  });
});


