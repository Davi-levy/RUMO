import { Link } from "@tanstack/react-router";
import { ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AccountMenu } from "@/components/AccountMenu";

const publicLinks = [{ to: "/sobre", label: "Sobre" }] as const;

export function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <nav
      ref={nav}
      aria-label="Navegação principal"
      className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center gap-1 font-display text-xl font-bold tracking-[0.3em]"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          <span className="logo-outline">RUMO</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm lg:flex">
          <Link
            to="/"
            hash="como-funciona"
            hashScrollIntoView={{ behavior: "smooth", block: "start" }}
            className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Como funciona?
          </Link>
          {publicLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm sm:gap-5">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                Trilhas
              </Link>
              <AccountMenu key={user.id} user={user} />
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
          )}
          <button
            ref={menuButton}
            type="button"
            aria-controls="public-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"}
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground lg:hidden"
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div
          id="public-mobile-menu"
          className="border-t border-border bg-background px-6 py-4 lg:hidden"
        >
          <Link
            to="/"
            hash="como-funciona"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Como funciona?
          </Link>
          {publicLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
