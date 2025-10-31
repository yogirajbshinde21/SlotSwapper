import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Requests.css';

/**
 * REQUESTS PAGE
 * 
 * Manage swap requests:
 * - Incoming requests (received) - Accept/Reject
 * - Outgoing requests (sent) - View status, Cancel
 */

const Requests = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        api.get('/swap-requests/incoming'),
        api.get('/swap-requests/outgoing'),
      ]);

      setIncomingRequests(incomingResponse.data.requests);
      setOutgoingRequests(outgoingResponse.data.requests);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch requests');
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, response) => {
    const action = response === 'ACCEPTED' ? 'accept' : 'reject';
    
    if (!window.confirm(`Are you sure you want to ${action} this swap request?`)) {
      return;
    }

    try {
      await api.post(`/swap-requests/${requestId}/respond`, {
        response: response,
      });

      toast.success(
        response === 'ACCEPTED'
          ? 'Swap accepted! Slots have been exchanged.'
          : 'Swap request rejected.'
      );
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond to request');
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this swap request?')) {
      return;
    }

    try {
      await api.delete(`/swap-requests/${requestId}`);
      toast.success('Swap request cancelled');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
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
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="requests-header">
        <h1>Swap Requests</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'incoming' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming ({incomingRequests.length})
        </button>
        <button
          className={`tab ${activeTab === 'outgoing' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          Outgoing ({outgoingRequests.length})
        </button>
      </div>

      {activeTab === 'incoming' && (
        <div className="requests-section">
          <h2>Incoming Requests</h2>
          <p className="section-description">
            Requests from other users who want to swap with your slots
          </p>

          {incomingRequests.length === 0 ? (
            <div className="empty-state">
              <p>📭 No incoming swap requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {incomingRequests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div className="requester-info">
                      <strong>From: {request.requesterId.name}</strong>
                      <span className="request-date">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    <span className={`badge badge-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.message && (
                    <div className="request-message">
                      💬 "{request.message}"
                    </div>
                  )}

                  <div className="swap-details">
                    <div className="swap-slot">
                      <div className="slot-label">They Offer:</div>
                      <div className="slot-box">
                        <strong>{request.mySlotId.title}</strong>
                        <div className="slot-time">
                          {formatDate(request.mySlotId.startTime)}
                        </div>
                        {request.mySlotId.location && (
                          <div className="slot-location">
                            📍 {request.mySlotId.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="swap-arrow">⇄</div>

                    <div className="swap-slot">
                      <div className="slot-label">They Want:</div>
                      <div className="slot-box slot-box-yours">
                        <strong>{request.theirSlotId.title}</strong>
                        <div className="slot-time">
                          {formatDate(request.theirSlotId.startTime)}
                        </div>
                        {request.theirSlotId.location && (
                          <div className="slot-location">
                            📍 {request.theirSlotId.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="request-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleRespond(request._id, 'ACCEPTED')}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRespond(request._id, 'REJECTED')}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {request.status !== 'PENDING' && (
                    <div className="request-status-info">
                      {request.status === 'ACCEPTED' && (
                        <p className="status-accepted">
                          ✓ You accepted this swap on {formatDate(request.respondedAt)}
                        </p>
                      )}
                      {request.status === 'REJECTED' && (
                        <p className="status-rejected">
                          ✗ You rejected this swap on {formatDate(request.respondedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'outgoing' && (
        <div className="requests-section">
          <h2>Outgoing Requests</h2>
          <p className="section-description">
            Swap requests you've sent to other users
          </p>

          {outgoingRequests.length === 0 ? (
            <div className="empty-state">
              <p>📤 No outgoing swap requests</p>
              <p>Visit the marketplace to request swaps!</p>
            </div>
          ) : (
            <div className="requests-list">
              {outgoingRequests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div className="requester-info">
                      <strong>To: {request.requestedUserId.name}</strong>
                      <span className="request-date">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    <span className={`badge badge-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.message && (
                    <div className="request-message">
                      💬 Your message: "{request.message}"
                    </div>
                  )}

                  <div className="swap-details">
                    <div className="swap-slot">
                      <div className="slot-label">You Offer:</div>
                      <div className="slot-box slot-box-yours">
                        <strong>{request.mySlotId.title}</strong>
                        <div className="slot-time">
                          {formatDate(request.mySlotId.startTime)}
                        </div>
                        {request.mySlotId.location && (
                          <div className="slot-location">
                            📍 {request.mySlotId.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="swap-arrow">⇄</div>

                    <div className="swap-slot">
                      <div className="slot-label">You Want:</div>
                      <div className="slot-box">
                        <strong>{request.theirSlotId.title}</strong>
                        <div className="slot-time">
                          {formatDate(request.theirSlotId.startTime)}
                        </div>
                        {request.theirSlotId.location && (
                          <div className="slot-location">
                            📍 {request.theirSlotId.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="request-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCancel(request._id)}
                      >
                        Cancel Request
                      </button>
                      <span className="info-text">
                        ⏳ Waiting for {request.requestedUserId.name} to respond
                      </span>
                    </div>
                  )}

                  {request.status !== 'PENDING' && (
                    <div className="request-status-info">
                      {request.status === 'ACCEPTED' && (
                        <p className="status-accepted">
                          ✓ Accepted on {formatDate(request.respondedAt)}
                        </p>
                      )}
                      {request.status === 'REJECTED' && (
                        <p className="status-rejected">
                          ✗ Rejected on {formatDate(request.respondedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Requests;
