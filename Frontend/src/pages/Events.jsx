import React, { useState, useEffect } from 'react';
import { eventsAPI, rsvpAPI } from '../services/api';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState({});

 console.log("EVENT",events);
 

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.get('/');
      setEvents(response?.data?.data?.events);
      
      // Load user's RSVP status for each event
      const rsvpResponse = await rsvpAPI.get('/my-rsvps');
      const statusMap = {};
      rsvpResponse.data.forEach(rsvp => {
        statusMap[rsvp.event_id] = rsvp.status;
      });
      setRsvpStatus(statusMap);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await rsvpAPI.post('/', { event_id: eventId, status });
      setRsvpStatus(prev => ({ ...prev, [eventId]: status }));
      
      // Show success message
      alert('RSVP updated successfully!');
    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert('Failed to update RSVP');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
          <p className="text-xl text-gray-600">Discover and RSVP to exciting events</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <div key={event?.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{event?.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event?.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(event?.date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatTime(event?.start_time)} - {formatTime(event?.end_time)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event?.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Hosted by {event?.created_by_name}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Your RSVP:</p>
                  <div className="flex space-x-2">
                    {['going', 'maybe', 'decline']?.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleRSVP(event.id, status)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          rsvpStatus[event.id] === status
                            ? status === 'going'
                              ? 'bg-green-500 text-white'
                              : status === 'maybe'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No upcoming events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;