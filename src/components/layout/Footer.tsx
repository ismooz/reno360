
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary py-10 border-t">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">reno360.ch</h3>
            <p className="text-sm text-muted-foreground">
              Entreprise de rénovation de qualité, partout en Suisse.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/service/peinture" className="text-sm text-muted-foreground hover:text-primary">
                  Peinture
                </Link>
              </li>
              <li>
                <Link to="/service/plomberie" className="text-sm text-muted-foreground hover:text-primary">
                  Plomberie
                </Link>
              </li>
              <li>
                <Link to="/service/electricite" className="text-sm text-muted-foreground hover:text-primary">
                  Électricité
                </Link>
              </li>
              <li>
                <Link to="/service/chauffage" className="text-sm text-muted-foreground hover:text-primary">
                  Chauffage
                </Link>
              </li>
              <li>
                <Link to="/service/isolation" className="text-sm text-muted-foreground hover:text-primary">
                  Isolation
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold mb-4">Informations</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/a-propos" className="text-sm text-muted-foreground hover:text-primary">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/conditions" className="text-sm text-muted-foreground hover:text-primary">
                  Conditions générales
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold mb-4">Contact</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Route de Saint-Aubin 70<br />
              1565 Missy, Vaud
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              <a href="tel:+41218881010" className="hover:text-primary">+41 21 888 10 10</a>
            </p>
            <p className="text-sm text-muted-foreground">
              <a href="mailto:info@reno360.ch" className="hover:text-primary">info@ren360.ch</a>
            </p>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-muted">
          <p className="text-sm text-center text-muted-foreground">
            © {new Date().getFullYear()} reno360.ch. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
