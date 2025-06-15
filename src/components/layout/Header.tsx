
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User } from "lucide-react";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">reno360</span>
            <span className="text-md font-medium">.ch</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Accueil
          </Link>
          <Link to="/services" className="text-sm font-medium hover:text-primary">
            Services
          </Link>
          <Link to="/projects" className="text-sm font-medium hover:text-primary">
            Réalisations
          </Link>
          <Link to="/contact" className="text-sm font-medium hover:text-primary">
            Contact
          </Link>
          <Link to="/a-propos" className="text-sm font-medium hover:text-primary">
            À Propos
          </Link>
        </nav>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium flex items-center gap-2 hover:text-primary">
                <User size={18} />
                <span className="hidden md:inline">Mon compte</span>
              </Link>
              <Button variant="outline" size="default" onClick={signOut} className="flex items-center gap-2 h-10">
                <LogOut size={18} />
                <span className="hidden md:inline">Déconnexion</span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
                <LogIn size={18} />
                <span>Connexion</span>
              </Button>
            </Link>
          )}
          <Link to="/contact">
            <Button size="default" className="h-10">Demande de devis</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
