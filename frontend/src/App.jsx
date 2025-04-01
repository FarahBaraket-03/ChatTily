import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useState, useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import Notification from "./pages/Notification";
import { useFriendStore } from "./store/useFriendStore";
import CurrentUserProfile from "./pages/CurrentUserProfile";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { getAllFriends,getFriendRequests}=useFriendStore();
  const { theme } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState(""); 

  useEffect(() => {
    checkAuth();
    if(authUser){
      getAllFriends();
      getFriendRequests();
    }
  }, [checkAuth,getAllFriends,getFriendRequests,authUser]);

  

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile/:userId" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/notify" element={authUser ? <Notification /> : <Navigate to="/login" />} />
        <Route path="/profileUser" element={authUser ? <CurrentUserProfile /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
