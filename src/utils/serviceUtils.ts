
export const getCustomServices = () => {
  const storedServices = localStorage.getItem("renovationServices");
  if (storedServices) {
    return JSON.parse(storedServices);
  }
  // Fallback vers les services par défaut
  return [];
};

export const getRenovationCategories = () => {
  const services = getCustomServices();
  const categories = [...new Set(services.map((service: any) => service.category))];
  return categories;
};

export const getRenovationsByCategory = (category: string) => {
  const services = getCustomServices();
  return services.filter((service: any) => service.category === category);
};
