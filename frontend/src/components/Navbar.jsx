import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, MessageSquare, Settings, User, Bell } from "lucide-react";
import avatar from "../resources/avatar.png";
import { useFriendStore } from "../store/useFriendStore";
import { useEffect, useState } from "react";

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const { logout, authUser } = useAuthStore();
  const { friendRequests, getFriendRequests, isLoading: isFriendLoading } = useFriendStore();
  const { users } = useChatStore();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (authUser && !isFriendLoading) {
      getFriendRequests();
    }
  }, [authUser, getFriendRequests, isFriendLoading]);

  const filteredUsers = searchQuery
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleUserSelect = (userId) => {
    setSearchQuery("");
    setIsSearching(true);
    navigate(`/profile/${userId}`);
    // Reset searching state after navigation
    setTimeout(() => setIsSearching(false), 500);
  };

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
              <h1 className="text-lg font-bold">ChatTily</h1>
            </Link>

            {/* Search Bar */}
            {authUser && (
              <div className="relative">
                <input
                  type="search"
                  required
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300 text-white w-64"
                />
                
                {searchQuery && filteredUsers.length > 0 && (
                  <div className="absolute top-10 left-0 w-64 bg-white shadow-lg rounded-md overflow-hidden z-50">
                    {filteredUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserSelect(user._id)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition w-full text-left"
                      >
                        <img
                          src={user.profilePic || avatar}
                          alt={user.fullName}
                          className="size-8 object-cover rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = avatar;
                          }}
                        />
                        <span className="text-sm">{user.fullName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && filteredUsers.length === 0 && (
                  <div className="absolute top-10 left-0 w-64 bg-white shadow-lg rounded-md p-3 text-gray-500 text-sm">
                    No users found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile & Logout & Bell notif */}
          <div className="flex items-center gap-2">
            {authUser && (
              <div className="indicator">
                {friendRequests.length !== 0 && (
                  <span className="indicator-item badge badge-secondary">
                    {friendRequests.length}
                  </span>
                )}
                <Link to="/notify">
                  <Bell className="size-7" />
                </Link>
              </div>
            )}

            <Link to="/settings" className="btn btn-sm gap-2 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            
            {authUser && (
              <>
                <Link 
                  to="/profileUser" 
                  className="btn btn-sm gap-2"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearching(true);
                  }}
                >
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