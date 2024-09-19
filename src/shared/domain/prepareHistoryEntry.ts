/**
 * Prepares browser history before a user action is called
 *
 * This can be called BEFORE a user action is triggered. It is expected that the app is using UrlSyncManager
 * and the user action will change at least one variable or state synced with the URL. Once any variable or
 * state synced with the URL is triggered, UrlSyncManager will take care of replacing the prepared history entry.
 */
export function prepareHistoryEntry() {
  history.pushState(null, '');
}
