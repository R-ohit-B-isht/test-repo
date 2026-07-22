import { Link, NavLink, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { useCart } from "../state/CartContext";
import { useTheme } from "../state/ThemeContext";
import Toggle from "./ui/Toggle";
import Label from "./ui/Label";

// Desktop horizontal text bar. Bracket style for the wordmark, pipe-implied
// gaps for nav. Active = text-display + accent dot. Inactive = text-disabled.
const NAV = [
  { to: "/", label: "CATALOG", end: true },
  { to: "/search", label: "SEARCH" },
  { to: "/cart", label: "CART" },
];

export default function Header() {
  const { count } = useCart();
  const { mode, toggle } = useTheme();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-black/95 backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-lg px-lg py-md">
        <Link to="/" className="font-display text-heading tracking-[-0.01em] text-text-display">
          [ NOTHING<span className="text-accent">·</span>MART ]
        </Link>

        <nav className="hidden items-center gap-lg md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="group flex items-center gap-xs"
            >
              {({ isActive }) => (
                <>
                  <span
                    className="h-[6px] w-[6px] rounded-pill"
                    style={{ backgroundColor: isActive ? "var(--accent)" : "transparent" }}
                  />
                  <span
                    className={[
                      "font-body text-label uppercase tracking-[0.08em]",
                      isActive ? "text-text-display" : "text-text-disabled group-hover:text-text-secondary",
                    ].join(" ")}
                  >
                    {item.label}
                    {item.to === "/cart" && count > 0 ? ` (${count})` : ""}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-lg">
          <Link
            to="/search"
            aria-label="Search"
            className="text-text-secondary hover:text-text-primary md:hidden"
          >
            <Search size={18} strokeWidth={1.5} />
          </Link>
          <div className="flex items-center gap-sm">
            <Label tone={mode === "light" ? "primary" : "disabled"}>LT</Label>
            <Toggle on={mode === "dark"} onChange={toggle} label="Toggle dark mode" />
            <Label tone={mode === "dark" ? "primary" : "disabled"}>DK</Label>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex items-center justify-center gap-lg border-t border-border py-sm md:hidden">
        {NAV.map((item) => {
          const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to}>
              <span
                className={[
                  "font-body text-label uppercase tracking-[0.08em]",
                  active ? "text-text-display" : "text-text-disabled",
                ].join(" ")}
              >
                {item.label}
                {item.to === "/cart" && count > 0 ? ` (${count})` : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
