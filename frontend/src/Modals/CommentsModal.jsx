import React, { useState, useEffect } from 'react';
import { get } from '../services/ApiEndpoint';

const CommentsModal = ({ isOpen, client, closeModal }) => {
    const [profilePictures, setProfilePictures] = useState({});

    useEffect(() => {
        const fetchProfilePictures = async () => {
            try {
                const pictures = {};
                const names = client.LatestComments.map(comment => comment.name); // Collect all unique names

                const promises = names.map(async (name) => {
                    const response = await get(`/api/auth/profile-picture/${name}`);

                    if (response.data.success) {
                        pictures[name] = `${import.meta.env.VITE_BACKEND_URL}${response.data.profilePicture}`;
                    } else {
                        console.error(`Failed to fetch profile picture for ${name}:`, response.data.message);
                    }
                });

                // Wait for all profile pictures to be fetched
                await Promise.all(promises);

                // Set the profile pictures state after all are fetched
                setProfilePictures(pictures);
            } catch (error) {
                console.error("Error fetching profile pictures:", error);
            }
        };

        if (isOpen && client.LatestComments) {
            fetchProfilePictures();
        }

    }, [isOpen, client.LatestComments]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full">
                <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">{`Comments for ${client.CustomerName}`}</h2>
                
                {/* Scrollable container for comments */}
                <div className="space-y-6 max-h-96 overflow-y-auto">
                    {client.LatestComments && client.LatestComments.length > 0 ? (
                        client.LatestComments.map((comment, index) => (
                            <div key={index} className="border-b-2 border-gray-200 py-4 flex items-start">
                                <img
                                    src={profilePictures[comment.name] || '/default-avatar.png'} // Fallback to default image
                                    alt={comment.name}
                                    className="w-12 h-12 rounded-full object-cover mr-4"
                                />
                                <div>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {comment.name} <span className="text-sm text-gray-500">({new Date(comment.timestamp).toLocaleString()})</span>:
                                    </p>
                                    <p className="text-gray-700 mt-2">{comment.comment}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No comments yet.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={closeModal}
                        className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold text-lg transition-all duration-300 transform hover:bg-blue-700 focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;
