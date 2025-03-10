export default async function (request) {
  let subscribers;
  try {
    const response = await fetch(`https://api.buttondown.email/v1/subscribers`, {
      headers: {
        Authorization: `Token ${Netlify.env.get("BUTTONDOWN_API_KEY")}`,
      },
    });

    const result = await response.json();
    subscribers = result.count;
  } catch (error) {
    console.log(error);
    subscribers = "loads of";
  }
  return Response.json({ subscribers });
}
