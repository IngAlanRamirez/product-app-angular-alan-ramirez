import { createReducer, on } from '@ngrx/store';
import * as NotificationsActions from './notifications.actions';

export interface NotificationsState {
  message: string | null;
  type: 'success' | 'error' | null;
}

export const initialState: NotificationsState = {
  message: null,
  type: null,
};

export const notificationsReducer = createReducer(
  initialState,
  on(NotificationsActions.showSuccess, (state, { message }) => ({ message, type: 'success' })),
  on(NotificationsActions.showError, (state, { message }) => ({ message, type: 'error' })),
  on(NotificationsActions.clearNotification, () => initialState)
);
