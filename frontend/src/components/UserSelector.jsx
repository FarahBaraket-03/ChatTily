import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore"; // Import the auth store
import { useFriendStore } from "../store/useFriendStore";

const UserSelector = ({ selectedUsers, setSelectedUsers }) => {
  const [users, setUsers] = useState([]);
  const { authUser } = useAuthStore(); // Get the current user
  const {friends,getAllFriends}=useFriendStore();

  // Fetch all users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
       getAllFriends();
        setUsers(friends);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [authUser._id, getAllFriends,friends]); // Fetch users when authUser changes

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => (
        <div
          key={user._id}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            selectedUsers.includes(user._id)
              ? "bg-primary text-primary-content" // Selected user style
              : "bg-base-200 hover:bg-base-300" // Unselected user style
          }`}
          onClick={() => toggleUserSelection(user._id)}
        >
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm opacity-70">
              {user.email}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserSelector;