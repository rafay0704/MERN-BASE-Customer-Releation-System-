import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';

Modal.setAppElement('#root');

const ClientModal = ({ isOpen, modalData, closeModal, modalType, handleModalSave }) => {
    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '40px',
            fontSize: '14px',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 5,
        }),
        option: (provided) => ({
            ...provided,
            fontSize: '14px',
        }),
    };

    // State variables for options
    const [languageOptions, setLanguageOptions] = useState([]);
    const [nationalityOptions, setNationalityOptions] = useState([]);
    const [industryOptions, setIndustryOptions] = useState([
        { value: 'Chemical', label: 'Chemical' },
        { value: 'Electrical', label: 'Electrical' },
        { value: 'Software', label: 'Software' },
        { value: 'IT', label: 'IT' },
        { value: 'Facility', label: 'Facility Management' },
        { value: 'Law', label: 'Law' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Real Estate', label: 'Real Estate' },
               { value: 'Biotechnology', label: 'Biotechnology' },
        { value: 'Farming', label: 'Farming' },
        { value: 'Media Production', label: 'Media Production' },
        { value: 'Art & Design', label: 'Art & Design' },
        { value: 'Public Relations', label: 'Public Relations' },
        { value: 'Social Services', label: 'Social Services' },
        { value: 'Event Management', label: 'Event Management' },
        { value: 'Human Resources', label: 'Human Resources' },
        { value: 'Recruitment', label: 'Recruitment' },
        { value: 'Technology Consulting', label: 'Technology Consulting' },
        { value: 'Legal Services', label: 'Legal Services' },
        { value: 'Data Analytics', label: 'Data Analytics' },
        { value: 'Digital Marketing', label: 'Digital Marketing' },
        { value: 'Cybersecurity', label: 'Cybersecurity' },
        { value: 'Cloud Computing', label: 'Cloud Computing' },
        { value: '3D Printing', label: '3D Printing' },
        { value: 'Robotics', label: 'Robotics' },
        { value: 'UX/UI Design', label: 'UX/UI Design' },
        { value: 'Mobile App Development', label: 'Mobile App Development' },
        { value: 'Software Development', label: 'Software Development' },
        { value: 'Web Development', label: 'Web Development' },
        { value: 'Virtual Reality', label: 'Virtual Reality' },
        { value: 'Augmented Reality', label: 'Augmented Reality' },
        { value: 'Gaming', label: 'Gaming' },
        { value: 'AI & Machine Learning', label: 'AI & Machine Learning' },
        { value: 'Wearables', label: 'Wearables' },
        { value: 'Quantum Computing', label: 'Quantum Computing' },
        { value: 'Healthtech', label: 'Healthtech' },
        { value: 'Medtech', label: 'Medtech' },
        { value: 'CleanTech', label: 'CleanTech' },
        { value: 'PropTech', label: 'PropTech' },
        { value: 'Fintech', label: 'Fintech' },
        { value: 'Edtech', label: 'Edtech' },
        { value: 'Martech', label: 'Martech' },
    ]);
    
        const [stageOptions] = useState([
        { value: 'Active', label: 'Active' },
      
    ]);


    const [statusOptions] = useState([
     
        { value: 'alpha', label: 'alpha' },
        { value: 'beta', label: 'beta' },
    ]);

    useEffect(() => {
        // Fetch languages and nationalities from the REST Countries API
        const fetchData = async () => {
            try {
                // Fetch country data
                const countriesResponse = await fetch('https://restcountries.com/v3.1/all');
                const countries = await countriesResponse.json();

                // Extract languages and nationalities
                const languages = new Set();
                const nationalities = new Set();

                countries.forEach(country => {
                    // Add languages
                    if (country.languages) {
                        Object.values(country.languages).forEach(language => languages.add(language));
                    }
                    // Add nationality (common name for the country)
                    nationalities.add(country.name.common);
                });

                // Set the state with fetched values
                setLanguageOptions([...languages].map(lang => ({ value: lang, label: lang })));
                setNationalityOptions([...nationalities].map(nat => ({ value: nat, label: nat })));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            contentLabel="Edit Dropdown"
            className="p-8 bg-white rounded-lg shadow-2xl w-full max-w-xl mx-auto mt-20 transform transition-all duration-300 ease-in-out scale-95 hover:scale-100"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        >
            <h2 className="text-3xl mb-6 text-center font-semibold text-gray-900">
                Edit {modalType}
            </h2>

            {modalType === 'status' || modalType === 'stage' ? (
                <Select
                    options={modalType === 'status' ? statusOptions : stageOptions}
                    value={
                        modalType === 'status'
                            ? statusOptions.find(option => option.value === modalData.Status)
                            : stageOptions.find(option => option.value === modalData.Stage)
                    }
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : modalType === 'language' ? (
                <Select
                    options={languageOptions}
                    value={languageOptions.find(option => option.value === modalData.Language)}
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : modalType === 'nationality' ? (
                <Select
                    options={nationalityOptions}
                    value={nationalityOptions.find(option => option.value === modalData.Nationality)}
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : modalType === 'industry' ? (
                <Select
                    options={industryOptions}
                    value={industryOptions.find(option => option.value === modalData.Industry)}
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : null}
            

            <div className="mt-8 flex justify-between items-center">
                <button
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 ease-in-out"
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
};

export default ClientModal;
