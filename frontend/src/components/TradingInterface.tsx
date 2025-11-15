import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTradingContext } from '../context/TradingContext';
import { kucoinApi } from '../api/kucoin.api';
import { botApi } from '../api/bot.api';
import { useTranslation } from 'react-i18next';

interface DemoTrade {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: number;
}

const TradingInterface: React.FC = () => {
  const { t } = useTranslation();
  const { selectedSymbol, setSelectedSymbol, balance, setBalance } = useTradingContext();
  const [lastStartTime, setLastStartTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  // Bot state
  const [botEnabled, setBotEnabled] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('ema-ml');
  const [strategyConfig, setStrategyConfig] = useState<any>({});

  const queryClient = useQueryClient();

  // Fetch balance
  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ['balance'],
    queryFn: kucoinApi.getBalance,
    enabled: false, // Load on demand
  });

  // Fetch ticker
  const { data: tickerData } = useQuery({
    queryKey: ['ticker', selectedSymbol],
    queryFn: () => kucoinApi.getTicker(selectedSymbol),
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch order book
  const { data: orderBookData } = useQuery({
    queryKey: ['orderbook', selectedSymbol],
    queryFn: () => kucoinApi.getOrderBook(selectedSymbol),
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Fetch order history
  const { data: orderHistoryData } = useQuery({
    queryKey: ['orderHistory', selectedSymbol],
    queryFn: () => kucoinApi.getOrderHistory(selectedSymbol),
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch open orders
  const { data: openOrdersData } = useQuery({
    queryKey: ['openOrders', selectedSymbol],
    queryFn: () => kucoinApi.getOpenOrders(selectedSymbol),
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch trades
  const { data: tradesData } = useQuery({
    queryKey: ['trades', selectedSymbol],
    queryFn: () => kucoinApi.getTrades(selectedSymbol),
    refetchInterval: 15000, // Update every 15 seconds
  });

  // Fetch bot config
  const { data: botConfig } = useQuery({
    queryKey: ['botConfig'],
    queryFn: botApi.getConfig,
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Bot queries
  const { data: botStatus } = useQuery({
    queryKey: ['botStatus'],
    queryFn: botApi.getStatus,
    refetchInterval: 5000, // Update every 5 seconds
  });

  const { data: botStrategies } = useQuery({
    queryKey: ['botStrategies'],
    queryFn: botApi.getStrategies,
  });

  const { data: botStats } = useQuery({
    queryKey: ['botStats'],
    queryFn: botApi.getStats,
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch demo trades
  const { data: demoTrades = [] } = useQuery({
    queryKey: ['demoTrades'],
    queryFn: async () => {
      return await botApi.getDemoTrades();
    },
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch market update
  const { data: marketUpdate } = useQuery({
    queryKey: ['marketUpdate'],
    queryFn: botApi.getMarketUpdate,
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Mutations
  const toggleDemoMode = useMutation({
    mutationFn: async ({ enabled }: { enabled: boolean }) => {
      return await botApi.setDemoMode(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demoTrades'] });
    }
  });

  const clearDemoTrades = useMutation({
    mutationFn: async () => {
      return await botApi.clearDemoTrades();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demoTrades'] });
    }
  });

  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData);
    }
  }, [balanceData, setBalance]);

  // Sync bot status
  useEffect(() => {
    if (botStatus) {
      setBotEnabled(botStatus.isRunning);
      setSelectedStrategy(botStatus.config?.strategy || 'ema-ml');
    }
  }, [botStatus]);

  // Sync strategy config
  useEffect(() => {
    if (botConfig?.strategyConfig) {
      setStrategyConfig(botConfig.strategyConfig);
    }
  }, [botConfig]);

  // Health check for auto-reload on backend restart
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
        const data = await response.json();
        if (lastStartTime !== null && data.startTime !== lastStartTime) {
          console.log('Backend restarted, reloading page...');
          window.location.reload();
        }
        setLastStartTime(data.startTime);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    const interval = setInterval(checkHealth, 5000); // Check every 5 seconds
    checkHealth(); // Initial check

    return () => clearInterval(interval);
  }, [lastStartTime]);

  const handleStartBot = async () => {
    try {
      await botApi.startBot();
      alert(t('Бот успешно запущен!'));
    } catch (error) {
      console.error(error);
      alert(t('Ошибка запуска бота'));
    }
  };

  const handleStopBot = async () => {
    try {
      await botApi.stopBot();
      alert(t('Бот успешно остановлен!'));
    } catch (error) {
      console.error(error);
      alert(t('Ошибка остановки бота'));
    }
  };

  const handleStrategyChange = async (strategy: string) => {
    try {
      await botApi.updateConfig({ strategy });
      setSelectedStrategy(strategy);
      alert(t('Стратегия обновлена!'));
    } catch (error) {
      console.error(error);
      alert(t('Ошибка обновления стратегии'));
    }
  };

  const handleConfigUpdate = async (newConfig: any) => {
    try {
      await botApi.updateConfig({ strategyConfig: newConfig });
      setStrategyConfig(newConfig);
      console.log('Config updated successfully');
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleCancelOrder = async (orderId: string, symbol: string) => {
    try {
      await kucoinApi.cancelOrder(orderId, symbol);
      queryClient.invalidateQueries({ queryKey: ['openOrders'] });
      alert(t('orderCancelled'));
    } catch (error) {
      console.error(error);
      alert(t('failedToCancelOrder'));
    }
  };

  // Ensure demoTrades is always an array
  const safeDemoTrades = Array.isArray(demoTrades) ? demoTrades : [];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button onClick={() => setActiveTab('home')} className={`py-2 px-4 ${activeTab === 'home' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>{t('home')}</button>
          <button onClick={() => setActiveTab('status')} className={`py-2 px-4 ${activeTab === 'status' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>{t('statusTab')}</button>
          <button onClick={() => setActiveTab('account')} className={`py-2 px-4 ${activeTab === 'account' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>{t('account')}</button>
          <button onClick={() => setActiveTab('history')} className={`py-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>{t('history')}</button>
          <button onClick={() => setActiveTab('settings')} className={`py-2 px-4 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>{t('settings')}</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && (
          <>
            {/* Market Update */}
            {marketUpdate && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">{t('marketUpdate')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💰</span>
                      <span className="text-sm font-medium text-gray-700">{t('price')}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {marketUpdate.price ? `${marketUpdate.price.toFixed(2)} USDT` : 'N/A'}
                    </div>
                  </div>

                  {/* 24h Change Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">📊</span>
                      <span className="text-sm font-medium text-gray-700">24ч</span>
                    </div>
                    <div className={`text-lg font-bold ${marketUpdate.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marketUpdate.change24h ? `${marketUpdate.change24h.toFixed(2)}%` : 'N/A'}
                    </div>
                  </div>

                  {/* EMA Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">📈</span>
                      <span className="text-sm font-medium text-gray-700">EMA</span>
                    </div>
                    <div className={`text-lg font-bold ${marketUpdate.emaDirection === 'ВВЕРХ' ? 'text-green-600' : 'text-red-600'}`}>
                      {marketUpdate.emaDirection} ({marketUpdate.emaPercent ? marketUpdate.emaPercent.toFixed(2) : '0.00'}%)
                    </div>
                  </div>

                  {/* Signal Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🎯</span>
                      <span className="text-sm font-medium text-gray-700">{t('signal')}</span>
                    </div>
                    <div className={`text-lg font-bold ${marketUpdate.signal === 'buy' ? 'text-green-600' : marketUpdate.signal === 'sell' ? 'text-red-600' : 'text-gray-600'}`}>
                      {marketUpdate.signalText}
                    </div>
                  </div>

                  {/* ML Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🤖</span>
                      <span className="text-sm font-medium text-gray-700">ML</span>
                    </div>
                    <div className={`text-lg font-bold ${marketUpdate.mlConfidence > 0.6 ? 'text-green-600' : marketUpdate.mlConfidence < 0.4 ? 'text-red-600' : 'text-gray-600'}`}>
                      {marketUpdate.mlText} ({marketUpdate.mlPercent}%)
                    </div>
                  </div>

                  {/* Positions Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💼</span>
                      <span className="text-sm font-medium text-gray-700">{t('positions')}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {marketUpdate.openPositionsCount || 0} {t('open')}
                    </div>
                    {marketUpdate.openPositionsCount > 0 && (
                      <div className="text-sm text-gray-600">
                        {t('profit')}: {marketUpdate.profitPercent ? marketUpdate.profitPercent.toFixed(2) : '0.00'}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bot Statistics */}
            {botStats && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">{t('botStatistics')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{botStats.totalTrades || 0}</div>
                    <div className="text-sm text-gray-600">{t('totalTrades')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{botStats.winningTrades || 0}</div>
                    <div className="text-sm text-gray-600">{t('winningTrades')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{botStats.losingTrades || 0}</div>
                    <div className="text-sm text-gray-600">{t('losingTrades')}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${botStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${botStats.totalProfit?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">{t('totalPnL')}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'status' && (
          <>
            {/* Bot Control Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('botControl')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('botStatus')}</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${botEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {botEnabled ? t('running') : t('stopped')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('strategy')}</label>
                  <select
                    value={selectedStrategy}
                    onChange={(e) => handleStrategyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {botStrategies?.map((strategy: any) => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  {!botEnabled ? (
                    <button
                      onClick={handleStartBot}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {t('startBot')}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopBot}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {t('stopBot')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'account' && (
          <>
            {/* Balance Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('accountBalance')}</h2>
              <button
                onClick={() => refetchBalance()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
              >
                {t('loadBalance')}
              </button>
              {balance && (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('currency')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('available')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inOrders')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(balance)
                        .filter(([_, data]: [string, any]) => data.total > 0)
                        .map(([currency, data]: [string, any]) => (
                          <tr key={currency}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{currency}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.free?.toFixed(8) || '0'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.used?.toFixed(8) || '0'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.total?.toFixed(8) || '0'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {/* Order History */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('orderHistory')}</h2>
              {orderHistoryData && orderHistoryData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('symbol')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('side')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('price')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderHistoryData.slice(0, 20).map((order: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.symbol}</td>
                          <td className={`px-4 py-2 whitespace-nowrap text-sm ${order.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                            {order.side?.toUpperCase()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.amount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${order.price}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.status}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.timestamp || order.datetime).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">{t('noOrderHistory')}</p>
              )}
            </div>

            {/* Trades */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('recentTrades')}</h2>
              {tradesData && tradesData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('symbol')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('side')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('price')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('fee')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tradesData.slice(0, 20).map((trade: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{trade.symbol}</td>
                          <td className={`px-4 py-2 whitespace-nowrap text-sm ${trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.side?.toUpperCase()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{trade.amount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${trade.price}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{trade.fee?.cost} {trade.fee?.currency}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {new Date(trade.timestamp || trade.datetime).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">{t('noRecentTrades')}</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            {/* Strategy Configuration */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('strategyConfig')}</h2>
              {selectedStrategy === 'ema-ml' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fastPeriod')}</label>
                    <input
                      type="number"
                      value={strategyConfig.fastPeriod || 9}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, fastPeriod: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('slowPeriod')}</label>
                    <input
                      type="number"
                      value={strategyConfig.slowPeriod || 21}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, slowPeriod: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('emaThreshold')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={strategyConfig.emaThreshold || 0.1}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, emaThreshold: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('mlBuyThreshold')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={strategyConfig.mlBuyThreshold || 0.6}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, mlBuyThreshold: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('mlSellThreshold')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={strategyConfig.mlSellThreshold || 0.4}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, mlSellThreshold: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('takeProfitPercent')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={strategyConfig.takeProfitPercent || 2.0}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, takeProfitPercent: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('stopLossPercent')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={strategyConfig.stopLossPercent || 1.0}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, stopLossPercent: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('minHoldTime')}</label>
                    <input
                      type="number"
                      value={strategyConfig.minHoldTime || 5}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, minHoldTime: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={strategyConfig.trailingStop || false}
                      onChange={(e) => setStrategyConfig({ ...strategyConfig, trailingStop: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">{t('trailingStop')}</label>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={() => handleConfigUpdate(strategyConfig)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('saveConfig')}
                </button>
              </div>
            </div>

            {/* Demo Mode Control */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('demoMode')}</h2>
              <div className="space-y-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={() => toggleDemoMode.mutate({ enabled: true })}
                >
                  {t('enableDemoMode')}
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded"
                  onClick={() => toggleDemoMode.mutate({ enabled: false })}
                >
                  {t('disableDemoMode')}
                </button>
                <button
                  className="px-4 py-2 bg-yellow-500 text-white rounded"
                  onClick={() => clearDemoTrades.mutate()}
                >
                  {t('clearDemoTrades')}
                </button>
              </div>
              <h3 className="text-lg font-medium mt-6">{t('demoTrades')}</h3>
              <ul className="mt-4 space-y-2">
                {safeDemoTrades.map((trade: DemoTrade, index: number) => (
                  <li key={index} className="text-sm">
                    {t('tradeDescription', {
                      side: trade.side.toUpperCase(),
                      amount: trade.amount,
                      symbol: trade.symbol,
                      price: trade.price,
                      timestamp: new Date(trade.timestamp).toLocaleString(),
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TradingInterface;