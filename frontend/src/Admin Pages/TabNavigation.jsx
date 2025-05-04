import React from 'react';

const TabNavigation = ({ tabs, selectedTab, onSelectTab }) => {
    return (
        <div className="flex border-b border-gray-200 mb-4">
            {tabs.map((tab, index) => (
                <button
                    key={index}
                    onClick={() => onSelectTab(index)} // Call the onSelectTab function with the current index
                    className={`px-4 py-2 focus:outline-none transition duration-300 ease-in-out transform ${
                        selectedTab === index // Check if the current index matches selectedTab
                            ? 'bg-blue-200 border-b-2 border-blue-600 text-blue-800 font-semibold shadow-md rounded-lg'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500 hover:scale-105'
                    } rounded-lg`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default TabNavigation;
