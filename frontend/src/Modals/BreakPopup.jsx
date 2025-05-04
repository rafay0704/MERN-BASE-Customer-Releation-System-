import { useDispatch } from 'react-redux';
import { dismissBreakNotification } from '../redux/AuthSlice';
import { motion } from 'framer-motion'; // Import motion from framer-motion

const BreakPopup = ({ breaks }) => {
    const dispatch = useDispatch();

    const handleDismiss = (userId) => {
        // Dispatch the action to dismiss the notification
        dispatch(dismissBreakNotification(userId));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center">
            <motion.div
                className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <h2 className="text-xl font-semibold text-gray-800">Users on Break</h2>
                <div className="mt-4">
                    {/* Check if breaks is an array before calling .map() */}
                    {Array.isArray(breaks) && breaks.length > 0 ? (
                        breaks.map((user, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b">
                                <div className="text-gray-800">{user.name} is on break</div>
                                <button
                                    onClick={() => handleDismiss(user.userId)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Dismiss
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No users are currently on break.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BreakPopup;
