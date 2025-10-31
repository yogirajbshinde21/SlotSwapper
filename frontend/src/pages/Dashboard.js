import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

/**
 * DASHBOARD PAGE
 * 
 * User's calendar/dashboard
 * - Display user's slots
 * - Create new slots
 * - Make slots swappable
 * - Update and delete slots
 */

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    status: 'BUSY',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/events', formData);
      toast.success('Event created successfully!');
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        status: 'BUSY',
      });
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await api.patch(`/events/${eventId}`, { status: newStatus });
      toast.success(`Event status updated to ${newStatus}`);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ marginTop: '50px' }}>
        <div className="spinner"></div>
        <p>Loading your events...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>My Calendar</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">Create New Event</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Team Meeting"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Event description (optional)"
                disabled={submitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>End Time *</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Conference Room A"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      <div className="events-section">
        <h2>Your Events ({events.length})</h2>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>📅 No events yet. Create your first event!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <span className={`badge badge-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>

                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                <div className="event-time">
                  <div>
                    <strong>Start:</strong> {formatDate(event.startTime)}
                  </div>
                  <div>
                    <strong>End:</strong> {formatDate(event.endTime)}
                  </div>
                </div>

                {event.location && (
                  <div className="event-location">
                    📍 {event.location}
                  </div>
                )}

                <div className="event-duration">
                  ⏱️ {event.durationMinutes} minutes
                </div>

                <div className="event-actions">
                  {event.status === 'BUSY' && (
                    <button
                      className="btn btn-success btn-small"
                      onClick={() => handleStatusChange(event._id, 'SWAPPABLE')}
                    >
                      Make Swappable
                    </button>
                  )}

                  {event.status === 'SWAPPABLE' && (
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleStatusChange(event._id, 'BUSY')}
                    >
                      Mark as Busy
                    </button>
                  )}

                  {event.status !== 'SWAP_PENDING' && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(event._id)}
                    >
                      Delete
                    </button>
                  )}

                  {event.status === 'SWAP_PENDING' && (
                    <span className="info-text">
                      🔒 Locked in swap process
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
