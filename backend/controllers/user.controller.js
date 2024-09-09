import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendErrorResponse } from "../lib/utils/serviceResponse.js";


export const getUserProfile = async (req, res) => {
	const username = req.params.username;

	try {
		const user = await User.findOne({ username }).select("-password");
		if (!user) return sendErrorResponse(res, 404, "User not found");

		res.status(200).json(user);
	} catch (e) {
		console.error("Error in get user profile:", e.message);
		sendErrorResponse(res, 500, e.message);
	}
};

export const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { _id: currentUserId } = req.user;

		if (id === currentUserId.toString()) {
			return sendErrorResponse(res, 400, "You can't follow/unfollow yourself");
		}

		const userToModify = await User.findById(id);
		const currentUser = await User.findById(currentUserId);

		if (!userToModify || !currentUser) {
			return sendErrorResponse(res, 404, "User not found");
		}

		const updateAction = currentUser.following.includes(id) ? "$pull" : "$push";
		const message = currentUser.following.includes(id) ? "User unfollowed successfully" : "User followed successfully";

		await User.findByIdAndUpdate(id, { [updateAction]: { followers: currentUserId } });
		await User.findByIdAndUpdate(currentUserId, { [updateAction]: { following: id } });

		if (updateAction === "$push") {
			const newNotification = new Notification({
				type: "follow",
				from: currentUserId,
				to: userToModify._id,
			});
			await newNotification.save();
		}

		res.status(200).json({ message });
	} catch (e) {
		console.error("Error in follow unfollow user:", e.message);
		sendErrorResponse(res, 500, e.message);
	}
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{ $match: { _id: { $ne: userId } } },
			{ $sample: { size: 10 } },
		]);

		const suggestedUsers = users
			.filter(user => !usersFollowedByMe.following.includes(user._id))
			.slice(0, 4)

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (e) {
		console.error("Error in get suggested users:", e.message);
		sendErrorResponse(res, 500, e.message);
	}
};


export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return sendErrorResponse(res, 404, "User not found");

		console.log(`print current password ${currentPassword} and ${newPassword}`)
		if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
			return sendErrorResponse(res, 400, "Please provide both current password and new password");
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return sendErrorResponse(res, 400, "Current password is incorrect");

			if (newPassword.length < 6) {
				return sendErrorResponse(res, 400, "Password must be at least 6 characters long");
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		const updateImage = async (currentImage, newImage, type) => {
			if (newImage) {
				if (currentImage) {
					await cloudinary.uploader.destroy(currentImage.split("/").pop().split(".")[0]);
				}
				const uploadedResponse = await cloudinary.uploader.upload(newImage);
				user[type] = uploadedResponse.secure_url;
			}
		};

		await updateImage(user.profileImg, profileImg, "profileImg");
		await updateImage(user.coverImg, coverImg, "coverImg");

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio !== undefined ? bio : user.bio;
		user.link = link !== undefined ? link : user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;


		user = await user.save();
		user.password = null;

		res.status(200).json(user);
	} catch (e) {
		console.error("Error in update user:", e.message);
		sendErrorResponse(res, 500, e.message);
	}
};
