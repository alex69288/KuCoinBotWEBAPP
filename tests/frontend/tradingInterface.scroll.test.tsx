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

    // Проверяем, что верхнее меню приклеено при скролле и имеет границу по всей ширине
    expect(wrapper.className).toMatch(/sticky|top-0/);
    expect(wrapper.className).toMatch(/border-b/);

    // Контейнер страницы должен подстраиваться под высоту контента (убрали `min-h-screen`)
    expect(page.className).not.toMatch(/min-h-screen/);

    // Убедимся, что у контейнера нет горизонтального padding (удалили p-4)
    expect(page.className).not.toMatch(/\bp-4\b/);
    // Убедимся, что теперь используется вертикальный padding: 1rem сверху и 1.5rem снизу (pt-4 pb-6)
    expect(page.className).toMatch(/pt-4/);
    expect(page.className).toMatch(/pb-6/);
    // Убедимся, что wrapper не использует компенсацию ширины (-mx-4 px-4)
    expect(wrapper.className).not.toMatch(/-mx-4/);
    expect(wrapper.className).not.toMatch(/px-4/);
  });
});
