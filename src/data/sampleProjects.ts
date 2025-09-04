import { Project } from "@/types";

export const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Rénovation complète d'un appartement",
    year: 2023,
    description: "Rénovation complète d'un appartement de 3.5 pièces à Lausanne. Transformation totale avec nouvelle cuisine, salle de bain moderne et parquet dans toutes les pièces.",
    images: [
      "/src/assets/renovation-1.jpg",
      "/src/assets/renovation-2.jpg",
      "/src/assets/renovation-3.jpg"
    ],
    beforeAfterImages: {
      before: "/src/assets/renovation-1.jpg",
      after: "/src/assets/renovation-2.jpg"
    }
  },
  {
    id: "2", 
    name: "Modernisation d'une cuisine",
    year: 2023,
    description: "Transformation d'une cuisine traditionnelle en espace moderne et fonctionnel avec îlot central et électroménagers de dernière génération.",
    images: [
      "/src/assets/services/cuisine.jpg",
      "/src/assets/renovation-4.jpg"
    ]
  },
  {
    id: "3",
    name: "Rénovation de salle de bain",
    year: 2024,
    description: "Création d'une salle de bain contemporaine avec douche à l'italienne, double vasque et carrelage effet marbre.",
    images: [
      "/src/assets/services/salle_de_bain.jpg",
      "/src/assets/renovation-5.jpg"
    ],
    beforeAfterImages: {
      before: "/src/assets/renovation-4.jpg",
      after: "/src/assets/services/salle_de_bain.jpg"
    }
  }
];