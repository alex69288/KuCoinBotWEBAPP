/* @jest-environment jsdom */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TradingProvider } from '../../frontend/src/context/TradingContext';
import TradingInterface from '../../frontend/src/components/TradingInterface';
import '../../frontend/src/i18n';
import { botApi } from '../../frontend/src/api/bot.api';

describe('Open Positions modal', () => {
  test('shows modal with positions list when button is clicked', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
        }
      }
    });

    const mockUpdate = {
      symbol: 'BTC/USDT',
      price: 10000,
      change24h: 0.2,
      change24hAmount: 20,
      emaDirection: 'ВВЕРХ',
      emaPercent: 0.1,
      signal: 'buy',
      signalText: 'ПОКУПКА',
      mlConfidence: 0.7,
      mlPercent: '70.0',
      mlText: 'ВВЕРХ',
      openPositionsCount: 1,
      positionsList: [{ symbol: 'BTC/USDT', side: 'buy', amount: 0.001, entryPrice: 9000, timestamp: Date.now(), profit: 100, profitPercent: 1.11 }],
      positionSize: 0.001,
      stakeSize: 10,
      entryPrice: 9000
    };

    jest.spyOn(botApi, 'getMarketUpdate' as any).mockResolvedValue(mockUpdate);
    // mock global fetch used in health check
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => ({ startTime: 0 }) });

    render(
      <QueryClientProvider client={queryClient}>
        <TradingProvider>
          <TradingInterface />
        </TradingProvider>
      </QueryClientProvider>
    );

    // Wait for the market card to appear
    await waitFor(() => expect(screen.getByText(/24ч/i)).toBeInTheDocument());

    // Modal not visible initially
    expect(screen.queryByText(/Подробнее/i)).toBeInTheDocument();

    // Click the view button
    fireEvent.click(screen.getByText(/Подробнее/i));

    // Expect modal with symbol and profit to appear
    await waitFor(() => expect(screen.getByText('BTC/USDT')).toBeInTheDocument());
    expect(screen.getByText(/100.00 USDT/)).toBeInTheDocument();
  });
});
