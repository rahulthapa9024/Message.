/**
 * Formats a given date string into a time string (e.g., 23:59).
 * This is the function you already provided.
 * @param {string | Date} date - The date string or Date object.
 * @returns {string} The formatted time string.
 */
export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Formats a given date string into a localized date string,
 * showing "Today", "Yesterday", or the full date.
 * This is the function needed for the date separator in the chat.
 * @param {string | Date} date - The date string or Date object.
 * @returns {string} The formatted date string (e.g., "Yesterday" or "Nov 25, 2025").
 */
export function formatMessageDate(date) {
  const messageDate = new Date(date);
  const now = new Date();

  // Helper function to check if two dates are the same day
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // 1. Check for Today
  if (isSameDay(messageDate, now)) {
    return "Today";
  }

  // 2. Check for Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(messageDate, yesterday)) {
    return "Yesterday";
  }

  // 3. Default: Full date format
  return messageDate.toLocaleDateString("en-US", {
    month: "short", // e.g., Nov
    day: "numeric", // e.g., 25
    year: "numeric", // e.g., 2025
  });
}