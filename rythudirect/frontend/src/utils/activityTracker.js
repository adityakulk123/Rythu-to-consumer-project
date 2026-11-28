import api from '../services/api';

// Generates or retrieves an anonymous intra-session id
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('rythu_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    sessionStorage.setItem('rythu_session_id', sessionId);
  }
  return sessionId;
};

let lastTrackedPath = null;
let lastTrackedTime = 0;

/**
 * Tracks intra-website page navigation.
 * Privacy safe: Only sends relative path and internal page title.
 */
export const trackPageView = async (path, title = '') => {
  const now = Date.now();
  if (lastTrackedPath === path && now - lastTrackedTime < 1200) {
    return;
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  try {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    await api.post('/activity/track', {
      activity_type: 'PAGE_VIEW',
      page_path: safePath,
      page_title: title || document.title || 'RythuDirect',
      session_id: getSessionId(),
    });
  } catch (err) {
    // Non-blocking for seamless UX
    console.debug('Activity tracking ping:', err?.message);
  }
};

/**
 * Tracks user feature interaction (e.g. AddToCart, Checkout, Filters, etc.)
 */
export const trackFeatureInteraction = async (featureName, details = null, currentPath = null) => {
  try {
    const path = currentPath || window.location.pathname || '/';
    await api.post('/activity/track', {
      activity_type: 'FEATURE_INTERACTION',
      page_path: path.startsWith('/') ? path : `/${path}`,
      page_title: document.title || 'RythuDirect',
      feature_name: featureName,
      details: typeof details === 'object' ? JSON.stringify(details) : (details || ''),
      session_id: getSessionId(),
    });
  } catch (err) {
    console.debug('Feature tracking ping:', err?.message);
  }
};
