const http = require('http');

const request = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5002,
      path,
      method,
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Starting End-to-End API and MongoDB Verification Suite...\n');
  let passCount = 0;
  let failCount = 0;

  const assertTest = (name, condition, extraInfo = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${extraInfo}`);
      failCount++;
    }
  };

  try {
    // 1. Health check & DB connection
    const health = await request('GET', '/health');
    assertTest('Server Health Check & MongoDB Connection', 
      health.status === 200 && health.body.database?.status === 'connected',
      JSON.stringify(health.body)
    );

    // 2. Admin Login
    const login = await request('POST', '/api/auth/login', {
      email: 'admin@crm.com',
      password: 'password123'
    });
    assertTest('Admin User Authentication', login.status === 200 && !!login.body.data?.token);
    const token = login.body.data?.token;

    // 3. User Profile (/auth/me)
    const profile = await request('GET', '/api/auth/me', null, token);
    assertTest('User Profile Fetch (/api/auth/me)', profile.status === 200 && profile.body.data?.email === 'admin@crm.com');

    // 4. Employee Statistics (Previously threw CastError 500)
    const empStats = await request('GET', '/api/employees/statistics', null, token);
    assertTest('Employee Statistics Route (/api/employees/statistics)', empStats.status === 200 && empStats.body.data?.total > 0);

    // 5. Department Statistics
    const deptStats = await request('GET', '/api/departments/statistics', null, token);
    assertTest('Department Statistics Route (/api/departments/statistics)', deptStats.status === 200 && deptStats.body.data?.total > 0);

    // 6. Employees List
    const employees = await request('GET', '/api/employees', null, token);
    assertTest('Employees List from MongoDB (/api/employees)', employees.status === 200 && employees.body.data?.length > 0);

    // 7. Departments List
    const departments = await request('GET', '/api/departments', null, token);
    assertTest('Departments List from MongoDB (/api/departments)', departments.status === 200 && departments.body.data?.length > 0);

    // 8. Attendance Today
    const attendance = await request('GET', '/api/attendance/today', null, token);
    assertTest('Today Attendance Records (/api/attendance/today)', attendance.status === 200 && attendance.body.data?.length > 0);

    // 9. Dashboard Stats
    const dashStats = await request('GET', '/api/dashboard/stats', null, token);
    assertTest('Live Dashboard Stats (/api/dashboard/stats)', dashStats.status === 200 && dashStats.body.totalEmployees > 0);

    // 10. Leaves List
    const leaves = await request('GET', '/api/leaves', null, token);
    assertTest('Leave Requests from MongoDB (/api/leaves)', leaves.status === 200 && leaves.body.data?.length > 0);

    // 11. Projects List
    const projects = await request('GET', '/api/projects', null, token);
    assertTest('Projects List from MongoDB (/api/projects)', projects.status === 200 && projects.body.data?.length > 0);

    // 12. Loans List
    const loans = await request('GET', '/api/loans', null, token);
    assertTest('Loans List from MongoDB (/api/loans)', loans.status === 200 && loans.body.data?.length > 0);

    // 13. Payslips List
    const payslips = await request('GET', '/api/payslips', null, token);
    assertTest('Payslips List from MongoDB (/api/payslips)', payslips.status === 200 && payslips.body.data?.length > 0);

    // 14. Recruitments List
    const recruitments = await request('GET', '/api/recruitments', null, token);
    assertTest('Recruitments List from MongoDB (/api/recruitments)', recruitments.status === 200 && recruitments.body.data?.length > 0);

    // 15. Awards List
    const awards = await request('GET', '/api/awards', null, token);
    assertTest('Awards List from MongoDB (/api/awards)', awards.status === 200 && awards.body.data?.length > 0);

    console.log(`\n📊 Test Summary: ${passCount} Passed, ${failCount} Failed.`);
    if (failCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
};

runTests();
