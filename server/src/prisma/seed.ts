import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { format, addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing tables in order
  await prisma.clinicalNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Staff Users
  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@adrineclinic.com',
      name: 'Emma Watson',
      passwordHash,
      role: 'RECEPTIONIST',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const doc1User = await prisma.user.create({
    data: {
      email: 'dr.sarah@adrineclinic.com',
      name: 'Dr. Sarah Jenkins',
      passwordHash,
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const doc2User = await prisma.user.create({
    data: {
      email: 'dr.marcus@adrineclinic.com',
      name: 'Dr. Marcus Vance',
      passwordHash,
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const doc3User = await prisma.user.create({
    data: {
      email: 'dr.elena@adrineclinic.com',
      name: 'Dr. Elena Rostova',
      passwordHash,
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1594824813576-476a66a1a1f1?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Doctor Profiles
  const doc1 = await prisma.doctor.create({
    data: {
      userId: doc1User.id,
      specialization: 'Cardiology & Internal Medicine',
      licenseNumber: 'MD-884920',
      consultationFee: 120.0,
      phone: '+1 (555) 234-5678',
      bio: 'Board-certified cardiologist specializing in preventive cardiology and hypertension management.',
      workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      startTime: '08:30',
      endTime: '16:30',
      slotDurationMinutes: 30,
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      userId: doc2User.id,
      specialization: 'General Practice & Family Medicine',
      licenseNumber: 'MD-443219',
      consultationFee: 75.0,
      phone: '+1 (555) 345-6789',
      bio: 'Family physician with 12+ years of outpatient clinical care experience.',
      workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      userId: doc3User.id,
      specialization: 'Pediatrics & Endocrinology',
      licenseNumber: 'MD-991043',
      consultationFee: 95.0,
      phone: '+1 (555) 456-7890',
      bio: 'Dedicated pediatric specialist focused on child wellness and metabolic health.',
      workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      startTime: '09:00',
      endTime: '15:30',
      slotDurationMinutes: 30,
    },
  });

  console.log('✅ Created Staff & Doctor Profiles');

  // 3. Create Diverse Patients (with Active, Inactive, Archived statuses)
  const patientData = [
    {
      patientCode: 'PT-10001',
      firstName: 'Arthur',
      lastName: 'Pendelton',
      dateOfBirth: '1978-04-12',
      gender: 'Male',
      phone: '+1 (555) 891-2041',
      email: 'arthur.p@example.com',
      address: '742 Evergreen Terrace, Springfield',
      emergencyContactName: 'Clara Pendelton (Spouse)',
      emergencyContactPhone: '+1 (555) 891-2042',
      bloodGroup: 'O+',
      allergies: 'Penicillin, Shellfish',
      medicalHistory: 'Stage 1 Hypertension, Hyperlipidemia',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10002',
      firstName: 'Beatrix',
      lastName: 'Chen',
      dateOfBirth: '1992-09-24',
      gender: 'Female',
      phone: '+1 (555) 312-9844',
      email: 'beatrix.chen@example.com',
      address: '1088 Park Ave, Apt 4B, Metro City',
      emergencyContactName: 'David Chen (Brother)',
      emergencyContactPhone: '+1 (555) 312-9840',
      bloodGroup: 'A-',
      allergies: 'Aspirin',
      medicalHistory: 'Migraine with aura, Mild Asthma',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10003',
      firstName: 'Cedric',
      lastName: 'O\'Connor',
      dateOfBirth: '1965-11-03',
      gender: 'Male',
      phone: '+1 (555) 745-1102',
      email: 'cedric.oc@example.com',
      address: '45 Oak Ridge Lane, Riverdale',
      emergencyContactName: 'Maureen O\'Connor (Wife)',
      emergencyContactPhone: '+1 (555) 745-1100',
      bloodGroup: 'B+',
      allergies: 'Sulfa drugs',
      medicalHistory: 'Type 2 Diabetes, Osteoarthritis',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10004',
      firstName: 'Diana',
      lastName: 'Prince',
      dateOfBirth: '1988-06-18',
      gender: 'Female',
      phone: '+1 (555) 670-3329',
      email: 'diana.p@example.com',
      address: '221B Baker View Road, Gotham',
      emergencyContactName: 'Steve Trevor',
      emergencyContactPhone: '+1 (555) 670-9988',
      bloodGroup: 'AB+',
      allergies: 'No known allergies',
      medicalHistory: 'None reported',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10005',
      firstName: 'Ethan',
      lastName: 'Hunt',
      dateOfBirth: '1984-08-11',
      gender: 'Male',
      phone: '+1 (555) 902-4411',
      email: 'ethan.hunt@example.com',
      address: '350 Mission Plaza, Langley',
      emergencyContactName: 'Julia Meade',
      emergencyContactPhone: '+1 (555) 902-4400',
      bloodGroup: 'O-',
      allergies: 'Latex',
      medicalHistory: 'Previous shoulder reconstruction (2021)',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10006',
      firstName: 'Fiona',
      lastName: 'Gallagher',
      dateOfBirth: '1995-02-14',
      gender: 'Female',
      phone: '+1 (555) 431-7788',
      email: 'fiona.g@example.com',
      address: '2119 S Wallace St, South Side',
      emergencyContactName: 'Lip Gallagher (Brother)',
      emergencyContactPhone: '+1 (555) 431-7700',
      bloodGroup: 'A+',
      allergies: 'Ibuprofen',
      medicalHistory: 'Iron deficiency anemia',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10007',
      firstName: 'George',
      lastName: 'Costanza',
      dateOfBirth: '1959-10-17',
      gender: 'Male',
      phone: '+1 (555) 555-8991',
      email: 'george.c@vandelay.com',
      address: '1344 Queens Blvd, New York',
      emergencyContactName: 'Frank Costanza (Father)',
      emergencyContactPhone: '+1 (555) 555-8990',
      bloodGroup: 'B-',
      allergies: 'Pollen, Dust mites',
      medicalHistory: 'Arrhythmia workup, Generalized Anxiety',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10008',
      firstName: 'Hannah',
      lastName: 'Abbott',
      dateOfBirth: '2001-03-29',
      gender: 'Female',
      phone: '+1 (555) 123-9090',
      email: 'hannah.a@example.com',
      address: '12 Blossom Way, Hogsmeade',
      emergencyContactName: 'Neville Longbottom',
      emergencyContactPhone: '+1 (555) 123-9099',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalHistory: 'Eczema',
      status: 'INACTIVE',
    },
    {
      patientCode: 'PT-10009',
      firstName: 'Ian',
      lastName: 'Malcolm',
      dateOfBirth: '1952-12-05',
      gender: 'Male',
      phone: '+1 (555) 998-3344',
      email: 'dr.malcolm@chaos.org',
      address: '88 Isla Nublar Way, Austin',
      emergencyContactName: 'Sarah Harding',
      emergencyContactPhone: '+1 (555) 998-3300',
      bloodGroup: 'AB-',
      allergies: 'Codeine',
      medicalHistory: 'Chronic right leg pain, Hypertension',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10010',
      firstName: 'Jasmine',
      lastName: 'Kaur',
      dateOfBirth: '1998-07-21',
      gender: 'Female',
      phone: '+1 (555) 443-8822',
      email: 'j.kaur@example.com',
      address: '500 Silver Maple Court, Toronto',
      emergencyContactName: 'Harpreet Kaur (Mother)',
      emergencyContactPhone: '+1 (555) 443-8800',
      bloodGroup: 'B+',
      allergies: 'Peanuts, Tree nuts',
      medicalHistory: 'Anaphylaxis history (carries EpiPen)',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10011',
      firstName: 'Kevin',
      lastName: 'Malone',
      dateOfBirth: '1970-05-15',
      gender: 'Male',
      phone: '+1 (555) 789-0123',
      email: 'kevin.m@dundermifflin.com',
      address: '1725 Slough Ave, Scranton',
      emergencyContactName: 'Stacy Malone',
      emergencyContactPhone: '+1 (555) 789-0199',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalHistory: 'Obesity, Pre-diabetes, Sleep Apnea',
      status: 'ACTIVE',
    },
    {
      patientCode: 'PT-10012',
      firstName: 'Laura',
      lastName: 'Croft',
      dateOfBirth: '1985-02-14',
      gender: 'Female',
      phone: '+1 (555) 654-3210',
      email: 'lara.croft@manor.co.uk',
      address: 'Croft Manor, Surrey',
      emergencyContactName: 'Winston Smith',
      emergencyContactPhone: '+1 (555) 654-3200',
      bloodGroup: 'AB+',
      allergies: 'None',
      medicalHistory: 'Repetitive strain injury (wrist)',
      status: 'ARCHIVED',
    },
  ];

  const createdPatients: any[] = [];
  for (const p of patientData) {
    const pt = await prisma.patient.create({ data: p });
    createdPatients.push(pt);
  }

  console.log(`✅ Created ${createdPatients.length} Patients`);

  // 4. Create realistic appointments across TODAY, PAST, and FUTURE
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgoStr = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  const threeDaysAgoStr = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfterTomorrowStr = format(addDays(new Date(), 2), 'yyyy-MM-dd');
  const in3DaysStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const in4DaysStr = format(addDays(new Date(), 4), 'yyyy-MM-dd');

  const appointmentsData = [
    // --- TODAY'S APPOINTMENTS ---
    {
      appointmentCode: 'APT-2025-0101',
      patientId: createdPatients[0].id, // Arthur Pendelton
      doctorId: doc1.id, // Dr. Sarah Jenkins (Cardiology)
      appointmentDate: todayStr,
      startTime: '09:00',
      endTime: '09:30',
      status: 'COMPLETED',
      type: 'FOLLOW_UP',
      reason: 'Hypertension quarterly check & BP medication review',
      notes: 'Patient reports mild morning dizziness. Checked BP log.',
    },
    {
      appointmentCode: 'APT-2025-0102',
      patientId: createdPatients[1].id, // Beatrix Chen
      doctorId: doc2.id, // Dr. Marcus Vance
      appointmentDate: todayStr,
      startTime: '09:30',
      endTime: '10:00',
      status: 'IN_PROGRESS',
      type: 'CONSULTATION',
      reason: 'Persistent migraine headaches for past 2 weeks',
      notes: 'Triggered by screen time and poor sleep.',
    },
    {
      appointmentCode: 'APT-2025-0103',
      patientId: createdPatients[2].id, // Cedric O'Connor
      doctorId: doc1.id, // Dr. Sarah Jenkins
      appointmentDate: todayStr,
      startTime: '10:30',
      endTime: '11:00',
      status: 'SCHEDULED',
      type: 'CHECKUP',
      reason: 'Chest tightness upon climbing stairs',
      notes: 'Requested ECG and lipid profile check.',
    },
    {
      appointmentCode: 'APT-2025-0104',
      patientId: createdPatients[3].id, // Diana Prince
      doctorId: doc2.id, // Dr. Marcus Vance
      appointmentDate: todayStr,
      startTime: '11:00',
      endTime: '11:30',
      status: 'CONFIRMED',
      type: 'CONSULTATION',
      reason: 'Annual routine wellness examination',
      notes: 'General blood work requested.',
    },
    {
      appointmentCode: 'APT-2025-0105',
      patientId: createdPatients[4].id, // Ethan Hunt
      doctorId: doc3.id, // Dr. Elena Rostova
      appointmentDate: todayStr,
      startTime: '11:30',
      endTime: '12:00',
      status: 'SCHEDULED',
      type: 'FOLLOW_UP',
      reason: 'Post-physical recovery evaluation',
      notes: 'Orthopedic follow up.',
    },
    {
      appointmentCode: 'APT-2025-0106',
      patientId: createdPatients[5].id, // Fiona Gallagher
      doctorId: doc1.id, // Dr. Sarah Jenkins
      appointmentDate: todayStr,
      startTime: '14:00',
      endTime: '14:30',
      status: 'CANCELLED',
      type: 'CONSULTATION',
      reason: 'Palpitations after morning coffee',
      cancellationReason: 'Patient called to reschedule due to work conflict',
      notes: '',
    },
    {
      appointmentCode: 'APT-2025-0107',
      patientId: createdPatients[6].id, // George Costanza
      doctorId: doc1.id, // Dr. Sarah Jenkins
      appointmentDate: todayStr,
      startTime: '14:30',
      endTime: '15:00',
      status: 'SCHEDULED',
      type: 'CONSULTATION',
      reason: 'Stress-induced tachycardia and anxiety palpitations',
      notes: 'Anxious patient, requested comprehensive cardiovascular review.',
    },
    {
      appointmentCode: 'APT-2025-0108',
      patientId: createdPatients[9].id, // Jasmine Kaur
      doctorId: doc3.id, // Dr. Elena Rostova
      appointmentDate: todayStr,
      startTime: '15:00',
      endTime: '15:30',
      status: 'CONFIRMED',
      type: 'CHECKUP',
      reason: 'Thyroid function & hormone level check',
      notes: '',
    },

    // --- PAST APPOINTMENTS (COMPLETED) ---
    {
      appointmentCode: 'APT-2025-0080',
      patientId: createdPatients[0].id,
      doctorId: doc1.id,
      appointmentDate: yesterdayStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'COMPLETED',
      type: 'CONSULTATION',
      reason: 'Initial consultation for high blood pressure readings at home',
      notes: 'Baseline ECG normal.',
    },
    {
      appointmentCode: 'APT-2025-0081',
      patientId: createdPatients[2].id,
      doctorId: doc2.id,
      appointmentDate: yesterdayStr,
      startTime: '11:00',
      endTime: '11:30',
      status: 'COMPLETED',
      type: 'FOLLOW_UP',
      reason: 'Diabetes HbA1c review',
      notes: 'HbA1c at 6.8%, well controlled.',
    },
    {
      appointmentCode: 'APT-2025-0070',
      patientId: createdPatients[8].id, // Ian Malcolm
      doctorId: doc2.id,
      appointmentDate: twoDaysAgoStr,
      startTime: '14:00',
      endTime: '14:30',
      status: 'COMPLETED',
      type: 'CONSULTATION',
      reason: 'Chronic joint inflammation and pain management',
      notes: 'Prescribed topical NSAID and physical therapy referral.',
    },
    {
      appointmentCode: 'APT-2025-0065',
      patientId: createdPatients[10].id, // Kevin Malone
      doctorId: doc2.id,
      appointmentDate: threeDaysAgoStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'COMPLETED',
      type: 'CHECKUP',
      reason: 'Weight management & dietary counseling',
      notes: 'Discussed low sodium lifestyle modifications.',
    },

    // --- FUTURE APPOINTMENTS ---
    {
      appointmentCode: 'APT-2025-0201',
      patientId: createdPatients[1].id,
      doctorId: doc2.id,
      appointmentDate: tomorrowStr,
      startTime: '09:00',
      endTime: '09:30',
      status: 'CONFIRMED',
      type: 'FOLLOW_UP',
      reason: 'Review headache diary and response to medication',
      notes: '',
    },
    {
      appointmentCode: 'APT-2025-0202',
      patientId: createdPatients[8].id,
      doctorId: doc1.id,
      appointmentDate: tomorrowStr,
      startTime: '11:00',
      endTime: '11:30',
      status: 'SCHEDULED',
      type: 'CONSULTATION',
      reason: 'Cardiac risk assessment and treadmill stress test review',
      notes: '',
    },
    {
      appointmentCode: 'APT-2025-0203',
      patientId: createdPatients[3].id,
      doctorId: doc3.id,
      appointmentDate: dayAfterTomorrowStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'SCHEDULED',
      type: 'CONSULTATION',
      reason: 'Endocrine hormonal panel follow-up',
      notes: '',
    },
    {
      appointmentCode: 'APT-2025-0204',
      patientId: createdPatients[4].id,
      doctorId: doc2.id,
      appointmentDate: in3DaysStr,
      startTime: '14:00',
      endTime: '14:30',
      status: 'SCHEDULED',
      type: 'CHECKUP',
      reason: 'Vaccination booster & travel medicine advice',
      notes: '',
    },
    {
      appointmentCode: 'APT-2025-0205',
      patientId: createdPatients[9].id,
      doctorId: doc1.id,
      appointmentDate: in4DaysStr,
      startTime: '09:30',
      endTime: '10:00',
      status: 'CONFIRMED',
      type: 'CONSULTATION',
      reason: 'Pre-operative cardiac clearance',
      notes: '',
    },
  ];

  const createdAppointments: any[] = [];
  for (const apt of appointmentsData) {
    const created = await prisma.appointment.create({ data: apt });
    createdAppointments.push(created);
  }

  console.log(`✅ Created ${createdAppointments.length} Appointments`);

  // 5. Create Clinical Notes attached to completed appointments
  // Note 1: For Arthur Pendelton (Today's completed appointment)
  await prisma.clinicalNote.create({
    data: {
      appointmentId: createdAppointments[0].id,
      patientId: createdPatients[0].id,
      doctorId: doc1.id,
      diagnosis: 'Essential Hypertension (ICD-10 I10) - Stable control',
      symptoms: 'Mild early morning lightheadedness, no chest pain, no palpitations, no shortness of breath.',
      prescription: 'Amlodipine 5mg OD (morning), continue Telmisartan 40mg OD. Discontinue evening dose if postural hypotension persists.',
      vitalSigns: JSON.stringify({
        bloodPressure: '128/82 mmHg',
        heartRate: '72 bpm',
        temperature: '98.4 °F',
        respiratoryRate: '16 bpm',
        oxygenSaturation: '99%',
        weightKg: '82.5',
        heightCm: '178',
      }),
      clinicalSummary: 'Patient exhibits good compliance with antihypertensive regimen. Blood pressure has stabilized within target goal (<130/80). Urged reduction in dietary sodium intake and continuation of daily 30-minute aerobic walks.',
      followUpDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
    },
  });

  // Note 2: For Arthur Pendelton (Yesterday's appointment)
  await prisma.clinicalNote.create({
    data: {
      appointmentId: createdAppointments[8].id,
      patientId: createdPatients[0].id,
      doctorId: doc1.id,
      diagnosis: 'Elevated blood pressure reading on home monitoring',
      symptoms: 'Occasional occipital tension headache, fatigue.',
      prescription: 'Ordered 24-hr ambulatory blood pressure monitoring and comprehensive metabolic panel.',
      vitalSigns: JSON.stringify({
        bloodPressure: '142/90 mmHg',
        heartRate: '78 bpm',
        temperature: '98.6 °F',
        respiratoryRate: '18 bpm',
        oxygenSaturation: '98%',
        weightKg: '83.0',
        heightCm: '178',
      }),
      clinicalSummary: 'Advised home blood pressure log twice daily (AM/PM) for 1 week prior to starting pharmacological escalation.',
      followUpDate: todayStr,
    },
  });

  // Note 3: For Cedric O'Connor (Yesterday's appointment with Dr. Marcus)
  await prisma.clinicalNote.create({
    data: {
      appointmentId: createdAppointments[9].id,
      patientId: createdPatients[2].id,
      doctorId: doc2.id,
      diagnosis: 'Type 2 Diabetes Mellitus without complications (ICD-10 E11.9)',
      symptoms: 'No polyuria or polydipsia. Reports good energy levels.',
      prescription: 'Metformin 500mg BD with meals. Glimepiride 1mg OD.',
      vitalSigns: JSON.stringify({
        bloodPressure: '130/84 mmHg',
        heartRate: '68 bpm',
        temperature: '98.2 °F',
        respiratoryRate: '15 bpm',
        oxygenSaturation: '99%',
        weightKg: '91.2',
        heightCm: '175',
      }),
      clinicalSummary: 'HbA1c levels show steady improvement at 6.8%. Foot examination reveals intact sensation bilaterally (monofilament test normal). Annual ophthalmology retinal exam scheduled.',
      followUpDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
    },
  });

  // Note 4: For Ian Malcolm (Dr. Marcus)
  await prisma.clinicalNote.create({
    data: {
      appointmentId: createdAppointments[10].id,
      patientId: createdPatients[8].id,
      doctorId: doc2.id,
      diagnosis: 'Osteoarthritis of knee & chronic musculoskeletal strain',
      symptoms: 'Stiffness in the morning lasting < 30 minutes, crepitus in right knee.',
      prescription: 'Voltaren Gel (Diclofenac 1%) apply tid PRN. Paracetamol 1000mg PRN.',
      vitalSigns: JSON.stringify({
        bloodPressure: '136/85 mmHg',
        heartRate: '74 bpm',
        temperature: '98.7 °F',
        respiratoryRate: '16 bpm',
        oxygenSaturation: '98%',
        weightKg: '88.0',
        heightCm: '183',
      }),
      clinicalSummary: 'Recommended low-impact swimming and quadriceps strengthening exercises. Avoid high-impact running.',
      followUpDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
    },
  });

  console.log('✅ Created Clinical Notes & Vitals');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
