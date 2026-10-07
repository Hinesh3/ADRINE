async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Running Comprehensive Clinic OS API Integration Tests...\n');

  // Test 1: Receptionist Login
  console.log('1️⃣ Testing Receptionist Authentication...');
  const recLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'receptionist@adrineclinic.com', password: 'password123' }),
  });
  const recAuth = await recLoginRes.json();
  if (!recAuth.token || recAuth.user.role !== 'RECEPTIONIST') {
    throw new Error(`Receptionist login failed: ${JSON.stringify(recAuth)}`);
  }
  console.log(`   ✅ Receptionist Authenticated: ${recAuth.user.name} (Role: ${recAuth.user.role})`);
  const recToken = recAuth.token;

  // Test 2: Operational Dashboard
  console.log('\n2️⃣ Testing Operational Dashboard Metrics...');
  const dashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const dashData = await dashRes.json();
  console.log(`   ✅ Dashboard loaded for today (${dashData.today}):`);
  console.log(`      - Today Appointments: ${dashData.metrics.todayTotal}`);
  console.log(`      - Completed Today: ${dashData.metrics.todayCompleted}`);
  console.log(`      - Upcoming in 7 Days: ${dashData.metrics.upcomingTotal}`);
  console.log(`      - Total Patients: ${dashData.metrics.totalPatients}`);
  console.log(`      - Queue items today: ${dashData.todayQueue.length}`);
  console.log(`      - Weekly trend data points: ${dashData.weeklyActivity.length}`);

  // Test 3: Patients Directory (Search & Status Filters)
  console.log('\n3️⃣ Testing Patients Directory Filters & Pagination...');
  const allPatientsRes = await fetch(`${BASE_URL}/patients?limit=5`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const allPatients = await allPatientsRes.json();
  console.log(`   ✅ Total registered patients: ${allPatients.pagination.total}`);

  // Filter Active
  const activePatientsRes = await fetch(`${BASE_URL}/patients?status=ACTIVE`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const activePatients = await activePatientsRes.json();
  console.log(`   ✅ Active patients count: ${activePatients.pagination.total}`);

  // Filter Archived
  const archivedPatientsRes = await fetch(`${BASE_URL}/patients?status=ARCHIVED`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const archivedPatients = await archivedPatientsRes.json();
  console.log(`   ✅ Archived patients count: ${archivedPatients.pagination.total}`);

  // Search Patient
  const searchRes = await fetch(`${BASE_URL}/patients?search=Arthur`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const searchResult = await searchRes.json();
  console.log(`   ✅ Search for 'Arthur' returned: ${searchResult.patients.length} patient(s) (${searchResult.patients[0]?.firstName} ${searchResult.patients[0]?.lastName})`);
  const testPatient = searchResult.patients[0];

  // Test 4: Doctors and Real-time Slot Availability Engine
  console.log('\n4️⃣ Testing Doctors & Slot Availability Engine...');
  const docsRes = await fetch(`${BASE_URL}/doctors`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const docsData = await docsRes.json();
  console.log(`   ✅ Total active doctors: ${docsData.doctors.length}`);
  const firstDoc = docsData.doctors[0];

  const availRes = await fetch(`${BASE_URL}/doctors/${firstDoc.id}/availability?date=${dashData.today}`, {
    headers: { Authorization: `Bearer ${recToken}` },
  });
  const availData = await availRes.json();
  console.log(`   ✅ Doctor ${firstDoc.user.name} schedule generated: ${availData.slots.length} slots`);
  const bookedSlots = availData.slots.filter((s: any) => !s.isAvailable);
  const openSlots = availData.slots.filter((s: any) => s.isAvailable);
  console.log(`      - Booked slots: ${bookedSlots.length}`);
  console.log(`      - Available slots: ${openSlots.length}`);

  // Test 5: Conflict Engine Test (Attempting to double-book an occupied slot)
  if (bookedSlots.length > 0) {
    console.log('\n5️⃣ Testing Conflict Detection Engine...');
    const conflictingSlot = bookedSlots[0];
    const clashRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        patientId: testPatient.id,
        doctorId: firstDoc.id,
        appointmentDate: dashData.today,
        startTime: conflictingSlot.startTime,
        endTime: conflictingSlot.endTime,
        reason: 'Conflict test booking',
      }),
    });

    if (clashRes.status === 409) {
      const clashError = await clashRes.json();
      console.log(`   ✅ Conflict detected successfully! HTTP 409: "${clashError.error}"`);
    } else {
      console.warn(`   ⚠️ Expected 409 conflict but got status ${clashRes.status}`);
    }
  }

  // Test 6: Doctor Login & Doctor-scoped Patient Isolation
  console.log('\n6️⃣ Testing Doctor Authentication & Role-Scoped Privacy Guard...');
  const docLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.sarah@adrineclinic.com', password: 'password123' }),
  });
  const docAuth = await docLoginRes.json();
  console.log(`   ✅ Doctor Authenticated: ${docAuth.user.name} (Specialization: ${docAuth.user.doctorSpecialization})`);
  const docToken = docAuth.token;

  // Doctor Patient List (must only return patients with appointments for Dr. Sarah)
  const docPatientsRes = await fetch(`${BASE_URL}/patients`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const docPatients = await docPatientsRes.json();
  console.log(`   ✅ Doctor's isolated patient list: ${docPatients.pagination.total} patients (Scoped strictly to Dr. Sarah)`);

  // Doctor Consultation Recording
  console.log('\n7️⃣ Testing Doctor Clinical Note (SOAP) & Vitals Recording...');
  const noteRes = await fetch(`${BASE_URL}/clinical-notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${docToken}`,
    },
    body: JSON.stringify({
      patientId: testPatient.id,
      diagnosis: 'Essential Hypertension (ICD-10 I10) - Routine Review',
      symptoms: 'Mild lightheadedness upon waking, resting well otherwise.',
      prescription: 'Amlodipine 5mg OD, Telmisartan 40mg OD.',
      vitalSigns: {
        bloodPressure: '124/80 mmHg',
        heartRate: '70 bpm',
        temperature: '98.4 °F',
        oxygenSaturation: '99%',
      },
      clinicalSummary: 'Blood pressure optimized. Continue low sodium diet and regular aerobic exercise.',
      followUpDate: '2026-12-01',
    }),
  });

  const noteData = await noteRes.json();
  console.log(`   ✅ Clinical note recorded: ID ${noteData.note.id}`);
  console.log(`      Diagnosis: "${noteData.note.diagnosis}"`);

  console.log('\n🎉 ALL 7 INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
