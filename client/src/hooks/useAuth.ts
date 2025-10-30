import { useQuery } from "@tanstack/react-query";

interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthenticatedUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
