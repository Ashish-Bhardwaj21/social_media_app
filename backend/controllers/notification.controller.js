import Notification from "../models/notification.model.js";
import { sendErrorResponse } from "../lib/utils/serviceResponse.js";

export const getNotifications = async (req, res) => {
    const userId = req.user._id;

    try {
        const notifications = await Notification.find({ to: userId }).populate({
            path: "from",
            select: "username profileImg",
        });

        await Notification.updateMany({ to: userId }, { read: true });

        res.status(200).json(notifications);
    } catch (e) {
        console.error("Error in get notifications:", e.message);
        sendErrorResponse(res, 500, "Internal Server Error");
    }
};

export const deleteNotifications = async (req, res) => {
    const userId = req.user._id;

    try {
        await Notification.deleteMany({ to: userId });

        res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (e) {
        console.error("Error in delete notifications:", e.message);
        sendErrorResponse(res, 500, "Internal Server Error");
    }
};
