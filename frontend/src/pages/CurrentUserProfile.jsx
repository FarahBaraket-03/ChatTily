import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { toast } from "react-hot-toast";
import { Camera, Mail, User, Edit } from "lucide-react";

const CurrentUserProfile = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { getAllFriends, getFriendRequests } = useFriendStore();
  
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: authUser?.fullName || "",
    email: authUser?.email || ""
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([getAllFriends(), getFriendRequests()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading data");
    } finally {
      setIsLoading(false);
    }
  }, [getAllFriends, getFriendRequests]);

  useEffect(() => {
    if (authUser) {
      fetchData();
    }
  }, [authUser, fetchData]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
  
    const toastId = toast.loading("Uploading image...");
    const reader = new FileReader();
    
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      try {
        await updateProfile({ profilePic: base64Image });
        toast.success("Profile picture updated!", { id: toastId });
      } catch (error) {
        toast.error("Failed to update profile picture", { id: toastId });
      }
    };
    
    reader.onerror = () => {
      toast.error("Error reading image file", { id: toastId });
    };
    
    reader.readAsDataURL(file);
  };

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating profile");
    }
  };

  if (!authUser) {
    return (
      <div className="h-screen pt-20 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="flex justify-between items-center">
            <div className="container">
              <button
                onClick={isEditing ? handleSave : handleEditToggle}
                className="btn btn-sm gap-2"
                disabled={isUpdatingProfile}
              >
                {isEditing ? "Save Changes" : (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
              <h1 className="text-2xl font-semibold text-center">My Profile</h1>
              <p className="mt-2 text-center">Manage your profile information</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar.png";
                }}
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}`}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser.email}</p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{new Date(authUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentUserProfile;