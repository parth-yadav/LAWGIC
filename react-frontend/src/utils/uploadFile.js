import ApiClient from "./ApiClient";
import { getErrorMessage } from "./utils";

export const uploadFile = async ({ file, folder }) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);

    const response = await ApiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      return { data: { fileUrl: response.data.data.fileUrl }, errorMessage: null };
    }
    return { data: null, errorMessage: response.data.error?.message || "Upload failed" };
  } catch (error) {
    return { data: null, errorMessage: getErrorMessage(error) };
  }
};
