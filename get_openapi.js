import https from "https";

const url = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/?apikey=" + process.env.SUPABASE_SERVICE_ROLE_KEY
);

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    const json = JSON.parse(data);
    const dd = json.definitions.doctors_directory;
    console.log(JSON.stringify(dd, null, 2));
  });
});
