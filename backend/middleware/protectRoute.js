import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { sendErrorResponse } from "../lib/utils/serviceResponse.js";

export const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt;
		if (!token) {
			return sendErrorResponse(res, 401, "Unauthorized: No Token Provided");
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return sendErrorResponse(res, 401, "Unauthorized: Invalid Token");
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return sendErrorResponse(res, 404, "User not found");
		}

		req.user = user;
		next();
	} catch (err) {
		console.log("Error in protectRoute middleware", err.message);
		sendErrorResponse(res, 500, "Internal Server Error");
	}
};