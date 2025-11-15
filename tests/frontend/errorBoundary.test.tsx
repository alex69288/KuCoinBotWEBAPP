/* @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../frontend/src/components/ErrorBoundary';

const Bomb: React.FC = () => {
  throw new Error('boom');
  // TS requires a return type; never executed, but helps typing
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return null as unknown as JSX.Element;
};

test('ErrorBoundary shows message when child throws', () => {
  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  );

  expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
});
