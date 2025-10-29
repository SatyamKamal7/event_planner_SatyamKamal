const { query } = require('../config/database');

class RSVP {
  // Find RSVP by user and event
  static async findByUserAndEvent(userId, eventId) {
    try {
      const result = await query(
        `SELECT r.*, e.title, e.date, e.start_time, e.location
         FROM rsvps r
         JOIN events e ON r.event_id = e.id
         WHERE r.user_id = $1 AND r.event_id = $2`,
        [userId, eventId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding RSVP by user and event: ${error.message}`);
    }
  }

  // Find all RSVPs for user
  static async findByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 10, upcomingOnly = false } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'r.user_id = $1';
      if (upcomingOnly) {
        whereClause += ' AND e.date >= CURRENT_DATE';
      }

      const result = await query(
        `SELECT 
           r.*, 
           e.title, 
           e.description,
           e.date, 
           e.start_time, 
           e.end_time, 
           e.location,
           u.name as organizer_name,
           CASE 
             WHEN e.date < CURRENT_DATE THEN 'past'
             WHEN e.date = CURRENT_DATE AND e.end_time < CURRENT_TIME, 'HH24:MI' THEN 'past'
             ELSE 'upcoming'
           END as event_status
         FROM rsvps r
         JOIN events e ON r.event_id = e.id
         JOIN users u ON e.created_by = u.id
         WHERE ${whereClause}
         ORDER BY e.date DESC, e.start_time DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding RSVPs by user: ${error.message}`);
    }
  }

  // Create or update RSVP
  static async upsert(rsvpData) {
    try {
      const { user_id, event_id, status } = rsvpData;

      // Check if RSVP already exists
      const existingRsvp = await this.findByUserAndEvent(user_id, event_id);

      let result;
      if (existingRsvp) {
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
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error upserting RSVP: ${error.message}`);
    }
  }

  // Delete RSVP
  static async delete(userId, eventId) {
    try {
      const result = await query(
        'DELETE FROM rsvps WHERE user_id = $1 AND event_id = $2 RETURNING *',
        [userId, eventId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting RSVP: ${error.message}`);
    }
  }

  // Get RSVPs for event
  static async findByEvent(eventId, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT 
           r.*, 
           u.name as user_name, 
           u.email as user_email
         FROM rsvps r
         JOIN users u ON r.user_id = u.id
         WHERE r.event_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [eventId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding RSVPs by event: ${error.message}`);
    }
  }

  // Get RSVP statistics for user
  static async getUserStats(userId) {
    try {
      const result = await query(
        `SELECT 
           status,
           COUNT(*) as count
         FROM rsvps r
         JOIN events e ON r.event_id = e.id
         WHERE r.user_id = $1 AND e.date >= CURRENT_DATE
         GROUP BY status`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting user RSVP stats: ${error.message}`);
    }
  }
}

module.exports = RSVP;