import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState } from './notifications.reducer';

export const selectNotificationsState = createFeatureSelector<NotificationsState>('notifications');

export const selectNotificationMessage = createSelector(selectNotificationsState, state => state.message);
export const selectNotificationType = createSelector(selectNotificationsState, state => state.type);
