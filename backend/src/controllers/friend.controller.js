import User from "../models/user.model.js";

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // if (senderId === receiverId) {
    //   return res.status(400).json({ message: "You cannot send a request to yourself." });
    // }

    const sender = req.user._id;
    const receiver = await User.findById(receiverId);

    if (!receiver) return res.status(404).json({ message: "User not found." });

    if (receiver.friendRequests.includes(sender)) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    receiver.friendRequests.push(sender);
    await receiver.save();

    res.status(200).json({ message: "Friend request sent successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId, senderId } = req.body;

    const user = await User.findById(userId);
    const sender = await User.findById(senderId);

    if (!user || !sender) return res.status(404).json({ message: "User not found." });

    if (!user.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "No friend request from this user." });
    }

    user.friends.push(senderId);
    sender.friends.push(userId);

    user.friendRequests = user.friendRequests.filter((id) => id.toString() !== senderId);
    await user.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId, senderId } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found." });

    user.friendRequests = user.friendRequests.filter((id) => id.toString() !== senderId);
    await user.save();

    res.status(200).json({ message: "Friend request rejected." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's friends list
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "username email");

    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json(user.friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's pending friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId).populate("friendRequests", "username email");

    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json(user.friendRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
