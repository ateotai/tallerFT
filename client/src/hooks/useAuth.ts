import { useQuery } from "@tanstack/react-query";

interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthenticatedUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return await res.json();
    },
    retry: false,
  });

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}
