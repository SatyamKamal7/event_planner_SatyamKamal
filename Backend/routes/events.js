const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const {
  validateEventCreate,
  validateEventUpdate,
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

// Public routes - get events (with optional auth for personalized data)
router.get('/', optionalAuth, validatePagination, eventController.getAllEvents);
router.get('/:id', optionalAuth, validateIdParam, eventController.getEventById);

// Protected admin routes
router.post('/', authenticateToken, authorizeRoles(['admin']), validateEventCreate, eventController.createEvent);
router.put('/:id', authenticateToken, authorizeRoles(['admin']), validateIdParam, validateEventUpdate, eventController.updateEvent);
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), validateIdParam, eventController.deleteEvent);

// RSVP summary (admin only)
router.get('/:id/rsvp-summary', authenticateToken, authorizeRoles(['admin']), validateIdParam, eventController.getRsvpSummary);

module.exports = router;