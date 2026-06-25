import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/logo-mark.png";
import orchaspLogo from "@/assets/orchasp image.png";

export function SiteFooter() {
  return (
    <footer className="bg-[#1a3a6b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand + Powered by + Tagline + Buttons */}
          <div className="lg:col-span-2">
            {/* Logos row */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <img src={logoMark} alt="Indus Service Flow" className="h-14 w-14 object-contain" />
                <span className="text-[11px] font-semibold text-blue-200 leading-tight text-center">Indusayush</span>
              </div>
              <span className="text-base font-semibold text-blue-200 whitespace-nowrap">Powered by</span>
              <div className="flex flex-col items-center gap-1">
                <img src={orchaspLogo} alt="ORCHASP" className="h-14 w-14 object-contain" />
                <span className="text-[11px] font-semibold text-blue-200 leading-tight text-center">ORCHASP</span>
              </div>
            </div>

            {/* Tagline */}
            <p className="mt-5 text-sm text-blue-100 max-w-xs leading-relaxed">
              Assisting families stay organized, informed, and prepared.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex gap-3">
              <Link
                to="/login"
                search={{ redirect: undefined }}
                className="rounded-md bg-blue-500 hover:bg-blue-400 px-6 py-2 text-sm font-semibold text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register-organization"
                className="rounded-md border border-white/60 hover:border-white px-6 py-2 text-sm font-semibold text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Col 3: Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              <li>hello@indusflow.in</li>
              <li>+91 80 4711 2200</li>
              <li>Bengaluru · Mumbai · Delhi</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/20 pt-4 text-center text-xs text-blue-300">
          © {new Date().getFullYear()} Indus Service Flow. Powered by{" "}
          <a href="https://orchasp.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-white transition-colors">
            Orchasp
          </a>.
        </div>
      </div>
    </footer>
  );
}
