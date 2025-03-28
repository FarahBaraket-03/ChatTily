import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useParams } from "react-router-dom";
import { Camera, Mail, User, Edit } from "lucide-react";
import {useFriendStore} from "../store/useFriendStore";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, getUserById } = useAuthStore();
  const { sendFriendRequest, acceptFriendRequest, declineFriendRequest} = useFriendStore();
  const { userId } = useParams();
  const [selectedImg, setSelectedImg] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: "",
    email: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (userId === authUser?._id) {
          setProfileUser(authUser);
          setEditData({
            fullName: authUser.fullName,
            email: authUser.email
          });
        } else {
          const userData = await getUserById(userId);
          setProfileUser(userData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (authUser) fetchProfile();
  }, [userId, authUser, getUserById]);

  const isOwner = userId === authUser?._id;

  const handleImageUpload = async (e) => {
    if (!isOwner) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!profileUser) return <p>Loading profile...</p>;

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Profile</h1>
              <p className="mt-2">User profile information</p>
            </div>
            {isOwner && (
              <button
                onClick={isEditing ? handleSave : handleEditToggle}
                className="btn btn-sm gap-2"
              >
                {isEditing ? "Save Changes" : (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            )}
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || profileUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              {isOwner && (
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
              )}
            </div>
            {isOwner && (
              <p className="text-sm text-zinc-400">
                {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
              </p>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              {isEditing && isOwner ? (
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{profileUser.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              {isEditing && isOwner ? (
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{profileUser.email}</p>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{new Date(profileUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Friend Status</span>
                <span>
                  {authUser.friends.includes(profileUser._id) ? (
                    <span className="text-green-500">Friends</span>
                  ) : authUser.friendRequests.includes(profileUser._id) ? (
                    <div className="flex gap-2">
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => acceptFriendRequest(profileUser._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => declineFriendRequest(profileUser._id)}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => sendFriendRequest(profileUser._id)}
                    >
                      Send Friend Request
                    </button>
                  )}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;