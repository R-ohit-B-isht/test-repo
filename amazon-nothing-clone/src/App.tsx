import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import SearchPage from "./pages/Search";

export default function App() {
  return (
    <div className="flex min-h-full flex-col bg-black">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-md px-lg py-lg">
          <span className="font-body text-label uppercase tracking-[0.08em] text-text-disabled">
            [ NOTHING·MART ] — DESIGN PREVIEW
          </span>
          <span className="font-body text-label uppercase tracking-[0.08em] text-text-disabled">
            SAMPLE DATA · NOT A REAL STORE
          </span>
        </div>
      </footer>
    </div>
  );
}
