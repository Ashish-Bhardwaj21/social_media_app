import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import { sendErrorResponse } from "../lib/utils/serviceResponse.js";

//Signup
export const signup = async (req, res) => {
	try {
		const { fullName, username, email, password } = req.body;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return sendErrorResponse(res, 400, "Invalid email format");
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return sendErrorResponse(res, 400, "Username is already taken");
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return sendErrorResponse(res, 400, "Email is already taken");
		}

		if (password.length < 8) {
			return sendErrorResponse(res, 400, "Password must be at least 8 characters long");
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
            await newUser.save();
			generateTokenAndSetCookie(newUser._id, res);

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
				followers: newUser.followers,
				following: newUser.following,
				profileImg: newUser.profileImg,
				coverImg: newUser.coverImg,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (e) {
		console.log("Error in signup controller", e.message);
		sendErrorResponse(res, 500, "Internal Server Error");
	}
};

//Login
export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });

        if (!user) {
            return sendErrorResponse(res, 400, "Invalid username or password");
        }

		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
		if (!isPasswordCorrect) {
            return sendErrorResponse(res, 400, "Invalid password");
        }

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			followers: user.followers,
			following: user.following,
			profileImg: user.profileImg,
			coverImg: user.coverImg,
		});
	} catch (e) {
		console.log("Error in login controller", e.message);
		sendErrorResponse(res, 500, "Internal Server Error");
	}
};

//Logout
export const logout = async (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (e) {
		console.log("Error in logout controller", e.message);
		sendErrorResponse(res, 500, "Internal Server Error");
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.status(200).json(user);
	} catch (e) {
		console.log("Error in getMe controller", e.message);
		sendErrorResponse(res, 500, "Internal Server Error");
	}
};
