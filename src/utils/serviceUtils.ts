
import { RenovationType } from "@/types";

export const getCustomServices = (): RenovationType[] => {
  const storedServices = localStorage.getItem("renovationServices");
  if (storedServices) {
    return JSON.parse(storedServices);
  }
  // Fallback vers les services par défaut
  return [];
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
