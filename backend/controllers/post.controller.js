import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import { sendErrorResponse } from "../lib/utils/serviceResponse.js";

const uploadImage = async (image) => {
	try {
		const uploadedResponse = await cloudinary.uploader.upload(image);
		return uploadedResponse.secure_url;
	} catch (e) {
		throw new Error("Image upload failed");
	}
};

const findUserById = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error("User not found");
	return user;
};

export const createPost = async (req, res) => {
	try {
		const { text, img } = req.body;
		const userId = req.user._id.toString();

		const user = await findUserById(userId);

		if (!text && !img) {
			return sendErrorResponse(res, 400, "Post must have text or image");
		}

		const imageUrl = img ? await uploadImage(img) : undefined;

		const newPost = await Post.create({
			user: userId,
			text,
			img: imageUrl,
		});

		res.status(201).json(newPost);
	} catch (e) {
		console.error("Error in create post controller:", e.message);
		sendErrorResponse(res, 500, e.message || "Internal server error");
	}
};

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return sendErrorResponse(res, 404, "Post not found");
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return sendErrorResponse(res, 401, "You are not authorized to delete this post");
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (e) {
		console.error("Error in delete post controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;

		if (!text) {
			return sendErrorResponse(res, 400, "Text field is required");
		}

		const post = await Post.findById(postId);
		if (!post) {
			return sendErrorResponse(res, 404, "Post not found");
		}

		post.comments.push({ user: userId, text });
		await post.save();

		res.status(200).json(post);
	} catch (e) {
		console.error("Error in comment on post controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};

export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);
		if (!post) {
			return sendErrorResponse(res, 404, "Post not found");
		}

		const userLikedPost = post.likes.includes(userId);

		let updatedLikes;

		if (userLikedPost) {
			// unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
		} else {
			// like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			// create a notification
			await Notification.create({
				from: userId,
				to: post.user,
				type: "like",
			});

			updatedLikes = post.likes;
		}

		res.status(200).json(updatedLikes);
	} catch (e) {
		console.error("Error in like inlike post controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (e) {
		console.error("Error in get all posts controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};

export const getLikedPosts = async (req, res) => {
	try {
		const user = await findUserById(req.params.id);

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (e) {
		console.error("Error in get liked posts controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await findUserById(userId);

		const feedPosts = await Post.find({ user: { $in: user.following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (e) {
		console.error("Error in get following posts controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return sendErrorResponse(res, 404, "User not found");

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (e) {
		console.error("Error in get user posts controller:", e.message);
		sendErrorResponse(res, 500, "Internal server error");
	}
};
