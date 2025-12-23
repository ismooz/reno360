import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Menu, Shield, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sanitizeUserData } from "@/utils/security";
import logo from "/reno360.png";

const Header = () => {
  const { user: rawUser, signOut, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Use server-verified admin status from isAdmin() hook
  const isAdminUser = isAdmin();
  
  // Navigation différente selon le rôle (server-verified)
  const navigationLinks = isAdminUser ? [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/projects", label: "Réalisations" },
    { to: "/admin", label: "Administration" },
    { to: "/contact", label: "Contact" },
  ] : [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/projects", label: "Réalisations" },
    { to: "/contact", label: "Contact" },
    { to: "/a-propos", label: "À Propos" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            {/* Remplacement du texte par l'image */}
            <img src={logo} alt="Reno360" className="h-8" />
          </Link>
        </div>
        
        {/* Navigation desktop et tablette */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
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
        <div className="hidden lg:flex items-center gap-3">
        {rawUser ? (
            <>
              {isAdminUser ? (
                <>
                  <Link to="/admin" className="text-sm font-medium flex items-center gap-2 hover:text-primary">
                    <Shield size={18} />
                    <span>Administration</span>
                  </Link>
                  <Link to="/dashboard" className="text-sm font-medium flex items-center gap-2 hover:text-primary">
                    <Settings size={18} />
                    <span>Tableau de bord</span>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="text-sm font-medium flex items-center gap-2 hover:text-primary">
                  <User size={18} />
                  <span>Mon compte</span>
                </Link>
              )}
              <Button variant="outline" size="default" onClick={signOut} className="flex items-center gap-2 h-10">
                <LogOut size={18} />
                <span>Déconnexion</span>
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
          {!isAdminUser && (
            <Link to="/contact">
              <Button size="default" className="h-10 whitespace-nowrap">
                Demander un devis
              </Button>
            </Link>
          )}
        </div>

        {/* Actions tablette (md-lg) */}
        <div className="hidden md:flex lg:hidden items-center gap-2">
          {rawUser ? (
            <>
              {isAdminUser ? (
                <>
                  <Link to="/admin" className="p-2 hover:text-primary">
                    <Shield size={20} />
                  </Link>
                  <Link to="/dashboard" className="p-2 hover:text-primary">
                    <Settings size={20} />
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="p-2 hover:text-primary">
                  <User size={20} />
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-1">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <LogIn size={16} />
              </Button>
            </Link>
          )}
          {!isAdminUser && (
            <Link to="/contact">
              <Button size="sm" className="whitespace-nowrap text-xs px-2">
                Devis
              </Button>
            </Link>
          )}
        </div>

        {/* Menu mobile */}
        <div className="md:hidden flex items-center gap-2">
          {rawUser && (
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
                  {rawUser ? (
                    <>
                      {isAdminUser ? (
                        <>
                          <Link 
                            to="/admin" 
                            className="flex items-center gap-2 text-lg font-medium hover:text-primary py-2"
                            onClick={() => setIsOpen(false)}
                          >
                            <Shield size={20} />
                            Administration
                          </Link>
                          <Link 
                            to="/dashboard" 
                            className="flex items-center gap-2 text-lg font-medium hover:text-primary py-2"
                            onClick={() => setIsOpen(false)}
                          >
                            <Settings size={20} />
                            Tableau de bord
                          </Link>
                        </>
                      ) : (
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-2 text-lg font-medium hover:text-primary py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          <User size={20} />
                          Mon compte
                        </Link>
                      )}
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
                  {!isAdminUser && (
                    <Link to="/contact" onClick={() => setIsOpen(false)}>
                      <Button className="w-full h-12">
                        Demande de devis
                      </Button>
                    </Link>
                  )}
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
