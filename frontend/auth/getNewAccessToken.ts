export default async function getNewAccessToken(
  refreshToken: string
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/auth/refresh`,
      {
        headers: {
          "Content-Type": "application/json",
          "refresh-token": refreshToken,
        },
        cache: "no-store",
      }
    );

    const {
      data: { accessToken },
    } = await response.json();

    return accessToken;
  } catch (error) {
    console.error("Failed to get new access token:", error);
    return undefined;
  }
}
