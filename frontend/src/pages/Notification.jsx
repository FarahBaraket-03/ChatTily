import { useEffect,useState } from 'react';
import { useFriendStore } from '../store/useFriendStore';
import toast from 'react-hot-toast';

const Notification = () => {
  // Add loading states at the component level
const [acceptingId, setAcceptingId] = useState(null);
const [decliningId, setDecliningId] = useState(null);
  const { friendRequests, getAllFriends, getFriendRequests, acceptFriendRequest, declineFriendRequest } = useFriendStore();

  useEffect(() => {
    // Fetch friend requests when component mounts
    const fetchRequests = async () => {
      try {
        await getFriendRequests();
      } catch (error) {
        toast.error(error.message || "Failed to fetch friend requests");
      }
    };
    fetchRequests();
  }, [getFriendRequests]);

  const handleAccept = async (senderId) => {
  setAcceptingId(senderId);
  try {
    await acceptFriendRequest(senderId);
    toast.success("Friend request accepted!");
    await Promise.all([getAllFriends(), getFriendRequests()]);
  } catch (error) {
    toast.error(error.message || "Failed to accept request");
  } finally {
    setAcceptingId(null);
  }
};

const handleDecline = async (senderId) => {
  setDecliningId(senderId);
  try {
    await declineFriendRequest(senderId);
    toast.success("Friend request declined");
    await getFriendRequests();
  } catch (error) {
    toast.error(error.message || "Failed to decline request");
  } finally {
    setDecliningId(null);
  }
};
  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex flex-col h-full rounded-lg overflow-hidden p-6">
            <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>
            
            {friendRequests.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No pending friend requests</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto">
                {friendRequests.map(request => (
                  <div key={request._id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="avatar">
                        <div className="w-12 rounded-full">
                          {request.profilePic ? (
                            <img 
                              src={request.profilePic} 
                              alt={request.fullName || request.username}
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://via.placeholder.com/150'; // Fallback image
                              }}
                            />
                          ) : (
                            <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                              <span>{(request.fullName || request.username || 'U').charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.fullName || request.username || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">{request.email || 'No email provided'}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                    <button 
  onClick={() => handleAccept(request._id)}
  className="btn btn-sm btn-primary"
  disabled={acceptingId === request._id}
>
  {acceptingId === request._id ? (
    <span className="loading loading-spinner loading-xs"></span>
  ) : (
    "Accept"
  )}
</button>
<button 
  onClick={() => handleDecline(request._id)}
  className="btn btn-sm btn-error"
  disabled={decliningId === request._id}
>
  {decliningId === request._id ? (
    <span className="loading loading-spinner loading-xs"></span>
  ) : (
    "Decline"
  )}
</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;