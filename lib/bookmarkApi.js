
import api from "./api";

export const bookmarkAPI = {

  addBookmark: async (noteId) => {
    const response = await api.post("/api/bookmarks/add", { noteId });
    return response.data;
  },


  removeBookmark: async (noteId) => {
    const response = await api.delete("/api/bookmarks/remove", {
      data: { noteId },
    });
    return response.data;
  },

  
  getMyBookmarks: async (page = 1, limit = 10) => {
    const response = await api.get(
      `/api/bookmarks/my-bookmarks?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  checkBookmark: async (noteId) => {
    const response = await api.get(`/api/bookmarks/check/${noteId}`);
    return response.data;
  },
};
