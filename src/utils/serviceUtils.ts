
import { RenovationType } from "@/types";
import { renovationTypes } from "@/data/renovationTypes";

export const getCustomServices = (): RenovationType[] => {
  const storedServices = localStorage.getItem("renovationServices");
  if (storedServices) {
    try {
      const parsed = JSON.parse(storedServices);
      return parsed.length > 0 ? parsed : renovationTypes;
    } catch {
      return renovationTypes;
    }
  }
  // Fallback vers les services par défaut
  return renovationTypes;
};

export const getRenovationCategories = (): string[] => {
  const services = getCustomServices();
  const categories = [...new Set(services.map((service: RenovationType) => service.category))];
  return categories;
};

export const getRenovationsByCategory = (category: string): RenovationType[] => {
  const services = getCustomServices();
  return services.filter((service: RenovationType) => service.category === category);
};
