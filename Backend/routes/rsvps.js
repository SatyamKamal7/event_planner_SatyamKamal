const express = require('express');
const rsvpController = require('../controllers/rsvpController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateRsvp,
  validateEventIdParam,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's RSVPs
router.get('/my-rsvps', validatePagination, rsvpController.getUserRsvps);

// Get specific event RSVP
router.get('/event/:event_id', validateEventIdParam, rsvpController.getEventRsvp);

// Create or update RSVP
router.post('/', validateRsvp, rsvpController.upsertRsvp);

// Delete RSVP
router.delete('/event/:event_id', validateEventIdParam, rsvpController.deleteRsvp);

module.exports = router;