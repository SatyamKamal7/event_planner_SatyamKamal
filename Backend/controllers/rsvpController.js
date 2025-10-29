const { query } = require('../config/database');

const rsvpController = {
  // Get user's RSVPs
 getUserRsvps: async (req, res) => {    
  try {
    const userId = req.user.userId;
    
    const result = await query(`
      SELECT 
        r.*,
        e.title,
        e.description,
        e.date,
        e.start_time,
        e.end_time,
        e.location,
        u.name AS organizer_name,
        CASE 
          WHEN e.date < CURRENT_DATE THEN 'past'
          WHEN e.date = CURRENT_DATE AND e.end_time::time < CURRENT_TIME::time THEN 'past'
          ELSE 'upcoming'
        END AS event_status
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON e.created_by = u.id
      WHERE r.user_id = $1
      ORDER BY 
        e.date DESC,
        e.start_time DESC
    `, [userId]);

    res.json({
      success: true,
      data: { rsvps: result.rows }
    });

  } catch (error) {
    console.error('Get user RSVPs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching RSVPs'
    });
  }
},



  // Create or update RSVP
  upsertRsvp: async (req, res) => {
    try {
      const { event_id, status } = req.body;
      const user_id = req.user.userId;

      // Validate event exists
      const eventResult = await query(
        'SELECT * FROM events WHERE id = $1',
        [event_id]
      );

      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      const event = eventResult.rows[0];

      // Check if event has already passed
      const eventDateTime = new Date(`${event.date}T${event.end_time}`);
      if (eventDateTime < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Cannot RSVP to past events'
        });
      }

      // Check if RSVP already exists
      const existingRsvp = await query(
        'SELECT * FROM rsvps WHERE user_id = $1 AND event_id = $2',
        [user_id, event_id]
      );

      let result;
      if (existingRsvp.rows.length > 0) {
        // Update existing RSVP
        result = await query(
          `UPDATE rsvps 
           SET status = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $2 AND event_id = $3 
           RETURNING *`,
          [status, user_id, event_id]
        );
      } else {
        // Create new RSVP
        result = await query(
          `INSERT INTO rsvps (user_id, event_id, status) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [user_id, event_id, status]
        );
      }

      res.json({
        success: true,
        message: existingRsvp.rows.length > 0 ? 'RSVP updated successfully' : 'RSVP created successfully',
        data: {
          rsvp: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Upsert RSVP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while processing RSVP'
      });
    }
  },

  // Get RSVP status for specific event
  getEventRsvp: async (req, res) => {
    try {
      const { event_id } = req.params;
      const user_id = req.user.userId;

      const result = await query(`
        SELECT r.*, e.title, e.date, e.start_time
        FROM rsvps r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = $1 AND r.event_id = $2
      `, [user_id, event_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: true,
          data: {
            rsvp: null
          }
        });
      }

      res.json({
        success: true,
        data: {
          rsvp: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Get event RSVP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching RSVP'
      });
    }
  },

  // Delete RSVP
  deleteRsvp: async (req, res) => {
    try {
      const { event_id } = req.params;
      const user_id = req.user.userId;

      const result = await query(
        'DELETE FROM rsvps WHERE user_id = $1 AND event_id = $2 RETURNING *',
        [user_id, event_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'RSVP not found'
        });
      }

      res.json({
        success: true,
        message: 'RSVP deleted successfully'
      });

    } catch (error) {
      console.error('Delete RSVP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting RSVP'
      });
    }
  }
};

module.exports = rsvpController;