import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logo-mark.png";
import { useTheme } from "@/lib/theme";

// Nav order/hrefs match the actual section ids and their top-to-bottom
// order on the landing page: problem → industries → features → how →
// portals → security → contact.
const nav = [
  { href: "#problem", label: "Why Us" },
  { href: "#industries", label: "Industries" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#portals", label: "Portals" },
  { href: "#security", label: "Security" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold tracking-tight">
          <img src={logoMark} alt="Indus Service Flow" className="h-9 w-9 object-contain" width={36} height={36} />
          <span className="hidden sm:inline">Indus <span className="text-primary">Service Flow</span></span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground xl:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="whitespace-nowrap transition-colors hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme" className="shrink-0">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="hidden lg:inline-flex">
            <Link to="/register-organization">Register Organization</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/book-appointment">Book Appointment</Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile / tablet menu — carries nav links plus any actions hidden
          by the responsive button classes above, so nothing is lost below xl. */}
      {open && (
        <div className="border-t border-border/60 bg-background xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {n.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3 md:hidden">
              <Button asChild size="sm" variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" variant="outline" onClick={() => setOpen(false)}>
                <Link to="/register-organization">Register Organization</Link>
              </Button>
              <Button asChild size="sm" className="sm:hidden" onClick={() => setOpen(false)}>
                <Link to="/book-appointment">Book Appointment</Link>
              </Button>
            </div>
            <div className="hidden md:flex lg:hidden">
              <Button asChild size="sm" variant="outline" className="w-full" onClick={() => setOpen(false)}>
                <Link to="/register-organization">Register Organization</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}