import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logo-mark.png";
import { useTheme } from "@/lib/theme";

const nav = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#security", label: "Security" },
  { href: "#portals", label: "Portals" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold tracking-tight">
          <img src={logoMark} alt="Indus Service Flow" className="h-9 w-9 object-contain" width={36} height={36} />
          <span className="hidden sm:inline">Indus <span className="text-primary">Service Flow</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          {nav.map(n => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm" variant="ghost"><Link to="/login">Login</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/register-organization">Register Organization</Link></Button>
          <Button asChild size="sm"><Link to="/book-appointment">Book Appointment</Link></Button>
        </div>
      </div>
    </header>
  );
}
