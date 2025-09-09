// lib/bookmarkApi.js
import api from "./api";

export const bookmarkAPI = {
  // Add bookmark
  addBookmark: async (noteId) => {
    const response = await api.post("/api/bookmarks/add", { noteId });
    return response.data;
  },

  // Remove bookmark
  removeBookmark: async (noteId) => {
    const response = await api.delete("/api/bookmarks/remove", {
      data: { noteId },
    });
    return response.data;
  },

  // Get user's bookmarks
  getMyBookmarks: async (page = 1, limit = 10) => {
    const response = await api.get(
      `/api/bookmarks/my-bookmarks?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Check if note is bookmarked
  checkBookmark: async (noteId) => {
    const response = await api.get(`/api/bookmarks/check/${noteId}`);
    return response.data;
  },
};
