import ApiClient from "@/utils/ApiClient";

export default async function getUser() {
  try {
    const response = await ApiClient.get("/auth/user");
    const success = response.data.success;
    const user = response.data.data.user;
    if (!success || !user) {
      console.error("Failed to fetch user.");
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
}
