import { google } from "googleapis";
import config from "../config";

const oauth2Client = new google.auth.OAuth2(
  config.google?.clientId,
  config.google?.clientSecret,
  config.google?.redirectUri
);

export const generateGoogleMeetLink = async (
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date
): Promise<string | null> => {
  try {
    if (!config.google?.refreshToken) {
      console.warn("⚠️ Google Refresh Token not found. Cannot generate a Meet link.");
      return null;
    }

    oauth2Client.setCredentials({
      refresh_token: config.google.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
      conferenceData: {
        createRequest: {
          requestId: String(Date.now()),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: event,
    });

    return response.data.hangoutLink || null;
  } catch (error) {
    console.error("❌ Error generating Google Meet link:", error);
    return null;
  }
};
