import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {  useSelector } from 'react-redux'
import TopHeaderBar from '../Header'

export default function AdminLayouts() {
    const user = useSelector((state) => state.Auth.user)
    const navigate = useNavigate()
    

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate('/login');
        }
    }, [user, navigate]);

    return (
        <>
            <TopHeaderBar /> {/* Add the top header bar */}
            <Outlet />
           
        </>
    );
}
