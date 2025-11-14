import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTradingStore } from '../store/trading.store';
import { kucoinApi } from '../api/kucoin.api';

const TradingInterface: React.FC = () => {
  const { selectedSymbol, setSelectedSymbol, balance, setBalance } = useTradingStore();
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

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

  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData);
    }
  }, [balanceData, setBalance]);

  const handleCreateOrder = async () => {
    try {
      await kucoinApi.createOrder({
        symbol: selectedSymbol,
        type: orderType,
        side: orderSide,
        amount: parseFloat(amount),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
      });
      // Reset form
      setAmount('');
      setPrice('');
      // Refetch balance
      refetchBalance();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleCancelOrder = async (orderId: string, symbol: string) => {
    try {
      await kucoinApi.cancelOrder(orderId, symbol);
      console.log('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          KuCoin Trading Bot
        </h1>

        {/* Balance Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
          <button
            onClick={() => refetchBalance()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Load Balance
          </button>
          {balance && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">In Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
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

        {/* Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Place Order</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol
                </label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="ADA/USDT">ADA/USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOrderType('limit')}
                    className={`px-3 py-1 rounded ${orderType === 'limit'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    Limit
                  </button>
                  <button
                    onClick={() => setOrderType('market')}
                    className={`px-3 py-1 rounded ${orderType === 'market'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    Market
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Side
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`px-3 py-1 rounded ${orderSide === 'buy'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`px-3 py-1 rounded ${orderSide === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter amount"
                />
              </div>

              {orderType === 'limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter price"
                  />
                </div>
              )}

              <button
                onClick={handleCreateOrder}
                disabled={!amount || (orderType === 'limit' && !price)}
                className={`w-full py-2 rounded font-medium ${orderSide === 'buy'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol}
              </button>
            </div>
          </div>

          {/* Market Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticker */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Market Data</h2>
              {tickerData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Last Price</p>
                    <p className="text-lg font-semibold">${tickerData.last}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">24h Change</p>
                    <p className={`text-lg font-semibold ${tickerData.percentage > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {tickerData.percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">24h High</p>
                    <p className="text-lg font-semibold">${tickerData.high}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">24h Low</p>
                    <p className="text-lg font-semibold">${tickerData.low}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Book */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Book</h2>
              {orderBookData && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-red-600 mb-2">Asks</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {orderBookData.asks?.slice(0, 10).map((ask: any[], index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-red-600">${ask[0]}</span>
                          <span>{ask[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-green-600 mb-2">Bids</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {orderBookData.bids?.slice(0, 10).map((bid: any[], index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-green-600">${bid[0]}</span>
                          <span>{bid[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Open Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Open Orders</h2>
              {openOrdersData && openOrdersData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {openOrdersData.slice(0, 10).map((order: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.symbol}</td>
                          <td className={`px-4 py-2 whitespace-nowrap text-sm ${order.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                            {order.side?.toUpperCase()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.type}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.amount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${order.price}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.timestamp || order.datetime).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => handleCancelOrder(order.id, order.symbol)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No open orders</p>
              )}
            </div>

            {/* Order History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order History</h2>
              {orderHistoryData && orderHistoryData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderHistoryData.slice(0, 10).map((order: any, index: number) => (
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
                <p className="text-gray-500">No order history available</p>
              )}
            </div>

            {/* Trades */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
              {tradesData && tradesData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tradesData.slice(0, 10).map((trade: any, index: number) => (
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
                <p className="text-gray-500">No recent trades</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;