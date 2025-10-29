const { query } = require('../config/database');

const eventController = {
  // Get all upcoming events
  getAllEvents: async (req, res) => {
    try {
      const result = await query(`
        SELECT 
          e.*,
          u.name as created_by_name,
          COUNT(r.id) as total_rsvps,
          COUNT(CASE WHEN r.status = 'going' THEN 1 END) as going_count,
          COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count,
          COUNT(CASE WHEN r.status = 'decline' THEN 1 END) as decline_count
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN rsvps r ON e.id = r.event_id
        WHERE e.date >= CURRENT_DATE
        GROUP BY e.id, u.name
        ORDER BY e.date, e.start_time
      `);

      res.json({
        success: true,
        data: {
          events: result.rows
        }
      });

    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching events'
      });
    }
  },

  // Get event by ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await query(`
        SELECT 
          e.*,
          u.name as created_by_name,
          COUNT(r.id) as total_rsvps,
          COUNT(CASE WHEN r.status = 'going' THEN 1 END) as going_count,
          COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count,
          COUNT(CASE WHEN r.status = 'decline' THEN 1 END) as decline_count
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN rsvps r ON e.id = r.event_id
        WHERE e.id = $1
        GROUP BY e.id, u.name
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      res.json({
        success: true,
        data: {
          event: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching event'
      });
    }
  },

  // Create new event
  createEvent: async (req, res) => {
    try {
      const { title, description, date, start_time, end_time, location } = req.body;
      const created_by = req.user.userId;

      // Validate date is not in the past
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        return res.status(400).json({
          success: false,
          error: 'Event date cannot be in the past'
        });
      }

      // Validate end time is after start time
      if (start_time >= end_time) {
        return res.status(400).json({
          success: false,
          error: 'End time must be after start time'
        });
      }

      const result = await query(
        `INSERT INTO events (title, description, date, start_time, end_time, location, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [title, description, date, start_time, end_time, location, created_by]
      );

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: {
          event: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while creating event'
      });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, date, start_time, end_time, location } = req.body;

      // Check if event exists and user is the creator
      const existingEvent = await query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );

      if (existingEvent.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Validate date is not in the past
      if (date) {
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
          return res.status(400).json({
            success: false,
            error: 'Event date cannot be in the past'
          });
        }
      }

      // Validate end time is after start time
      if (start_time && end_time && start_time >= end_time) {
        return res.status(400).json({
          success: false,
          error: 'End time must be after start time'
        });
      }

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (title) {
        updateFields.push(`title = $${paramCount}`);
        values.push(title);
        paramCount++;
      }

      if (description) {
        updateFields.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }

      if (date) {
        updateFields.push(`date = $${paramCount}`);
        values.push(date);
        paramCount++;
      }

      if (start_time) {
        updateFields.push(`start_time = $${paramCount}`);
        values.push(start_time);
        paramCount++;
      }

      if (end_time) {
        updateFields.push(`end_time = $${paramCount}`);
        values.push(end_time);
        paramCount++;
      }

      if (location) {
        updateFields.push(`location = $${paramCount}`);
        values.push(location);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      values.push(id);

      const result = await query(
        `UPDATE events 
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: {
          event: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while updating event'
      });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if event exists
      const existingEvent = await query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );

      if (existingEvent.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Delete associated RSVPs first
      await query('DELETE FROM rsvps WHERE event_id = $1', [id]);

      // Delete event
      await query('DELETE FROM events WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting event'
      });
    }
  },

  // Get RSVP summary for event
 // Get RSVP summary for event (with user details)
getRsvpSummary: async (req, res) => {
  try {
    const { id } = req.params;

    // Get RSVP count summary
    const summaryResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM rsvps 
      WHERE event_id = $1 
      GROUP BY status
      ORDER BY 
        CASE status 
          WHEN 'going' THEN 1
          WHEN 'maybe' THEN 2
          WHEN 'decline' THEN 3
        END
    `, [id]);

    // Get detailed list of users for each RSVP status
    const userDetailsResult = await query(`
      SELECT 
        r.status,
        u.id AS user_id,
        u.name,
        u.email,
        r.created_at as rsvp_date
      FROM rsvps r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY 
        CASE r.status 
          WHEN 'going' THEN 1
          WHEN 'maybe' THEN 2
          WHEN 'decline' THEN 3
        END, u.name
    `, [id]);

    // Group users by status
    const usersByStatus = {};
    userDetailsResult.rows.forEach(row => {
      if (!usersByStatus[row.status]) usersByStatus[row.status] = [];
      usersByStatus[row.status].push({
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        rsvp_date: row.rsvp_date
      });
    });

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows,
        users: usersByStatus
      }
    });

  } catch (error) {
    console.error('Get RSVP summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching RSVP summary'
    });
  }
}

};

module.exports = eventController;