
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigationLinks = [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/projects", label: "Réalisations" },
    { to: "/contact", label: "Contact" },
    { to: "/a-propos", label: "À Propos" },
  ];

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">reno360</span>
            <span className="text-md font-medium">.ch</span>
          </Link>
        </div>
        
        {/* Navigation desktop */}
        <nav className="hidden lg:flex items-center gap-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium flex items-center gap-2 hover:text-primary">
                <User size={18} />
                <span className="hidden lg:inline">Mon compte</span>
              </Link>
              <Button variant="outline" size="default" onClick={signOut} className="flex items-center gap-2 h-10">
                <LogOut size={18} />
                <span className="hidden lg:inline">Déconnexion</span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
                <LogIn size={18} />
                <span className="hidden lg:inline">Connexion</span>
              </Button>
            </Link>
          )}
          <Link to="/contact">
            <Button size="default" className="h-10 whitespace-nowrap">
              Demander un devis
            </Button>
          </Link>
        </div>

        {/* Menu mobile */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <Link to="/dashboard" className="p-2">
              <User size={20} />
            </Link>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu size={20} />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 pt-6">
                <nav className="flex flex-col gap-4">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-lg font-medium hover:text-primary py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                
                <div className="flex flex-col gap-3 pt-4 border-t">
                  {user ? (
                    <>
                      <Link 
                        to="/dashboard" 
                        className="flex items-center gap-2 text-lg font-medium hover:text-primary py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <User size={20} />
                        Mon compte
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }} 
                        className="flex items-center gap-2 justify-start h-12"
                      >
                        <LogOut size={20} />
                        Déconnexion
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="flex items-center gap-2 justify-start w-full h-12">
                        <LogIn size={20} />
                        Connexion
                      </Button>
                    </Link>
                  )}
                  <Link to="/contact" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12">
                      Demande de devis
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
