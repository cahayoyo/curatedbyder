// PostHog client SDK disabled (hotfix #210/#211):
// in production its event requests failed en masse (retry storm on /i/v0/e/)
// and order-creation navigation stalled while it was active.
// Re-introduce only after root-causing the failing /e/ requests.
