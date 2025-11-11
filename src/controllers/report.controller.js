import { Report, User, Event, sequelize } from '../models/index.js';
const { Op } = sequelize.Sequelize;

// Create new report
export async function createReport(req, res) {
  try {
    const { reported_user_id, reported_event_id, reason } = req.body;
    const reporter_id = req.user.id;

    // Verify target exists
    if (reported_user_id) {
      const user = await User.findByPk(reported_user_id);
      if (!user) {
        return res.status(404).json({ message: 'Reported user not found' });
      }
      if (reported_user_id === reporter_id) {
        return res.status(400).json({ message: 'Cannot report yourself' });
      }
    }

    if (reported_event_id) {
      const event = await Event.findByPk(reported_event_id);
      if (!event) {
        return res.status(404).json({ message: 'Reported event not found' });
      }
    }

    const report = await Report.create({
      reporter_id,
      reported_user_id,
      reported_event_id,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
}

// Get all reports (ADMIN)
export async function getAllReports(req, res) {
  try {
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;

    // Filter by type
    if (type === 'user') {
      where.reported_user_id = { [Op.ne]: null };
    } else if (type === 'event') {
      where.reported_event_id = { [Op.ne]: null };
    }

    const reports = await Report.findAll({
      where,
      include: [
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
        {
          model: Event,
          as: 'reportedEvent',
          attributes: ['id', 'title', 'category', 'status'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
}

// Get current user's reports
export async function getMyReports(req, res) {
  try {
    const reports = await Report.findAll({
      where: { reporter_id: req.user.id },
      include: [
        {
          model: User,
          as: 'reportedUser',
          attributes: ['id', 'username'],
          required: false,
        },
        {
          model: Event,
          as: 'reportedEvent',
          attributes: ['id', 'title'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
}

// Update report status (ADMIN)
export async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.json({
      message: 'Report status updated successfully',
      report,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report', error: error.message });
  }
}

// Delete report (ADMIN)
export async function deleteReport(req, res) {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await report.destroy();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
}
