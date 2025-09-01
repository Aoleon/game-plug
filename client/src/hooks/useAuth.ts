import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
