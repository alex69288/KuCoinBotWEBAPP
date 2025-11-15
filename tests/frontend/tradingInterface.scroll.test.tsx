/* @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TradingProvider } from '../../frontend/src/context/TradingContext';
import TradingInterface from '../../frontend/src/components/TradingInterface';
import '../../frontend/src/i18n';

describe('TradingInterface scroll behavior', () => {
  test('top tabs should be horizontally scrollable and page should be vertically scrollable', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          // Отключаем автоматические запросы в тестах
          enabled: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TradingProvider>
          <TradingInterface />
        </TradingProvider>
      </QueryClientProvider>
    );

    const wrapper = screen.getByTestId('top-tabs-wrapper');
    const tabs = screen.getByTestId('top-tabs');
    const page = screen.getByTestId('page-container');

    expect(wrapper).toBeInTheDocument();
    expect(tabs).toBeInTheDocument();
    expect(page).toBeInTheDocument();

    expect(wrapper.className).toMatch(/overflow-x-auto/);
    expect(tabs.className).toMatch(/whitespace-nowrap/);
    expect(page.className).toMatch(/overflow-y-auto/);
  });
});
