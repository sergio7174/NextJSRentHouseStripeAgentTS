import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import userReducer from './slices/userSlice';
import { baseApi } from './api/baseApi';
import { authApi } from './api/authApi';

// Side-effect imports so injectEndpoints() registers all endpoints on baseApi
import './api/userApi';
import './api/houseApi';
import './api/dashboardApi';
import './api/bookingApi';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      user: userReducer,
      [baseApi.reducerPath]: baseApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        baseApi.middleware,
        authApi.middleware),
  });

  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

