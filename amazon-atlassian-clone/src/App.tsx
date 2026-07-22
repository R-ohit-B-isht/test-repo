import { RouterProvider, useRouter } from './context/RouterContext'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { FlagProvider } from './context/FlagContext'
import { Layout } from './components/Layout'
import { Flags } from './components/Flags'
import { Home } from './pages/Home'
import { ProductDetail } from './pages/ProductDetail'
import { Cart } from './pages/Cart'
import { Search } from './pages/Search'

function CurrentPage() {
  const { route } = useRouter()
  switch (route.name) {
    case 'home':
      return <Home />
    case 'product':
      return <ProductDetail id={route.id} />
    case 'cart':
      return <Cart />
    case 'search':
      return <Search query={route.query} category={route.category} />
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <FlagProvider>
        <CartProvider>
          <RouterProvider>
            <Layout>
              <CurrentPage />
            </Layout>
            <Flags />
          </RouterProvider>
        </CartProvider>
      </FlagProvider>
    </ThemeProvider>
  )
}
