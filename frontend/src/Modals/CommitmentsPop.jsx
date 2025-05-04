import React, { useEffect, useState } from 'react';
import { get, post } from '../services/ApiEndpoint';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CommitmentsPopup = () => {
  const [commitments, setCommitments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reminderQueue, setReminderQueue] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const fetchCommitments = async () => {
      try {
        const response = await get('/api/css/upcoming-commitments');
        if (response.data.success) {
          setCommitments(response.data.clients);
        }
      } catch (error) {
        console.error('Error fetching commitments:', error);
      }
    };

    fetchCommitments();
    const intervalId = setInterval(fetchCommitments, 60000); // Check every minute for updates
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const checkCommitments = () => {
      const now = new Date();

      commitments.forEach((client) => {
        client.Commitments.forEach((comm) => {
          if (comm.status === "not done") {
            const deadline = new Date(comm.deadline);
            const timeDiff = deadline - now;

            if (timeDiff > 0 && timeDiff <= 120000) {
              setTimeout(() => addToQueue(comm, client.Mou_no, true), timeDiff - 60000); // 1 min before deadline
              setTimeout(() => addToQueue(comm, client.Mou_no, true), timeDiff - 120000); // 2 min before deadline
            }

            if (timeDiff <= 0) {
              addToQueue(comm, client.Mou_no, false); // After deadline
              setInterval(() => {
                if (comm.status === "not done") addToQueue(comm, client.Mou_no, false);
              }, 120000); // Every 2 min if still not done
            }
          }
        });
      });
    };

    checkCommitments();
  }, [commitments]);

  const addToQueue = (commitment, Mou_no, isPreDeadline) => {
    setReminderQueue((prevQueue) => {
      // Ensure the commitment is not added again if already in the queue
      if (!prevQueue.some(item => item.Mou_no === Mou_no && item.commitment === commitment.commitment)) {
        return [...prevQueue, { ...commitment, Mou_no, isPreDeadline }];
      }
      return prevQueue;
    });
    if (!showModal && reminderQueue.length === 0) openNextReminder();
  };

  const openNextReminder = () => {
    if (reminderQueue.length > 0) {
      const nextCommitment = reminderQueue[0];
      setSelectedCommitment(nextCommitment);
      setShowModal(true);
      setReminderQueue((prevQueue) => prevQueue.slice(1)); // Remove the first item from the queue

      if (nextCommitment.isPreDeadline) {
        const deadline = new Date(nextCommitment.deadline);
        setTimeRemaining(Math.floor((deadline - new Date()) / 1000));

        const countdown = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setShowModal(false);
              openNextReminder(); // Open next reminder
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleAddComment = async () => {
    if (!comment) {
      toast.error('Please add a comment before closing the popup.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await post(`/api/css/client/${selectedCommitment.Mou_no}/comment`, { comment });
      if (response.data.success) {
        toast.success('Comment added successfully!');
        setShowModal(false);
        setComment('');
        // Remove the current commitment from the queue to avoid showing it again
        setReminderQueue(prevQueue => prevQueue.filter(item => item.Mou_no !== selectedCommitment.Mou_no || item.commitment !== selectedCommitment.commitment));
        openNextReminder(); // Show next reminder in the queue
      }
    } catch (error) {
      toast.error('Error adding comment!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    // Remove the current commitment from the queue to avoid showing it again
    setReminderQueue(prevQueue => prevQueue.filter(item => item.Mou_no !== selectedCommitment.Mou_no || item.commitment !== selectedCommitment.commitment));
    openNextReminder(); // Show next reminder after dismissing
  };

  return (
    <>
      <ToastContainer />
      {showModal && selectedCommitment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-xl mb-4">Commitment Reminder</h2>
            <p className="mb-4">
              Commitment for {selectedCommitment.commitment} is {selectedCommitment.isPreDeadline ? "approaching" : "overdue"}.
              {selectedCommitment.isPreDeadline ? (
                <>
                  <br />
                  Time remaining: {timeRemaining > 0 ? timeRemaining : 0}s
                </>
              ) : (
                <>
                  <br />
                  Deadline: {new Date(selectedCommitment.deadline).toLocaleString()}
                </>
              )}
            </p>
            {!selectedCommitment.isPreDeadline && (
              <>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded mb-4"
                  placeholder="Enter comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isProcessing}
                />
                <button
                  onClick={handleAddComment}
                  className={`px-4 py-2 bg-blue-500 text-white rounded mr-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Submitting...' : 'Submit Comment'}
                </button>
              </>
            )}
            {selectedCommitment.isPreDeadline && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CommitmentsPopup;
