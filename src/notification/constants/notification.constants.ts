export const NotificationType = {
  TRIP_ACCEPTED: "TRIP_ACCEPTED",
  TRIP_NOT_ACCEPTED: "TRIP_NOT_ACCEPTED",
  TRIP_CANCELLED: "TRIP_CANCELLED",
  TRIP_COMPLETED: "TRIP_COMPLETED",
  TRIP_STARTED: "TRIP_STARTED",
  NEW_MESSAGE: "NEW_MESSAGE",
  DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
  VENDOR_UPDATED: "VENDOR_UPDATED",
  NEW_DRIVER_SIGNUP: "NEW_DRIVER_SIGNUP",
  NEW_DRIVER_DOCUMENT_UPLOADED: "NEW_DRIVER_DOCUMENT_UPLOADED",
} as const;
 
export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

// // Controls WHO receives the notification when no specific recipientIds are given
// export enum RecipientTarget {
//   ADMIN_ONLY = "ADMIN_ONLY", 
//   STAFF_ONLY = "STAFF_ONLY",    
//   ALL = "ALL",                 
// }