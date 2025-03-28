import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore"; // 🔹 Import user store
import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import avatar from "../resources/avatar.png"; // 🔹 Default avatar
//import NoChatSelected from "../components/NoChatSelected";
//import ChatContainer from "../components/ChatContainer";
//import { getUserChats } from "../../../backend/src/controllers/chat.controller";

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const { logout, authUser } = useAuthStore();
  const { users } = useChatStore(); // 🔹 Get users from store

  // 🔹 Filter users based on search query
  const filteredUsers = searchQuery
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  //const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>

            {/* 🔹 Search Bar */}
            <div className="relative">
              <input
                type="search"
                required
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300 text-white w-64"
              />
              
              {/* 🔹 Search Results Dropdown */}
              {searchQuery && filteredUsers.length > 0 && (
                <div className="absolute top-10 left-0 w-64 bg-white shadow-lg rounded-md overflow-hidden z-50">
                  {filteredUsers.map((user) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user?._id}`} // 🔹 Link to user profile
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => setSearchQuery("") }// 🔹 Clear search on selection
                    >
                      <img
                        src={user.profilePic || avatar}
                        alt={user.fullName}
                        className="size-8 object-cover rounded-full"
                      />
                      <span className="text-sm">{user.fullName}</span>
                    </Link>
                  ))}
                  
                </div>
              )}

              {/* 🔹 No Users Found */}
              {searchQuery && filteredUsers.length === 0 && (
                <div className="absolute top-10 left-0 w-64 bg-white shadow-lg rounded-md p-3 text-gray-500 text-sm">
                  No users found.
                </div>
              )}
            </div>
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-2">
            <Link to="/settings" className="btn btn-sm gap-2 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={`/profile/${authUser?._id}`} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
