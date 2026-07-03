import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface NotificationItem {
  id: number;
  user_id: number | null;
  title: string | null;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsSliceState {
  recentNotifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationsSliceState = {
  recentNotifications: [],
  unreadCount: 0,
  loading: false,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(
      state,
      action: PayloadAction<{ notifications: NotificationItem[]; unreadCount: number }>
    ) {
      state.recentNotifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    addNotification(state, action: PayloadAction<NotificationItem>) {
      const exists = state.recentNotifications.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.recentNotifications = [action.payload, ...state.recentNotifications].slice(0, 5);
        state.unreadCount += 1;
      }
    },
    decrementUnread(state) {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    markAllAsRead(state) {
      state.unreadCount = 0;
      state.recentNotifications = state.recentNotifications.map((n) => ({
        ...n,
        is_read: true,
      }));
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setNotifications, addNotification, decrementUnread, markAllAsRead, setLoading } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
