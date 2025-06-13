import { createAction, props } from '@ngrx/store';

export const showSuccess = createAction('[Notifications] Show Success', props<{ message: string }>());
export const showError = createAction('[Notifications] Show Error', props<{ message: string }>());
export const clearNotification = createAction('[Notifications] Clear');
