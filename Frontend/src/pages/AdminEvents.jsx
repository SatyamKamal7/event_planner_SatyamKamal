import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import { Plus, Edit, Trash2, BarChart3, X } from 'lucide-react';

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false); // ✅ NEW STATE
  const [selectedEvent, setSelectedEvent] = useState(null); // ✅ NEW STATE
  const [editingEvent, setEditingEvent] = useState(null);
  const [rsvpSummaries, setRsvpSummaries] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.get('/');
      const rows = response?.data?.data?.events || [];

      const normalized = rows.map(ev => ({
        ...ev,
        // normalize date to YYYY-MM-DD so forms show correctly
        date: ev.date ? new Date(ev.date).toISOString().slice(0, 10) : ''
      }));

      setEvents(normalized);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRsvpSummary = async (eventId) => {
    try {
      const response = await eventsAPI.get(`/${eventId}/rsvp-summary`);
      setRsvpSummaries(prev => ({ ...prev, [eventId]: response.data.data }));
      setSelectedEvent(eventId); // ✅ Store event id
      setShowSummaryModal(true); // ✅ Open summary popup
    } catch (error) {
      console.error('Error loading RSVP summary:', error);
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const cleanStartTime = formData.start_time?.slice(0, 5);
  const cleanEndTime = formData.end_time?.slice(0, 5);

  const payload = {
    ...formData,
    start_time: cleanStartTime,
    end_time: cleanEndTime,
  };

  try {
    if (editingEvent) {
      await eventsAPI.put(`/${editingEvent.id}`, payload);
    } else {
      await eventsAPI.post('/', payload);
    }

    setShowModal(false);
    setEditingEvent(null);
    resetForm();
    loadEvents();
  } catch (error) {
    console.error('Error saving event:', error);
    alert('Failed to save event');
  }
};


  const handleEdit = (event) => {
    setEditingEvent(event);
    const formattedDate = event.date ? new Date(event.date).toISOString().slice(0, 10) : '';

    setFormData({
      title: event.title,
      description: event.description,
      date: formattedDate,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(`/${eventId}`);
        loadEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      location: ''
    });
    setEditingEvent(null);
  };

  const summaryData = selectedEvent ? rsvpSummaries[selectedEvent] : null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
            <p className="text-gray-600">Create and manage events</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        </div>

        {/* Events Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSVPs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events?.map((event) => (
                <tr key={event?.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event?.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{event?.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{new Date(event.date).toLocaleDateString()}</div>
                    <div className="text-gray-500">
                      {event?.start_time} - {event?.end_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{event?.location}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => loadRsvpSummary(event?.id)}
                      className="flex items-center space-x-4 text-sm hover:text-blue-600"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <div className="flex space-x-2">
                        <span className="text-green-600">✓{event.going_count}</span>
                        <span className="text-yellow-600">?{event.maybe_count}</span>
                        <span className="text-red-600">✗{event.decline_count}</span>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(event)} className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(event?.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {events?.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found. Create your first event!</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ RSVP Summary Modal */}
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowSummaryModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">RSVP Summary</h2>

            {/* Summary counts */}
            <div className="flex justify-around mb-6">
              {summaryData.summary.map((s, i) => (
                <div key={i} className="text-center">
                  <p
                    className={`font-semibold text-lg ${s.status === 'going'
                        ? 'text-green-600'
                        : s.status === 'maybe'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                  >
                    {s.status.toUpperCase()}
                  </p>
                  <p className="text-gray-800 text-xl">{s.count}</p>
                </div>
              ))}
            </div>

            {/* Users list grouped by status */}
            {Object.entries(summaryData.users).map(([status, users]) => (
              <div key={status} className="mb-6">
                <h3
                  className={`text-lg font-semibold mb-2 ${status === 'going'
                      ? 'text-green-600'
                      : status === 'maybe'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                >
                  {status.toUpperCase()} ({users.length})
                </h3>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex justify-between bg-gray-50 px-4 py-2 rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(user.rsvp_date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Create/Edit Event Modal (unchanged) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEvents;
