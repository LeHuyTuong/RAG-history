import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import metadataReducer from './slices/metadataSlice';
import articleReducer from './slices/articleSlice';
import characterReducer from './slices/characterSlice';
import eventReducer from './slices/eventSlice';
import locationReducer from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    metadata: metadataReducer,
    articles: articleReducer,
    characters: characterReducer,
    events: eventReducer,
    locations: locationReducer,
  },
});
