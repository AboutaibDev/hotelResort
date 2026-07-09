import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedRoom {
  id: number;
  title: string;
  pricePerNight: number;
  image: string | null;
}

export interface SelectedActivity {
  id: number;
  title: string;
  price: number;
  image: string | null;
  participantsCount: number;
  bookingDate: string;
}

interface BookingSliceState {
  room: SelectedRoom | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  guestsCount: number;
  activities: SelectedActivity[];
}

const initialState: BookingSliceState = {
  room: null,
  checkInDate: null,
  checkOutDate: null,
  guestsCount: 1,
  activities: [],
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    selectRoom(
      state,
      action: PayloadAction<{ room: SelectedRoom; checkIn: string; checkOut: string; guests: number }>
    ) {
      state.room = action.payload.room;
      state.checkInDate = action.payload.checkIn;
      state.checkOutDate = action.payload.checkOut;
      state.guestsCount = action.payload.guests;
    },
    clearRoom(state) {
      state.room = null;
      state.checkInDate = null;
      state.checkOutDate = null;
      state.guestsCount = 1;
    },
    addActivity(state, action: PayloadAction<SelectedActivity>) {
      const existingIdx = state.activities.findIndex((a) => a.id === action.payload.id);
      if (existingIdx > -1) {
        state.activities[existingIdx] = action.payload;
      } else {
        state.activities.push(action.payload);
      }
    },
    removeActivity(state, action: PayloadAction<number>) {
      state.activities = state.activities.filter((a) => a.id !== action.payload);
    },
    clearActivities(state) {
      state.activities = [];
    },
    resetBooking(state) {
      state.room = null;
      state.checkInDate = null;
      state.checkOutDate = null;
      state.guestsCount = 1;
      state.activities = [];
    },
  },
});

export const {
  selectRoom,
  clearRoom,
  addActivity,
  removeActivity,
  clearActivities,
  resetBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;
