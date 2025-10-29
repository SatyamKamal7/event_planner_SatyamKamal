import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rsvpAPI } from '../services/api';
import { Calendar, MapPin, Clock, Search, Filter } from 'lucide-react';

function MyRSVPs() {
  const [rsvps, setRsvps] = useState([]);
  const [filteredRsvps, setFilteredRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadMyRSVPs();
  }, []);

  useEffect(() => {
    filterRSVPs();
  }, [rsvps, searchTerm, statusFilter]);

  const loadMyRSVPs = async () => {
    try {
      const response = await rsvpAPI.get('/my-rsvps');
      setRsvps(response.data.data.rsvps);
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRSVPs = () => {
    let filtered = rsvps;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(rsvp =>
        rsvp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rsvp.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rsvp => rsvp.status === statusFilter);
    }

    setFilteredRsvps(filtered);
  };

  const handleRSVPUpdate = async (rsvpId, newStatus) => {
    try {
      const rsvp = rsvps.find(r => r.id === rsvpId);
      await rsvpAPI.post('/', { event_id: rsvp.event_id, status: newStatus });
      
      // Update local state
      setRsvps(prev => prev.map(r => 
        r.id === rsvpId ? { ...r, status: newStatus } : r
      ));
      
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'going': return 'bg-green-100 text-green-800 border-green-200';
      case 'maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'decline': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isEventPassed = (dateString) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your RSVPs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My RSVPs</h1>
          <p className="text-xl text-gray-600">Manage your event responses</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="going">Going</option>
                <option value="maybe">Maybe</option>
                <option value="decline">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* RSVPs List */}
        <div className="space-y-6">
          {filteredRsvps.map((rsvp) => (
            <div
              key={rsvp.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                rsvp.status === 'going' ? 'border-green-500' :
                rsvp.status === 'maybe' ? 'border-yellow-500' :
                'border-red-500'
              } ${isEventPassed(rsvp.date) ? 'opacity-75' : ''}`}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{rsvp.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(rsvp.status)}`}>
                        {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{rsvp.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(rsvp.date)}</span>
                        {isEventPassed(rsvp.date) && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Past</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatTime(rsvp.start_time)} - {formatTime(rsvp.end_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{rsvp.location}</span>
                      </div>
                    </div>
                  </div>

                  {!isEventPassed(rsvp.date) && (
                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <p className="text-sm font-medium text-gray-700 mb-2">Update RSVP:</p>
                      <div className="flex space-x-2">
                        {['going', 'maybe', 'decline'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleRSVPUpdate(rsvp.id, status)}
                            disabled={rsvp.status === status}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              rsvp.status === status
                                ? status === 'going'
                                  ? 'bg-green-500 text-white'
                                  : status === 'maybe'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRsvps.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RSVPs found</h3>
              <p className="text-gray-500 mb-4">
                {rsvps.length === 0 
                  ? "You haven't RSVP'd to any events yet."
                  : "No RSVPs match your current filters."
                }
              </p>
              <Link
                to="/events"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Browse Events
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRSVPs;