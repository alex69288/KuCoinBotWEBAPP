import TradingInterface from './components/TradingInterface'
import { TradingProvider } from './context/TradingContext'
import './i18n'

function App() {
  return (
    <TradingProvider>
      <TradingInterface />
    </TradingProvider>
  )
}

export default App