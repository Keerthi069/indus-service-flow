import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Waves className="h-4 w-4" /></span>
            Indus Service Flow
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Smart appointment and queue management for service-led businesses across India.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#how" className="hover:text-foreground">How It Works</a></li>
            <li><a href="#security" className="hover:text-foreground">Security</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Get Started</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/book-appointment" className="hover:text-foreground">Book Appointment</Link></li>
            <li><Link to="/register-organization" className="hover:text-foreground">Register Organization</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hello@indusflow.in</li>
            <li>+91 80 4711 2200</li>
            <li>Bengaluru · Mumbai · Delhi</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Indus Service Flow. Built for Indian service businesses.
      </div>
    </footer>
  );
}
