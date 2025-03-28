import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupChatStore } from "../store/useGroupChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Plus ,Trash2  } from "lucide-react";
import GroupChatModal from "./GroupChatModal";
import avatar from "../resources/avatar.png";
const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { groupChats, fetchGroupChats, setSelectedGroupChat, selectedGroupChat, deleteGroupChat } = useGroupChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
    fetchGroupChats();
  }, [getUsers, fetchGroupChats]);

  const filteredUsers = users.filter(
    (user) => (!showOnlineOnly || onlineUsers.includes(user._id))
  );

    

   // Check if the current user is the admin of the selected group chat
   const isAdmin = selectedGroupChat?.admin === authUser?._id;

    // Handle group chat deletion
  const handleDeleteGroupChat = async () => {
    if (window.confirm("Are you sure you want to delete this group chat?")) {
      try {
        await deleteGroupChat(selectedGroupChat._id);
        setSelectedGroupChat(null); // Clear the selected group chat after deletion
      } catch (error) {
        console.error("Failed to delete group chat:", error);
      }
    }
  }

  if (isUsersLoading) return <SidebarSkeleton />;
  

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Button for showing online friends */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
              disabled={showGroups}
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>

        {/* Button for showing group */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <button
            onClick={() => {
              setShowGroups(!showGroups);
              setSelectedUser(null); // Clear selected user when switching to groups
            }}
            className="btn btn-sm btn-outline"
          >
            {showGroups ? "Show Friends" : "Show Groups"}
          </button>

          {showGroups && (
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="btn btn-sm btn-circle"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* List of Users Or Groups */}
      <div className="overflow-y-auto w-full py-3">
        {showGroups ? (
          groupChats.map((group) => (
            <button
              key={group._id}
              onClick={() => {
                setSelectedGroupChat(group);
                setSelectedUser(null); // Clear selected user when selecting a group
              }}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedGroupChat?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={avatar}
                  alt={group.name_group}
                  className="size-12 object-cover rounded-full"
                />
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{group.name_group}</div>
                <div className="text-sm text-zinc-400">
                  {group.members.length} members
                </div>
              </div>


               {/* Delete button for admin */}
               {selectedGroupChat?._id === group._id && isAdmin && (
                <button
                  onClick={handleDeleteGroupChat}
                  className="btn btn-sm btn-error ml-auto"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </button>
          ))
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setSelectedGroupChat(null); // Clear selected group when selecting a user
              }}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || avatar}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        )}

        {showGroups && groupChats.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No groups found</div>
        )}
        {!showGroups && filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>

      {/* Group chat modal */}
      <GroupChatModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </aside>
  );
};

export default Sidebar;