import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { TabBar, TopTabs } from './components/TabBar'
import { Home } from './screens/Home'
import { ProductDetail } from './screens/ProductDetail'
import { Cart } from './screens/Cart'
import { Search } from './screens/Search'
import { ThemeProvider } from './state/ThemeContext'
import { CartProvider } from './state/CartContext'
import { ToastProvider } from './state/ToastContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function WideNav() {
  // A slim inline tab strip for wide screens, floating on the material.
  return (
    <div className="material hairline-b relative z-30 hidden sm:block">
      <div className="mx-auto flex max-w-[1100px] items-center justify-end px-md py-xs">
        <TopTabs />
      </div>
    </div>
  )
}

function Shell() {
  return (
    <div className="min-h-full bg-grouped text-label">
      <ScrollToTop />
      <WideNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/search" element={<Search />} />
      </Routes>
      <TabBar />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </ThemeProvider>
  )
}
