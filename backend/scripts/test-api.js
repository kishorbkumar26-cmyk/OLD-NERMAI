const axios = require('axios');

async function testApi() {
  try {
    const overviewRes = await axios.get('http://localhost:3000/api/v1/dashboard/student/overview', {
      headers: {
        Authorization: `Bearer DEV_STUDENT_TOKEN`
      }
    });
    
    console.log(JSON.stringify(overviewRes.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

testApi();
