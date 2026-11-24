import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'Admin' | 'Owner' | 'Tenant' | null;

interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  userImage: string | null;
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  role: null,
  isAuthenticated: false,
  userImage: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<UserState>>) => {
      if (action.payload.id !== undefined) state.id = action.payload.id;
      if (action.payload.name !== undefined) state.name = action.payload.name;
      if (action.payload.email !== undefined) state.email = action.payload.email;
      if (action.payload.role !== undefined) state.role = action.payload.role;
      if (action.payload.userImage !== undefined) state.userImage = action.payload.userImage;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.id = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.isAuthenticated = false;
      state.userImage = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;