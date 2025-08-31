
import { User } from "@/types";
import { hashPassword } from "@/utils/security";

export const initSystem = async () => {
  // Vérifier si des utilisateurs existent
  const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
  
  // Si aucun utilisateur, créer un administrateur par défaut
  if (storedUsers.length === 0) {
    const now = new Date().toISOString();
    const hashedPassword = await hashPassword("admin123");
    const adminUser = {
      id: "1",
      email: "admin@reno360.ch",
      name: "Administrateur",
      createdAt: now,
      lastLogin: now,
      role: "admin",
      status: "active",
      password: hashedPassword,
      requestCount: 0
    };
    
    localStorage.setItem("users", JSON.stringify([adminUser]));
    console.log("Administrateur par défaut créé");
  } else {
    // S'assurer que l'administrateur existe toujours
    const adminExists = storedUsers.some((user: User & { password: string }) => 
      user.email === "admin@reno360.ch" && user.status === "active"
    );
    
    // Si l'admin n'existe pas (a été supprimé ou est inactif), le restaurer
    if (!adminExists) {
      const now = new Date().toISOString();
      const hashedPassword = await hashPassword("admin123");
      const adminUser = {
        id: "1",
        email: "admin@reno360.ch",
        name: "Administrateur",
        createdAt: now,
        lastLogin: now,
        role: "admin",
        status: "active",
        password: hashedPassword,
        requestCount: 0
      };
      
      // Ajouter l'administrateur tout en conservant les utilisateurs existants
      const updatedUsers = [...storedUsers.filter((user: User) => user.email !== "admin@reno360.ch"), adminUser];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      console.log("Administrateur par défaut restauré");
    }
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
