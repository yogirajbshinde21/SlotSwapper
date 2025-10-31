import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Marketplace.css';

/**
 * MARKETPLACE PAGE
 * 
 * Browse swappable slots from other users
 * Select your own slot to offer for swap
 * Create swap requests
 */

const Marketplace = () => {
  const [swappableSlots, setSwappableSlots] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mySelectedSlot, setMySelectedSlot] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [swappableResponse, myEventsResponse] = await Promise.all([
        api.get('/events/swappable/marketplace'),
        api.get('/events?status=SWAPPABLE'),
      ]);

      setSwappableSlots(swappableResponse.data.events);
      setMySlots(myEventsResponse.data.events);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch marketplace data');
      setLoading(false);
    }
  };

  const openSwapModal = (slot) => {
    if (mySlots.length === 0) {
      toast.error('You need to have swappable slots to make swap requests');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSlot(null);
    setMySelectedSlot('');
    setMessage('');
  };

  const handleSwapRequest = async () => {
    if (!mySelectedSlot) {
      toast.error('Please select a slot to offer');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/swap-requests', {
        mySlotId: mySelectedSlot,
        theirSlotId: selectedSlot._id,
        message: message,
      });

      toast.success('Swap request sent successfully!');
      closeModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send swap request');
    } finally {
      setSubmitting(false);
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
        <p>Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="marketplace-header">
        <h1>Slot Marketplace</h1>
        <p>Browse and request to swap slots with other users</p>
      </div>

      {swappableSlots.length === 0 ? (
        <div className="empty-state">
          <p>🔍 No swappable slots available at the moment</p>
          <p>Check back later or make your own slots swappable!</p>
        </div>
      ) : (
        <div className="marketplace-grid">
          {swappableSlots.map((slot) => (
            <div key={slot._id} className="marketplace-card">
              <div className="marketplace-card-header">
                <h3>{slot.title}</h3>
                <span className="badge badge-swappable">SWAPPABLE</span>
              </div>

              <div className="slot-owner">
                👤 <strong>{slot.userId.name}</strong>
              </div>

              {slot.description && (
                <p className="slot-description">{slot.description}</p>
              )}

              <div className="slot-time">
                <div>
                  <strong>Start:</strong> {formatDate(slot.startTime)}
                </div>
                <div>
                  <strong>End:</strong> {formatDate(slot.endTime)}
                </div>
              </div>

              {slot.location && (
                <div className="slot-location">
                  📍 {slot.location}
                </div>
              )}

              <div className="slot-duration">
                ⏱️ {slot.durationMinutes} minutes
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={() => openSwapModal(slot)}
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Swap Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Swap Request</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="selected-slot-info">
                <h3>Requesting:</h3>
                <div className="slot-info-box">
                  <strong>{selectedSlot?.title}</strong>
                  <p>{formatDate(selectedSlot?.startTime)}</p>
                  <p>Owner: {selectedSlot?.userId.name}</p>
                </div>
              </div>

              <div className="form-group">
                <label>Select Your Slot to Offer *</label>
                <select
                  value={mySelectedSlot}
                  onChange={(e) => setMySelectedSlot(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">-- Choose a slot --</option>
                  {mySlots.map((slot) => (
                    <option key={slot._id} value={slot._id}>
                      {slot.title} - {formatDate(slot.startTime)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why you want to swap..."
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSwapRequest}
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
