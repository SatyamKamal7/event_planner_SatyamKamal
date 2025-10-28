const { query } = require('../config/database');

class Event {
  // Find all events with pagination and filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        upcomingOnly = true,
        includeRSVPCounts = false
      } = options;

      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let selectFields = 'e.*, u.name as created_by_name';
      
      if (upcomingOnly) {
        whereClause = 'WHERE e.date >= CURRENT_DATE';
      }

      if (includeRSVPCounts) {
        selectFields += `,
          COUNT(r.id) as total_rsvps,
          COUNT(CASE WHEN r.status = 'going' THEN 1 END) as going_count,
          COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count,
          COUNT(CASE WHEN r.status = 'decline' THEN 1 END) as decline_count`;
      }

      const queryText = `
        SELECT ${selectFields}
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        ${includeRSVPCounts ? 'LEFT JOIN rsvps r ON e.id = r.event_id' : ''}
        ${whereClause}
        ${includeRSVPCounts ? 'GROUP BY e.id, u.name' : ''}
        ORDER BY e.date, e.start_time
        LIMIT $1 OFFSET $2
      `;

      const result = await query(queryText, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding events: ${error.message}`);
    }
  }

  // Find event by ID
  static async findById(id, includeRSVPCounts = false) {
    try {
      let selectFields = 'e.*, u.name as created_by_name';
      
      if (includeRSVPCounts) {
        selectFields += `,
          COUNT(r.id) as total_rsvps,
          COUNT(CASE WHEN r.status = 'going' THEN 1 END) as going_count,
          COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count,
          COUNT(CASE WHEN r.status = 'decline' THEN 1 END) as decline_count`;
      }

      const queryText = `
        SELECT ${selectFields}
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        ${includeRSVPCounts ? 'LEFT JOIN rsvps r ON e.id = r.event_id' : ''}
        WHERE e.id = $1
        ${includeRSVPCounts ? 'GROUP BY e.id, u.name' : ''}
      `;

      const result = await query(queryText, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding event by ID: ${error.message}`);
    }
  }

  // Create new event
  static async create(eventData) {
    try {
      const { title, description, date, start_time, end_time, location, created_by } = eventData;

      const result = await query(
        `INSERT INTO events (title, description, date, start_time, end_time, location, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [title, description, date, start_time, end_time, location, created_by]
      );
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating event: ${error.message}`);
    }
  }

  // Update event
  static async update(id, updates) {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      });

      values.push(id);

      const result = await query(
        `UPDATE events 
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating event: ${error.message}`);
    }
  }

  // Delete event
  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM events WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting event: ${error.message}`);
    }
  }

  // Find events by creator
  static async findByCreator(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT e.*, u.name as created_by_name
         FROM events e
         LEFT JOIN users u ON e.created_by = u.id
         WHERE e.created_by = $1
         ORDER BY e.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding events by creator: ${error.message}`);
    }
  }

  // Get RSVP summary for event
  static async getRsvpSummary(eventId) {
    try {
      const result = await query(`
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
      `, [eventId]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting RSVP summary: ${error.message}`);
    }
  }
}

module.exports = Event;