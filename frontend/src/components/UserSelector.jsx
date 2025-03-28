import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore"; // Import the auth store

const UserSelector = ({ selectedUsers, setSelectedUsers }) => {
  const [users, setUsers] = useState([]);
  const { authUser } = useAuthStore(); // Get the current user

  // Fetch all users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/auth/users");
        // Filter out the current user from the list
        const filteredUsers = res.data.filter((user) => user._id !== authUser._id);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [authUser._id]);

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