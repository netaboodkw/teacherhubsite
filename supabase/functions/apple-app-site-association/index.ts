import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "Z27XGT5N8K.com.abdullah.teacherhub",
        paths: [
          "/teacher/subscription/success*",
          "/teacher/subscription/error*",
          "/payment-callback*"
        ]
      }
    ]
  },
  webcredentials: {
    apps: [
      "Z27XGT5N8K.com.abdullah.teacherhub"
    ]
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response(JSON.stringify(appleAppSiteAssociation), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
