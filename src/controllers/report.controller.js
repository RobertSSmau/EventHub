/**
 * Report Controller
 * REST endpoints for report operations
 */

import * as reportService from '../services/report.service.js';

/**
 * @desc Create a new report
 * @route POST /api/reports
 */
export async function createReport(req, res) {
  try {
    const report = await reportService.createReport(req.user.id, req.body);
    
    res.status(201).json({
      message: 'Report created successfully',
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    const status = error.message === 'Event not found' ? 404 :
                   error.message === 'User not found' ? 404 :
                   error.message === 'Must specify either reported_user_id or reported_event_id, not both' ? 400 :
                   error.message === 'You have already reported this user and the report is still under review' ? 409 :
                   error.message === 'You have already reported this event and the report is still under review' ? 409 :
                   error.message === 'You have already reported this event' ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * @desc Get all reports (Admin only)
 * @route GET /api/reports
 */
export async function getAllReports(req, res) {
  try {
    const result = await reportService.getAllReports(req.query);
    
    res.json({
      reports: result.reports,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
}

/**
 * @desc Get reports created by logged user
 * @route GET /api/reports/mine
 */
export async function getMyReports(req, res) {
  try {
    const reports = await reportService.getUserReports(req.user.id);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
}

/**
 * @desc Update report status (Admin only)
 * @route PATCH /api/reports/:id/status
 */
export async function updateReportStatus(req, res) {
  try {
    const { status, admin_notes } = req.body;
    const report = await reportService.updateReportStatus(
      req.user.id,
      req.params.id,
      status,
      admin_notes
    );
    
    res.json({
      message: 'Report status updated successfully',
      report,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    const statusCode = error.message === 'Report not found' ? 404 :
                       error.message === 'Invalid status' ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

/**
 * @desc Delete report (Admin only)
 * @route DELETE /api/reports/:id
 */
export async function deleteReport(req, res) {
  try {
    await reportService.deleteReport(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    const status = error.message === 'Report not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
}
