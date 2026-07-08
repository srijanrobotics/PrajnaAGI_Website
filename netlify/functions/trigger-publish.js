const { schedule } = require('@netlify/functions');

const handler = async function(event, context) {
  const token = process.env.GH_PAT;
  if (!token) {
    console.error("GH_PAT environment variable is missing in Netlify!");
    return { statusCode: 500, body: "Missing GH_PAT environment variable" };
  }

  try {
    // Call the GitHub API to trigger the auto-publish workflow
    const res = await fetch('https://api.github.com/repos/srijanrobotics/PrajnaAGI_Website/actions/workflows/auto-publish.yml/dispatches', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Netlify-Scheduled-Function'
      },
      body: JSON.stringify({
        ref: 'master'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`GitHub API returned error ${res.status}: ${errText}`);
      return { statusCode: res.status, body: errText };
    }

    console.log("Successfully triggered GitHub Actions auto-publish workflow!");
    return { statusCode: 200, body: "Triggered successfully" };
  } catch (error) {
    console.error("Error triggering GitHub Actions:", error);
    return { statusCode: 500, body: error.message };
  }
};

// Run at 7:00 AM IST (01:30 UTC) and 5:00 PM IST (11:30 UTC) every day
exports.handler = schedule('30 1,11 * * *', handler);
