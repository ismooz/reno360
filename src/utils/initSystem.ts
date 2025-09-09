import { User } from "@/types";

export const initSystem = async () => {
  console.log("Système d'authentification migré vers Supabase Auth");
  // Le système d'authentification est maintenant géré par Supabase
  // Plus besoin de créer des utilisateurs dans localStorage
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