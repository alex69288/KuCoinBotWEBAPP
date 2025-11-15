import React from 'react';
import { useTranslation } from 'react-i18next';

interface Position {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  timestamp: number;
  profit?: number;
  profitPercent?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  positions: Position[];
  currentPrice?: number;
}

const OpenPositionsModal: React.FC<Props> = ({ open, onClose, positions, currentPrice }) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full page-block">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('positions')}</h3>
          <button className="text-gray-500" onClick={onClose}>✖</button>
        </div>
        {positions.length === 0 ? (
          <p className="text-gray-500">{t('noOpenOrders')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('symbol')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('side')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('entryPrice')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('profit')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">% {t('profit')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positions.map((pos: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{pos.symbol}</td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${pos.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>{pos.side.toUpperCase()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{pos.amount}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{pos.entryPrice?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{(pos.profit || 0).toFixed(2)} USDT</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{(pos.profitPercent || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenPositionsModal;
