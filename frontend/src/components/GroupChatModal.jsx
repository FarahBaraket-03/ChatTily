import { useState } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { toast } from "react-hot-toast";
import UserSelector from "./UserSelector";

const GroupChatModal = ({ isOpen, onClose }) => {
  const [name_group, setNameGroup] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createGroupChat } = useGroupChatStore();

  const handleCreateGroup = async () => {
    if (!name_group.trim()) {
      toast.error("Please provide a group name");
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error("Please select at least 2 members");
      return;
    }

    setIsLoading(true);
    try {
      await createGroupChat(name_group, selectedUsers);
      toast.success("Group chat created successfully!");
      setNameGroup("");
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group chat");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h2 className="font-bold text-lg">Create Group Chat</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              value={name_group}
              onChange={(e) => setNameGroup(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Select Members (minimum 2)</span>
            </label>
            <UserSelector 
              selectedUsers={selectedUsers} 
              setSelectedUsers={setSelectedUsers} 
            />
          </div>
        </div>

        <div className="modal-action mt-6">
          <button 
            onClick={onClose} 
            className="btn"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateGroup} 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;