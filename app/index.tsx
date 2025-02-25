import { Redirect } from "expo-router";
import { useState, useEffect } from "react";
import { auth } from "../utils/auth";
export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await auth.isAuthenticated();
      setIsAuthenticated(authStatus);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // 还没检查完，就先返回个空或者 Loading
    return null;
  }

  return isAuthenticated ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/login" />
  );
}
