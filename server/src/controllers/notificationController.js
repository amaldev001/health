const Notification = require('../models/Notification');
const { AppError, catchAsync } = require('../utils/AppError');

// GET /api/notifications (Paginated + unreadCount Requirement 9)
const getNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Run queries in parallel
  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments({ userId: req.user.id }),
    Notification.countDocuments({ userId: req.user.id, isRead: false }),
    Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
  ]);

  return res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// PATCH /api/notifications/:id/read
const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!notification) {
    throw AppError.notFound('Notification not found.');
  }

  notification.isRead = true;
  await notification.save();

  return res.json({
    success: true,
    data: notification
  });
});

// PATCH /api/notifications/read-all
const markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { $set: { isRead: true } }
  );

  return res.json({
    success: true,
    message: 'All notifications marked as read.'
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
