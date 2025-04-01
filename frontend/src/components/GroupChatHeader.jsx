import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import avatar from "../resources/avatar.png";
import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { toast } from 'react-hot-toast';

const GroupChatHeader = () => {
  const { selectedGroupChat, leaveGroupChat, addMemberToGroup, fetchNonMembers,
    nonMembers, isNonMembersLoading } = useGroupChatStore();
  const { authUser } = useAuthStore();
  const { friends } = useFriendStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  // Check if the current user is the admin
  const isAdmin = selectedGroupChat?.admin === authUser?._id || selectedGroupChat?.admin._id === authUser?._id;

  if (!selectedGroupChat) return null;

  // Filter nonMembers to only include friends
  const filteredNonMembers = nonMembers.filter(nonMember => 
    friends.some(friend => friend._id === nonMember._id)
  );

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupChat();
      toast.success("You have left the group");
    } catch (error) {
      console.error("Failed to leave group:", error);
      toast.error("Failed to leave group");
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  // Open the modal and fetch non-members
  const handleAddMemberClick = () => {
    if (isAdmin) {
      setIsModalOpen(true);
      fetchNonMembers();
    }
  };
 
  // Add a member to the group
  const handleAddMember = async (userId) => {
    try {
      await addMemberToGroup(selectedGroupChat._id, userId);
      setIsModalOpen(false);
      toast.success("Member added successfully");
    } catch (error) {
      console.error("Failed to add member:", error);
      toast.error("Failed to add member");
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      {/* Leave Group Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div role="alert" className="alert bg-base-100 shadow-lg max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-error shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold">Leave Group Chat</h3>
              <div className="text-sm">Are you sure you want to leave this group chat? This action cannot be undone.</div>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-sm"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-error"
                onClick={handleLeaveGroup}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full">
              <img
                src={selectedGroupChat.members[0]?.profilePic || avatar}
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
          <button 
            onClick={() => setShowLeaveConfirm(true)} 
            className="btn btn-sm btn-error"
          >
            Leave Group
          </button>
        </div>
      </div>

      {/* Modal for adding members */}
      <dialog open={isModalOpen} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Add Member</h3>
          <p className="py-4">Select a friend to add to the group:</p>
          {isNonMembersLoading ? (
            <p>Loading...</p>
          ) : filteredNonMembers.length === 0 ? (
            <p>No friends available to add</p>
          ) : (
            <ul className="menu bg-base-200 rounded-box">
              {filteredNonMembers.map((user) => (
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