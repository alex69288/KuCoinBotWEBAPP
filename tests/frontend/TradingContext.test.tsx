/* @jest-environment jsdom */

import { render, screen, fireEvent } from '@testing-library/react';
import { TradingProvider, useTradingContext } from '../../frontend/src/context/TradingContext';

const TestComponent = () => {
  const { selectedSymbol, setSelectedSymbol } = useTradingContext();
  return (
    <div>
      <span>{selectedSymbol}</span>
      <button onClick={() => setSelectedSymbol('ETH/USDT')}>Change Symbol</button>
    </div>
  );
};

describe('TradingContext', () => {
  test('provides default selectedSymbol', () => {
    render(
      <TradingProvider>
        <TestComponent />
      </TradingProvider>
    );
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
  });

  test('allows changing selectedSymbol', async () => {
    render(
      <TradingProvider>
        <TestComponent />
      </TradingProvider>
    );
    const button = screen.getByText('Change Symbol');
    fireEvent.click(button);
    expect(await screen.findByText('ETH/USDT')).toBeInTheDocument();
  });
});