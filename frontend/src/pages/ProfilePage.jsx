import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { toast } from "react-hot-toast";
import { Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, getUserById } = useAuthStore();
  const { sendFriendRequest,checkIfFriend,unfriend } = useFriendStore();
  const { userId } = useParams();
  
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [prevUserId, setPrevUserId] = useState(null);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);

  // Memoized fetch function with user ID check
  const fetchProfile = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const userData = await getUserById(id);
      setProfileUser(userData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading profile");
    } finally {
      setIsLoading(false);
    }
  }, [getUserById]);

  useEffect(() => {
    // Only fetch if userId changed and authUser exists
    if (authUser && userId !== prevUserId) {
      fetchProfile(userId);
      setPrevUserId(userId);
    }
  }, [userId, authUser, fetchProfile, prevUserId]);

  const handleFriendRequest = async () => {
    setIsFriendActionLoading(true);
    try {
      await sendFriendRequest(profileUser._id);
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    setIsFriendActionLoading(true);
    try {
      await unfriend(profileUser._id);
      toast.success("Friend removed successfully");
      setShowUnfriendConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
    } finally {
      setIsFriendActionLoading(false);
    }
  };


  if (isLoading || !profileUser || !authUser) {
    return (
      <div className="h-screen pt-20">
        <div className="max-w-2xl mx-auto p-4 py-8">
          <div className="bg-base-300 rounded-xl p-6 space-y-8">
            <div className="skeleton h-8 w-48 mx-auto"></div>
            <div className="skeleton h-4 w-64 mx-auto"></div>
            <div className="flex flex-col items-center gap-4">
              <div className="skeleton w-32 h-32 rounded-full"></div>
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-12 w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div className="container">
              <h1 className="text-2xl font-semibold text-center">
                {profileUser._id === authUser._id ? "My Profile" : "Profile"}
              </h1>
              <p className="mt-2 text-center">User profile information</p>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={profileUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
                loading="eager" // Changed to eager for better perceived performance
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar.png";
                }}
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {profileUser.fullName}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {profileUser.email}
              </p>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>
                  {new Date(profileUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
              {authUser._id !== profileUser._id && (
                <div className="flex items-center justify-between py-2">
                  <span>Friend Status</span>
                  <span>
                {checkIfFriend(profileUser._id) ? (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">Friends</span>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => setShowUnfriendConfirm(true)}
                        disabled={isFriendActionLoading}
                      >
                        Unfriend
                      </button>
                    </div>
                    {showUnfriendConfirm && (
                      <div className="absolute top-full right-0 mt-2 bg-white p-4 rounded shadow-lg z-10 border">
                        <p>Are you sure you want to unfriend {profileUser.fullName}?</p>
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            onClick={() => setShowUnfriendConfirm(false)}
                            className="btn btn-xs"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleUnfriend}
                            className="btn btn-xs btn-error"
                            disabled={isFriendActionLoading}
                          >
                            {isFriendActionLoading ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Confirm"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={handleFriendRequest}
                    disabled={isFriendActionLoading}
                  >
                    {isFriendActionLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Send Friend Request"
                    )}
                  </button>
                )}
              </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;