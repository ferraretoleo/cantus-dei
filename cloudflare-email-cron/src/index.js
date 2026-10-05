export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      fetch(`${env.API_URL}/jobs/email-diario`, {
        method:'POST',
        headers:{
          'x-job-secret':env.DAILY_EMAIL_SECRET
        }
      }).then(async response=>{
        if (!response.ok) {
          throw new Error(
            `Cantus Dei daily email failed: ${response.status} ${await response.text()}`
          );
        }
      })
    );
  }
};
