import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { get } from "../services/ApiEndpoint";

// Thunk to update the user
export const updateUser = createAsyncThunk('updateuser', async () => {
    try {
        const request = await get('/api/auth/CheckUser');
        const response = request.data;

        return response;
    } catch (error) {
        console.log(error);
    }
});

const initialState = {
    loading: null,
    error: null,
    user: null,
    breakNotifications: [],  // Add a state to store break notifications
};

const AuthSlice = createSlice({
    name: "authslice",
    initialState,
    reducers: {
        SetUser: (state, action) => {
            state.user = action.payload;
        },
        Logout: (state) => {
            state.user = null;
            state.loading = null;
            state.error = null;
        },
        // Action to set break notifications
        setBreakNotifications: (state, action) => {
            state.breakNotifications = action.payload;
        },
        // Action to dismiss break notifications for a specific user
        dismissBreakNotification: (state, action) => {
            state.breakNotifications = state.breakNotifications.filter(
                (notification) => notification.userId !== action.payload
            );
        },
    },
    extraReducers: (builder) => {
        builder.addCase(updateUser.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateUser.fulfilled, (state, action) => {
            state.loading = null;
            state.user = action.payload;
        });
        builder.addCase(updateUser.rejected, (state, action) => {
            state.loading = null;
            state.error = action.error.message;
            state.user = null;
        });
    }
});

export const { SetUser, Logout, setBreakNotifications, dismissBreakNotification } = AuthSlice.actions;

export default AuthSlice.reducer;
