
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
}

const SearchBar = ({
  fullWidth = false,
  showButton = true,
  placeholder = "Je veux rénover :",
  initialValue = "",
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filtrer les suggestions basées sur le terme de recherche
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }

    const filtered = renovationTypes
      .filter(type => 
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        type.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(type => type.name);
    
    setSuggestions(filtered);
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
      className={`relative ${fullWidth ? "w-full" : "max-w-xl"}`}
    >
      <form onSubmit={handleSubmit} className="flex w-full items-center">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            className="pr-10 h-12 text-base"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {showButton && (
          <Button 
            type="submit" 
            className="ml-2 h-12 px-5"
            disabled={!searchTerm.trim()}
          >
            Continuer
          </Button>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-secondary text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
