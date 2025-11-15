/**
 * Report Service
 * Business logic for report operations
 */

import { Report, Event, User } from '../models/index.js';
import { Op } from 'sequelize';
import { getIO } from '../config/socket.js';
import { saveNotification } from './notification.service.js';

/**
 * Create a new report
 */
export async function createReport(userId, reportData) {
  const { reported_user_id, reported_event_id, reason, description } = reportData;

  // Validate that exactly one target is specified
  if ((!reported_user_id && !reported_event_id) || (reported_user_id && reported_event_id)) {
    throw new Error('Must specify either reported_user_id or reported_event_id, not both');
  }

  let targetUser = null;
  let targetEvent = null;
  let existingReport = null;

  if (reported_event_id) {
    // Check if event exists
    targetEvent = await Event.findByPk(reported_event_id);
    if (!targetEvent) {
      throw new Error('Event not found');
    }

    // Check if user already reported this event (only pending reports)
    existingReport = await Report.findOne({
      where: {
        reported_event_id: reported_event_id,
        reporter_id: userId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this event and the report is still under review');
    }
  } else if (reported_user_id) {
    // Check if user exists
    targetUser = await User.findByPk(reported_user_id);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if user already reported this user (only pending reports)
    existingReport = await Report.findOne({
      where: {
        reported_user_id: reported_user_id,
        reporter_id: userId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this user and the report is still under review');
    }
  }

  const report = await Report.create({
    reported_user_id: reported_user_id || null,
    reported_event_id: reported_event_id || null,
    reporter_id: userId,
    reason,
    description,
    status: 'PENDING',
  });

  // Fetch full report details for notification
  const fullReport = await Report.findByPk(report.id, {
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'username', 'email'] },
      ...(reported_user_id ? [{ model: User, as: 'reportedUser', attributes: ['id', 'username'] }] : []),
      ...(reported_event_id ? [{ model: Event, as: 'reportedEvent', attributes: ['id', 'title', 'date', 'location'] }] : []),
    ],
  });

  // 🔔 REAL-TIME NOTIFICATION to all ADMIN users
  try {
    const io = getIO();
    const adminUsers = await User.findAll({
      where: { role: 'ADMIN' },
      attributes: ['id']
    });

    const notificationData = {
      reportId: fullReport.id,
      reason: fullReport.reason,
      description: fullReport.description,
      reporter: {
        id: fullReport.reporter.id,
        username: fullReport.reporter.username
      },
      createdAt: fullReport.created_at
    };

    if (reported_user_id) {
      notificationData.reportedUser = {
        id: fullReport.reportedUser.id,
        username: fullReport.reportedUser.username
      };
    } else {
      notificationData.reportedEvent = {
        id: fullReport.reportedEvent.id,
        title: fullReport.reportedEvent.title,
        date: fullReport.reportedEvent.event_date,
        location: fullReport.reportedEvent.location
      };
    }

    // Emit to each admin's personal room
    adminUsers.forEach(async (admin) => {
      io.to(`user:${admin.id}`).emit('report:new', notificationData);

      // 💾 Save notification to MongoDB for each admin
      const target = reported_user_id
        ? `utente "@${fullReport.reportedUser?.username}"`
        : `evento "${fullReport.reportedEvent?.title}"`;

      await saveNotification({
        userId: admin.id,
        type: 'report',
        title: 'Nuova segnalazione',
        message: `Segnalazione per ${target} - Motivo: ${fullReport.reason}`,
        icon: '⚠️',
        color: 'danger',
        data: notificationData
      });
    });
  } catch (error) {
    console.error('Error sending real-time notification to admins:', error);
    // Don't fail the request if notification fails
  }

  return report;
}

/**
 * Get all reports with filters (admin only)
 */
export async function getAllReports(filters = {}) {
  const { status, limit = 10, offset = 0 } = filters;

  const where = {};
  if (status) {
    where.status = status;
  }

  const { count, rows } = await Report.findAndCountAll({
    where,
    include: [
      {
        model: Event,
        as: 'reportedEvent',
        attributes: ['id', 'title', 'date', 'location'],
      },
      {
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'email'],
      },
      {
        model: User,
        as: 'reportedUser',
        attributes: ['id', 'username', 'email'],
        required: false,
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
  });

  // Add report count for each reported user/event
  const reportsWithCount = await Promise.all(
    rows.map(async (report) => {
      let activeReportsCount = 0;
      let currentReportPosition = 0;

      if (report.reported_user_id) {
        // Count active reports for this user
        activeReportsCount = await Report.count({
          where: {
            reported_user_id: report.reported_user_id,
            status: 'PENDING',
          },
        });

        // Find position of current report among active reports
        const activeReports = await Report.findAll({
          where: {
            reported_user_id: report.reported_user_id,
            status: 'PENDING',
          },
          order: [['created_at', 'ASC']],
          attributes: ['id'],
        });

        currentReportPosition = activeReports.findIndex(r => r.id === report.id) + 1;
      } else if (report.reported_event_id) {
        // Count active reports for this event
        activeReportsCount = await Report.count({
          where: {
            reported_event_id: report.reported_event_id,
            status: 'PENDING',
          },
        });

        // Find position of current report among active reports
        const activeReports = await Report.findAll({
          where: {
            reported_event_id: report.reported_event_id,
            status: 'PENDING',
          },
          order: [['created_at', 'ASC']],
          attributes: ['id'],
        });

        currentReportPosition = activeReports.findIndex(r => r.id === report.id) + 1;
      }

      return {
        ...report.toJSON(),
        activeReportsCount,
        currentReportPosition,
      };
    })
  );

  return {
    reports: reportsWithCount,
    total: count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
}

/**
 * Get reports created by user
 */
export async function getUserReports(userId) {
  const reports = await Report.findAll({
    where: { reporter_id: userId },
    include: [
      {
        model: Event,
        as: 'reportedEvent',
        attributes: ['id', 'title', 'date', 'location'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return reports;
}

/**
 * Update report status (admin only)
 */
export async function updateReportStatus(adminId, reportId, status, adminNotes = null) {
  const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const report = await Report.findByPk(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  await report.update({
    status,
    resolved_by: adminId,
    resolved_at: new Date(),
    admin_notes: adminNotes,
  });

  return report;
}

/**
 * Delete report (admin only)
 */
export async function deleteReport(reportId) {
  const report = await Report.findByPk(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  await report.destroy();
  return { success: true };
}
