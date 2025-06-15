
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { renovationTypes } from "@/data/renovationTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  fullWidth?: boolean;
  showButton?: boolean;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const SearchBar = ({
  fullWidth = false,
  showButton = true,
  placeholder = "Je veux rénover :",
  initialValue = "",
  className = "",
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Termes de recherche supplémentaires pour améliorer l'autocomplétion
  const additionalSearchTerms = [
    "rénovation", "travaux", "aménagement", "transformation", "restauration",
    "modernisation", "réhabilitation", "amélioration", "embellissement",
    "ma cuisine", "ma salle de bain", "mon salon", "ma chambre", "mon bureau",
    "ma maison", "mon appartement", "mon studio", "ma villa", "mon loft",
    "mes combles", "mon sous-sol", "ma cave", "mon garage", "ma terrasse",
    "mon balcon", "mon jardin", "ma véranda", "mon grenier", "ma mezzanine"
  ];

  useEffect(() => {
    // Filtrer les suggestions basées sur le terme de recherche
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Suggestions des types de rénovation
    const typeMatches = renovationTypes
      .filter(type => 
        type.name.toLowerCase().includes(searchLower) || 
        type.description.toLowerCase().includes(searchLower)
      )
      .map(type => type.name);
    
    // Suggestions des termes supplémentaires
    const termMatches = additionalSearchTerms
      .filter(term => term.toLowerCase().includes(searchLower))
      .map(term => `${term.charAt(0).toUpperCase() + term.slice(1)}`);
    
    // Combinaisons intelligentes
    const combinations = [];
    if (searchLower.includes("cuisine")) {
      combinations.push("Rénovation de cuisine", "Cuisine moderne", "Cuisine équipée");
    }
    if (searchLower.includes("salle de bain")) {
      combinations.push("Rénovation de salle de bain", "Salle de bain moderne", "Douche à l'italienne");
    }
    if (searchLower.includes("peinture")) {
      combinations.push("Peinture intérieure", "Peinture extérieure", "Peinture décorative");
    }
    if (searchLower.includes("sol")) {
      combinations.push("Revêtement de sol", "Parquet", "Carrelage", "Sol stratifié");
    }
    
    // Combiner toutes les suggestions et limiter à 8 résultats
    const allSuggestions = [...new Set([...typeMatches, ...termMatches, ...combinations])];
    setSuggestions(allSuggestions.slice(0, 8));
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/formulaire?renovation=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setIsOpen(false);
  };

  return (
    <div 
      ref={wrapperRef} 
      className={`relative ${fullWidth ? "w-full" : "w-full max-w-4xl"} ${className}`}
    >
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 sm:gap-3">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            className="pr-12 h-12 sm:h-14 text-sm sm:text-base font-medium border-2 border-gray-200 focus:border-primary rounded-lg shadow-sm"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
        {showButton && (
          <Button 
            type="submit" 
            className="h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-lg shadow-sm"
            disabled={!searchTerm.trim()}
          >
            <span className="hidden sm:inline">Continuer</span>
            <span className="sm:hidden">Go</span>
          </Button>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 cursor-pointer hover:bg-secondary text-sm sm:text-base border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
