/**
 * Report Service
 * Business logic for report operations
 */

import { Report, Event, User } from '../models/index.js';
import { Op } from 'sequelize';
import { getIO } from '../config/socket.js';

/**
 * Create a new report
 */
export async function createReport(userId, reportData) {
  const { event_id, reason, description } = reportData;

  // Check if event exists
  const event = await Event.findByPk(event_id);
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if user already reported this event
  const existingReport = await Report.findOne({
    where: {
      event_id,
      reported_by: userId,
    },
  });

  if (existingReport) {
    throw new Error('You have already reported this event');
  }

  const report = await Report.create({
    event_id,
    reported_by: userId,
    reason,
    description,
    status: 'pending',
  });

  // Fetch full report details for notification
  const fullReport = await Report.findByPk(report.id, {
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'username', 'email'] },
      { model: Event, as: 'event', attributes: ['id', 'title', 'event_date', 'location'] },
    ],
  });

  // 🔔 REAL-TIME NOTIFICATION to all ADMIN users
  try {
    const io = getIO();
    const adminUsers = await User.findAll({ 
      where: { role: 'ADMIN' },
      attributes: ['id']
    });

    // Emit to each admin's personal room
    adminUsers.forEach(admin => {
      io.to(`user:${admin.id}`).emit('report:new', {
        reportId: fullReport.id,
        reason: fullReport.reason,
        description: fullReport.description,
        reporter: {
          id: fullReport.reporter.id,
          username: fullReport.reporter.username
        },
        event: {
          id: fullReport.event.id,
          title: fullReport.event.title,
          event_date: fullReport.event.event_date,
          location: fullReport.event.location
        },
        createdAt: fullReport.created_at
      });
    });

    console.log(`📢 Notified ${adminUsers.length} admin(s) of new report #${report.id}`);
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
        as: 'event',
        attributes: ['id', 'title', 'event_date', 'location'],
      },
      {
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'email'],
      },
      {
        model: User,
        as: 'resolver',
        attributes: ['id', 'username', 'email'],
        required: false,
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
  });

  return {
    reports: rows,
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
    where: { reported_by: userId },
    include: [
      {
        model: Event,
        as: 'event',
        attributes: ['id', 'title', 'event_date', 'location'],
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
  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  
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
