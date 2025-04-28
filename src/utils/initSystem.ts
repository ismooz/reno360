
import { User } from "@/types";

export const initSystem = () => {
  // Vérifier si des utilisateurs existent
  const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
  
  // Si aucun utilisateur, créer un administrateur par défaut
  if (storedUsers.length === 0) {
    const now = new Date().toISOString();
    const adminUser = {
      id: "1",
      email: "admin@reno360.ch",
      name: "Administrateur",
      createdAt: now,
      lastLogin: now,
      role: "admin",
      status: "active",
      password: "admin123", // Dans une vraie application, ce serait hashé
      requestCount: 0
    };
    
    localStorage.setItem("users", JSON.stringify([adminUser]));
    console.log("Administrateur par défaut créé");
  }
};

export const getUserStatistics = () => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const requests = JSON.parse(localStorage.getItem("renovationRequests") || "[]");
  
  const activeUsers = users.filter((u: User) => u.status === "active").length;
  const inactiveUsers = users.filter((u: User) => u.status === "inactive").length;
  const deletedUsers = users.filter((u: User) => u.status === "deleted").length;
  
  const pendingRequests = requests.filter((r: any) => r.status === "pending").length;
  const activeRequests = requests.filter((r: any) => r.status === "approved" || r.status === "in-progress").length;
  const completedRequests = requests.filter((r: any) => r.status === "completed").length;
  
  return {
    users: {
      total: users.length,
      active: activeUsers,
      inactive: inactiveUsers,
      deleted: deletedUsers
    },
    requests: {
      total: requests.length,
      pending: pendingRequests,
      active: activeRequests,
      completed: completedRequests
    }
  };
};
