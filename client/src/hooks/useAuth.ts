import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  });

  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('useAuth:', { user, isLoading, error, isAuthenticated: !!user });
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
