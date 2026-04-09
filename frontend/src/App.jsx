import { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import HomePage from "./HomePage";
import WorkspaceApp from "./workspace/WorkspaceApp";

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

  if (user) {
    return <WorkspaceApp />;
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onSwitchToRegister={() => setCurrentPage("register")}
        onBackToHome={() => setCurrentPage("home")}
      />
    );
  }
  if (currentPage === "register") {
    return (
      <RegisterPage
        onSwitchToLogin={() => setCurrentPage("login")}
        onBackToHome={() => setCurrentPage("home")}
      />
    );
  }
  return <HomePage onNavigateToLogin={() => setCurrentPage("login")} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
