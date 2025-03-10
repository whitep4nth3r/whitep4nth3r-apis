const accessTokenFetchUrl = `https://id.twitch.tv/oauth2/token?client_id=${Netlify.env.get(
  "TWITCH_CLIENT_ID",
)}&client_secret=${Netlify.env.get("TWITCH_CLIENT_SECRET")}&grant_type=client_credentials&scope=user_read`;

let tokenInMemory = null;

const twitchId = "469006291";

const imageSizeOffline = "998x556";
const imageSizeOnline = "998x499";

const TwitchApi = {
  getAccessToken: async function () {
    try {
      const response = await fetch(accessTokenFetchUrl, {
        method: "POST",
        headers: { accept: "application/vnd.twitchtv.v5+json" },
      });
      const token = await response.json();
      tokenInMemory = token;

      return token;
    } catch (error) {
      console.log(error);
    }
  },
  getfetchOptions: function (tokenResponse) {
    return {
      headers: {
        "Client-Id": Netlify.env.get("TWITCH_CLIENT_ID"),
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    };
  },
  getStreams: async function () {
    const tokenResponse = tokenInMemory !== null ? tokenInMemory : await TwitchApi.getAccessToken();
    if (tokenResponse.access_token) {
      const streamsResponse = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${twitchId}`,
        TwitchApi.getfetchOptions(tokenResponse),
      );

      if (streamsResponse.status !== 200) {
        return null;
      }

      const streams = await streamsResponse.json();
      return streams;
    }
  },
  getVods: async function () {
    const tokenResponse = tokenInMemory !== null ? tokenInMemory : await TwitchApi.getAccessToken();
    if (tokenResponse.access_token) {
      const vodsResponse = await fetch(
        `https://api.twitch.tv/helix/videos?user_id=${twitchId}&type=archive&first=1`,
        TwitchApi.getfetchOptions(tokenResponse),
      );

      if (vodsResponse.status !== 200) {
        return null;
      }

      const vods = await vodsResponse.json();
      return vods;
    }
  },
};

export default async function (request) {
  const streams = await TwitchApi.getStreams();

  if (streams !== null && streams.data.length === 1) {
    const currentStream = streams.data[0];

    return Response.json({
      isLive: true,
      thumbnail: {
        url: currentStream.thumbnail_url.replace("{width}x{height}", imageSizeOnline),
        height: "1080",
        width: "2160",
      },
      title: currentStream.title,
      subtitle: "Live now",
      link: "https://twitch.tv/whitep4nth3r",
    });
  } else {
    const vods = await TwitchApi.getVods();

    if (vods !== null) {
      const latestVod = vods.data[0];

      const today = new Date();
      const createdOn = new Date(latestVod.created_at);
      const msInDay = 24 * 60 * 60 * 1000;

      createdOn.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diff = (+today - +createdOn) / msInDay;
      let subtitle;

      if (diff === 0) {
        subtitle = "Earlier today";
      } else if (diff === 1) {
        subtitle = "Yesterday";
      } else {
        subtitle = `${diff} days ago`;
      }

      const thumb_url = !latestVod.thumbnail_url.includes("processing")
        ? latestVod.thumbnail_url.replace("%{width}x%{height}", imageSizeOffline)
        : "/img/stream_thumb_fallback.jpg";

      return Response.json({
        isLive: false,
        thumbnail: {
          url: thumb_url,
          height: "1080",
          width: "1920",
        },
        title: latestVod.title,
        subtitle: subtitle,
        link: latestVod.url,
      });
    } else {
      return Response.json({
        isLive: false,
        thumbnail: {
          url: null,
          height: "1080",
          width: "1920",
        },
        title: null,
        subtitle: null,
        link: null,
      });
    }
  }
}
