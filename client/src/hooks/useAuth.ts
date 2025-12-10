import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes - évite les refetch inutiles
  });

  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('useAuth:', { user, isLoading, error, isAuthenticated: !!user });
  }

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
  }), [user, isLoading]);
}
