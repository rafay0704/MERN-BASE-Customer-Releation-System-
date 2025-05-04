import { configureStore } from '@reduxjs/toolkit';
import AuthSlice from './AuthSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

// Redux Persist configuration
const persistConfig = {
    key: 'root',
    storage,
    // Optionally, you can whitelist specific reducers
};

// Persisted reducer to avoid the state being reset on page reload
const persistedAuthReducer = persistReducer(persistConfig, AuthSlice);

export const store = configureStore({
    reducer: {
        Auth: persistedAuthReducer,  // Make sure Auth state is persisted
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,  // Disable serializable check for non-serializable values like Date
        }),
});

export const persistor = persistStore(store);
