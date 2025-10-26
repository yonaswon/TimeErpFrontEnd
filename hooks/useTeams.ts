import { useState, useEffect } from "react";
import api from "@/api";

export interface TeamRole {
  id: number;
  Name: string;
  date: string;
}

export interface TeamUser {
  id: number;
  telegram_id: number;
  telegram_user_name: string | null;
  role: TeamRole[];
}

export interface TeamRoleOption {
  id: number;
  Name: string;
}

export const useTeams = () => {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [role, setRoles] = useState<TeamRoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get("/core/teams/"),
        api.get("/core/teamroles/"),
      ]);
      console.log(usersResponse.data)
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (roleName: string) => {
    try {
      const response = await api.post("/core/teamroles/", { Name: roleName });
      setRoles((prev) => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to create role");
    }
  };

  const updateUserRoles = async (telegramId: number, roleIds: number[],id:number) => {
    try {
        console.log(roleIds,'role ids')
      const response = await api.patch(`/core/teams/${id}/`, {
        role: roleIds,
      });
      console.log(response)
    //   setUsers((prev) =>
    //     prev.map((user) =>
    //       user.telegram_id === telegramId ? response.data : user
    //     )
    //   );
    await fetchTeams()
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to update roles");
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    users,
    role,
    loading,
    error,
    refetch: fetchTeams,
    createRole,
    updateUserRoles,
  };
};
