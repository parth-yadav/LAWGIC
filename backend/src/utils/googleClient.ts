import { OAuth2Client } from "google-auth-library";
import { getGoogleClientId, getGoogleClientSecret, getGoogleRedirectUrl } from "./auth.js";

// Create OAuth2Client dynamically to ensure environment variables are loaded
export const getOAuth2Client = () => {
  return new OAuth2Client(
    getGoogleClientId(),
    getGoogleClientSecret(),
    getGoogleRedirectUrl()
  );
};

// Use the dynamic client
export const oAuth2Client = getOAuth2Client();
