import { useState } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import UserSelector from "./UserSelector";

const GroupChatModal = ({ isOpen, onClose }) => {
  const [name_group, setNameGroup] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { createGroupChat } = useGroupChatStore();

  const handleCreateGroup = async () => {
    if (!name_group || selectedUsers.length < 2) {
      alert("Please provide a name and select at least 2 members");
      return;
    }

    await createGroupChat(name_group, selectedUsers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h2 className="font-bold text-lg">Create Group Chat</h2>
        <input
          type="text"
          placeholder="Group Name"
          value={name_group}
          onChange={(e) => setNameGroup(e.target.value)}
          className="input input-bordered w-full mt-4"
        />
        <div className="mt-4">
        <h2 className="font-bold text-lg mb-2">Select Members</h2>
          <UserSelector selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
        </div>
        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
          <button onClick={handleCreateGroup} className="btn btn-primary">
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;