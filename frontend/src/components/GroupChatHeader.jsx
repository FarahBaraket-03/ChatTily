import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import avatar from "../resources/avatar.png";
import { useState } from "react";

const GroupChatHeader = () => {
  const { selectedGroupChat, leaveGroupChat, addMemberToGroup,fetchNonMembers,
    nonMembers,isNonMembersLoading, } = useGroupChatStore();
  const { authUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
   // Check if the current user is the admin
   const isAdmin = selectedGroupChat?.admin._id === authUser?._id;


  if (!selectedGroupChat) return null;

  const handleLeaveGroup = () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      leaveGroupChat();
    }
  };

   // Open the modal and fetch non-members
   const handleAddMemberClick = () => {
    if (isAdmin) {
      setIsModalOpen(true);
      fetchNonMembers(); // Fetch non-members from the store
    }
  };
 
   // Add a member to the group
   const handleAddMember = async (userId) => {
    try {
      await addMemberToGroup(selectedGroupChat._id, userId);
      setIsModalOpen(false); // Close the modal after adding
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };


  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full">
              <img
                src={selectedGroupChat.members[0].profilePic || avatar}
                alt={selectedGroupChat.name_group}
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium">{selectedGroupChat.name_group}</h3>
            <p className="text-sm text-base-content/70">
              {selectedGroupChat.members.length} members
            </p>
          </div>
        </div>
        <div className="flex gap-2">
        {isAdmin && (
            <button onClick={handleAddMemberClick} className="btn btn-sm btn-primary">
              Add Member
            </button>
          )}
          <button onClick={handleLeaveGroup} className="btn btn-sm btn-error">
            Leave Group
          </button>
        </div>
      </div>



      
      {/* Modal for adding members */}
      <dialog open={isModalOpen} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Add Member</h3>
          <p className="py-4">Select a user to add to the group:</p>
          {isNonMembersLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="menu bg-base-200 rounded-box">
              {nonMembers.map((user) => (
                <li key={user._id}>
                  <a onClick={() => handleAddMember(user._id)}>
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="size-8 rounded-full">
                          <img src={user.profilePic || avatar} alt={user.fullName} />
                        </div>
                      </div>
                      <span>{user.fullName}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="modal-action">
            <button onClick={() => setIsModalOpen(false)} className="btn">
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default GroupChatHeader;