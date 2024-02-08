export const setupRequestListeners = (page, urls) => urls.map((url) => page.waitForRequest(url));
