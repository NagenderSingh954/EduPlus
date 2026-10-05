import { PrismaClient, Role, AttendanceStatus, AssignmentStatus, TaskCategory, Priority, TaskSource, ProficiencyLevel, CollabRequestStatus, ProjectStatus, ProjectRole, ProjectTaskStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AcademiQ Database Seeding...');

  // Clean existing tables in reverse dependency order
  await prisma.projectTask.deleteMany();
  await prisma.projectMilestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.collaborationRequest.deleteMany();
  await prisma.collaborationProfile.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.communityVote.deleteMany();
  await prisma.communityAnswer.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.task.deleteMany();
  await prisma.academicAnalysis.deleteMany();
  await prisma.academicDocument.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'dr.sharma@campus.edu',
      passwordHash,
      role: Role.TEACHER,
      firstName: 'Ramesh',
      lastName: 'Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      teacherProfile: {
        create: {
          employeeId: 'T-1001',
          department: 'Computer Science & Engineering',
          designation: 'Associate Professor & HOD'
        }
      }
    },
    include: { teacherProfile: true }
  });

  const teacherProfile = teacherUser1.teacherProfile!;

  // 2. Create Courses
  const dbmsCourse = await prisma.course.create({
    data: {
      code: 'CS501',
      name: 'Database Management Systems',
      description: 'Relational model, SQL, Normalization, ACID transactions, and Indexing.',
      department: 'Computer Science & Engineering',
      semester: 5,
      credits: 4,
      teacherId: teacherProfile.id
    }
  });

  const osCourse = await prisma.course.create({
    data: {
      code: 'CS502',
      name: 'Operating Systems',
      description: 'Processes, CPU scheduling, Deadlocks, Memory paging, and File systems.',
      department: 'Computer Science & Engineering',
      semester: 5,
      credits: 4,
      teacherId: teacherProfile.id
    }
  });

  const cnCourse = await prisma.course.create({
    data: {
      code: 'CS503',
      name: 'Computer Networks',
      description: 'OSI, TCP/IP stack, Routing protocols, Congestion control, and Socket API.',
      department: 'Computer Science & Engineering',
      semester: 5,
      credits: 3,
      teacherId: teacherProfile.id
    }
  });

  const mathCourse = await prisma.course.create({
    data: {
      code: 'MA501',
      name: 'Discrete Mathematics & Probability',
      description: 'Combinatorics, Graph Theory, Markov Chains, and Probability distributions.',
      department: 'Mathematics',
      semester: 5,
      credits: 4,
      teacherId: teacherProfile.id
    }
  });

  // 3. Create Classes
  const dbmsClass = await prisma.class.create({
    data: { courseId: dbmsCourse.id, section: 'A', semester: 5, academicYear: '2026-2027' }
  });
  const osClass = await prisma.class.create({
    data: { courseId: osCourse.id, section: 'A', semester: 5, academicYear: '2026-2027' }
  });
  const cnClass = await prisma.class.create({
    data: { courseId: cnCourse.id, section: 'A', semester: 5, academicYear: '2026-2027' }
  });
  const mathClass = await prisma.class.create({
    data: { courseId: mathCourse.id, section: 'A', semester: 5, academicYear: '2026-2027' }
  });

  // 4. Skills Pool
  const skillNames = [
    { name: 'Computer Vision', category: 'AI & ML' },
    { name: 'Machine Learning', category: 'AI & ML' },
    { name: 'Deep Learning', category: 'AI & ML' },
    { name: 'Natural Language Processing', category: 'AI & ML' },
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'TypeScript', category: 'Fullstack' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Python', category: 'Programming' },
    { name: 'FastAPI', category: 'Backend' },
    { name: 'Agritech / Domain Science', category: 'Domain Knowledge' },
    { name: 'UI/UX Design', category: 'Design' }
  ];

  const skillMap: Record<string, string> = {};
  for (const s of skillNames) {
    const sk = await prisma.skill.create({ data: s });
    skillMap[s.name] = sk.id;
  }

  // 5. Create Students
  // Demo Student: Alex Rivera
  const alexUser = await prisma.user.create({
    data: {
      email: 'alex.rivera@campus.edu',
      passwordHash,
      role: Role.STUDENT,
      firstName: 'Alex',
      lastName: 'Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      studentProfile: {
        create: {
          rollNumber: '21BCSE042',
          semester: 5,
          department: 'Computer Science & Engineering',
          gpa: 3.65,
          academicSummary: 'High potential 5th-semester CSE student with exceptional performance in Systems & Networking, but shows critical vulnerability in DBMS Normalization (scored 62%) and Discrete Math attendance (74% - at risk).',
          strengths: ['SQL Query Optimization', 'Data Structures & Algorithms', 'Socket Programming', 'Full-stack Web Dev'],
          weaknesses: ['DBMS Normalization (3NF & BCNF)', 'Operating System Deadlock Avoidance', 'Discrete Probability'],
          learningPreferences: { style: 'Hands-on practical drills & visual concept diagrams', optimalSessionMinutes: 45 },
          currentGoals: ['Boost DBMS grade to A-', 'Raise Math attendance above 75% threshold', 'Build an AI Agriculture Hackathon Project'],
          upcomingPriorities: ['Revise 3NF vs BCNF for Midterm', 'Complete DBMS Assignment #2', 'Attend next 3 Discrete Math lectures']
        }
      },
      notifPreference: {
        create: { emailEnabled: true, inAppEnabled: true, dailyDigestTime: '07:30', attendanceThresholdAlert: true }
      }
    },
    include: { studentProfile: true }
  });

  const alexProfile = alexUser.studentProfile!;

  // Collaboration Profile for Alex
  await prisma.collaborationProfile.create({
    data: {
      studentId: alexProfile.id,
      bio: 'Full-stack developer with a passion for building AI-driven web apps. Looking for ML/CV and agritech teammates for university hackathon.',
      lookingFor: 'Computer Vision / ML engineer & Domain specialist',
      interests: ['Artificial Intelligence', 'Full-stack Systems', 'Agritech'],
      availabilityHoursWeekly: 14,
      githubUrl: 'https://github.com/alexrivera-campus',
      portfolioUrl: 'https://alexrivera.dev'
    }
  });

  // Assign Skills to Alex
  await prisma.studentSkill.createMany({
    data: [
      { studentId: alexProfile.id, skillId: skillMap['React'], proficiencyLevel: ProficiencyLevel.EXPERT },
      { studentId: alexProfile.id, skillId: skillMap['Node.js'], proficiencyLevel: ProficiencyLevel.ADVANCED },
      { studentId: alexProfile.id, skillId: skillMap['TypeScript'], proficiencyLevel: ProficiencyLevel.ADVANCED },
      { studentId: alexProfile.id, skillId: skillMap['PostgreSQL'], proficiencyLevel: ProficiencyLevel.INTERMEDIATE }
    ]
  });

  // Additional 11 Students for rich campus network & AI Team Matching
  const studentDemos = [
    {
      email: 'maya.chen@campus.edu',
      firstName: 'Maya',
      lastName: 'Chen',
      roll: '21BCSE015',
      bio: 'Deep learning researcher specializing in PyTorch, CNNs, and plant pathology image classification.',
      lookingFor: 'Full-stack & DevOps engineers to productionize models',
      interests: ['Computer Vision', 'Agriculture AI', 'Autonomous Systems'],
      skills: [
        { name: 'Computer Vision', level: ProficiencyLevel.EXPERT },
        { name: 'Machine Learning', level: ProficiencyLevel.EXPERT },
        { name: 'Python', level: ProficiencyLevel.EXPERT },
        { name: 'Agritech / Domain Science', level: ProficiencyLevel.ADVANCED }
      ]
    },
    {
      email: 'rohan.patel@campus.edu',
      firstName: 'Rohan',
      lastName: 'Patel',
      roll: '21BCSE088',
      bio: 'Distributed systems & backend developer. Cloud architecture, Docker, and high-throughput microservices.',
      lookingFor: 'Frontend and ML partners',
      interests: ['Distributed Databases', 'Cloud Native', 'Go'],
      skills: [
        { name: 'FastAPI', level: ProficiencyLevel.EXPERT },
        { name: 'Docker', level: ProficiencyLevel.ADVANCED },
        { name: 'Node.js', level: ProficiencyLevel.ADVANCED },
        { name: 'PostgreSQL', level: ProficiencyLevel.ADVANCED }
      ]
    },
    {
      email: 'elena.rostova@campus.edu',
      firstName: 'Elena',
      lastName: 'Rostova',
      roll: '21BCSE092',
      bio: 'Product designer and UI engineer focused on accessible, high-converting interfaces and Tailwind design systems.',
      lookingFor: 'Hackathon team with strong technical execution',
      interests: ['Design Systems', 'Micro-interactions', 'Frontend'],
      skills: [
        { name: 'UI/UX Design', level: ProficiencyLevel.EXPERT },
        { name: 'Tailwind CSS', level: ProficiencyLevel.EXPERT },
        { name: 'Next.js', level: ProficiencyLevel.ADVANCED },
        { name: 'React', level: ProficiencyLevel.ADVANCED }
      ]
    },
    {
      email: 'kavya.subramanian@campus.edu',
      firstName: 'Kavya',
      lastName: 'Subramanian',
      roll: '21BAGR007',
      bio: 'Agricultural Biotechnology double major. Extensive fieldwork in fungal leaf blight and pest identification.',
      lookingFor: 'CS students to co-author crop intelligence tools',
      interests: ['Plant Pathology', 'Agritech', 'Sustainable Farming'],
      skills: [
        { name: 'Agritech / Domain Science', level: ProficiencyLevel.EXPERT },
        { name: 'Python', level: ProficiencyLevel.INTERMEDIATE },
        { name: 'Machine Learning', level: ProficiencyLevel.BEGINNER }
      ]
    },
    {
      email: 'david.kim@campus.edu',
      firstName: 'David',
      lastName: 'Kim',
      roll: '21BCSE031',
      bio: 'NLP engineer working on LLM fine-tuning, RAG-free instruction agents, and low-latency inference.',
      lookingFor: 'Mobile app engineers',
      interests: ['Large Language Models', 'Edge AI', 'Voice Interfaces'],
      skills: [
        { name: 'Natural Language Processing', level: ProficiencyLevel.EXPERT },
        { name: 'Python', level: ProficiencyLevel.EXPERT },
        { name: 'Machine Learning', level: ProficiencyLevel.ADVANCED }
      ]
    },
    {
      email: 'zainab.malik@campus.edu',
      firstName: 'Zainab',
      lastName: 'Malik',
      roll: '21BCSE064',
      bio: 'Systems programmer & OS security enthusiast. Linux kernel modules, memory allocators, and CTF competitions.',
      lookingFor: 'Security & backend collaborators',
      interests: ['Operating Systems', 'Kernel Security', 'Rust'],
      skills: [
        { name: 'Node.js', level: ProficiencyLevel.INTERMEDIATE },
        { name: 'Docker', level: ProficiencyLevel.ADVANCED },
        { name: 'Python', level: ProficiencyLevel.ADVANCED }
      ]
    }
  ];

  const allStudentProfiles = [alexProfile];

  for (const s of studentDemos) {
    const u = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        role: Role.STUDENT,
        firstName: s.firstName,
        lastName: s.lastName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.firstName}`,
        studentProfile: {
          create: {
            rollNumber: s.roll,
            semester: 5,
            department: s.roll.includes('AGR') ? 'Agricultural Sciences' : 'Computer Science & Engineering',
            gpa: 3.75,
            academicSummary: `${s.firstName} is an active student with strong foundational knowledge and extracurricular research.`
          }
        },
        notifPreference: {
          create: { emailEnabled: true, inAppEnabled: true }
        }
      },
      include: { studentProfile: true }
    });

    const sp = u.studentProfile!;
    allStudentProfiles.push(sp);

    await prisma.collaborationProfile.create({
      data: {
        studentId: sp.id,
        bio: s.bio,
        lookingFor: s.lookingFor,
        interests: s.interests,
        availabilityHoursWeekly: 12
      }
    });

    for (const sk of s.skills) {
      if (skillMap[sk.name]) {
        await prisma.studentSkill.create({
          data: {
            studentId: sp.id,
            skillId: skillMap[sk.name],
            proficiencyLevel: sk.level
          }
        });
      }
    }
  }

  // 6. Enroll all students in courses
  for (const sp of allStudentProfiles) {
    await prisma.enrollment.createMany({
      data: [
        { studentId: sp.id, courseId: dbmsCourse.id, classId: dbmsClass.id },
        { studentId: sp.id, courseId: osCourse.id, classId: osClass.id },
        { studentId: sp.id, courseId: cnCourse.id, classId: cnClass.id },
        { studentId: sp.id, courseId: mathCourse.id, classId: mathClass.id }
      ],
      skipDuplicates: true
    });
  }

  // 7. Seed Attendance Records (Realistic percentages)
  // Alex Rivera target: DBMS ~88%, OS ~80%, CN ~91%, Math ~74% (AT RISK!)
  const sampleDates = [
    new Date('2026-08-10'), new Date('2026-08-12'), new Date('2026-08-15'),
    new Date('2026-08-18'), new Date('2026-08-22'), new Date('2026-08-25'),
    new Date('2026-08-29'), new Date('2026-09-02'), new Date('2026-09-05'),
    new Date('2026-09-08')
  ];

  // DBMS (10 sessions, Alex attends 9 -> 90%)
  for (let i = 0; i < sampleDates.length; i++) {
    const att = await prisma.attendance.create({
      data: {
        courseId: dbmsCourse.id,
        classId: dbmsClass.id,
        date: sampleDates[i],
        teacherId: teacherProfile.id,
        topicCovered: `DBMS Lecture ${i + 1}: Indexing & B-Trees`
      }
    });
    for (const sp of allStudentProfiles) {
      const isAlex = sp.id === alexProfile.id;
      const status = (isAlex && i === 4) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      await prisma.attendanceRecord.create({
        data: { attendanceId: att.id, studentId: sp.id, status }
      });
    }
  }

  // OS (10 sessions, Alex attends 8 -> 80%)
  for (let i = 0; i < sampleDates.length; i++) {
    const att = await prisma.attendance.create({
      data: {
        courseId: osCourse.id,
        classId: osClass.id,
        date: sampleDates[i],
        teacherId: teacherProfile.id,
        topicCovered: `OS Lecture ${i + 1}: Deadlock Banker's Algorithm`
      }
    });
    for (const sp of allStudentProfiles) {
      const isAlex = sp.id === alexProfile.id;
      const status = (isAlex && (i === 2 || i === 7)) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      await prisma.attendanceRecord.create({
        data: { attendanceId: att.id, studentId: sp.id, status }
      });
    }
  }

  // CN (10 sessions, Alex attends 9 -> 90%)
  for (let i = 0; i < sampleDates.length; i++) {
    const att = await prisma.attendance.create({
      data: {
        courseId: cnCourse.id,
        classId: cnClass.id,
        date: sampleDates[i],
        teacherId: teacherProfile.id,
        topicCovered: `CN Lecture ${i + 1}: TCP Congestion Avoidance`
      }
    });
    for (const sp of allStudentProfiles) {
      const isAlex = sp.id === alexProfile.id;
      const status = (isAlex && i === 3) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      await prisma.attendanceRecord.create({
        data: { attendanceId: att.id, studentId: sp.id, status }
      });
    }
  }

  // Math (10 sessions, Alex attends only 7 -> 70% or 74% - CRITICAL AT RISK)
  for (let i = 0; i < sampleDates.length; i++) {
    const att = await prisma.attendance.create({
      data: {
        courseId: mathCourse.id,
        classId: mathClass.id,
        date: sampleDates[i],
        teacherId: teacherProfile.id,
        topicCovered: `Discrete Math ${i + 1}: Graph Colorability & Hamiltonian Paths`
      }
    });
    for (const sp of allStudentProfiles) {
      const isAlex = sp.id === alexProfile.id;
      const status = (isAlex && (i === 1 || i === 5 || i === 8)) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      await prisma.attendanceRecord.create({
        data: { attendanceId: att.id, studentId: sp.id, status }
      });
    }
  }

  // 8. Create Assignments
  const dbmsAssignment = await prisma.assignment.create({
    data: {
      courseId: dbmsCourse.id,
      title: 'Assignment 2: Schema Normalization & B+ Trees',
      description: 'Decompose the unnormalized hospital database into 3NF and BCNF. Verify lossless join and dependency preservation.',
      maxMarks: 100,
      dueDate: new Date(Date.now() + 3 * 86400000) // in 3 days
    }
  });

  const osAssignment = await prisma.assignment.create({
    data: {
      courseId: osCourse.id,
      title: 'Lab 3: Banker’s Algorithm for Deadlock Avoidance',
      description: 'Implement safety check and resource request algorithm in C/C++ or Python with multi-threaded processes.',
      maxMarks: 100,
      dueDate: new Date(Date.now() + 5 * 86400000) // in 5 days
    }
  });

  const cnAssignment = await prisma.assignment.create({
    data: {
      courseId: cnCourse.id,
      title: 'Packet Tracer Lab: OSPF & VLAN Routing',
      description: 'Configure multi-area OSPF routing and inter-VLAN trunking on Cisco Packet Tracer.',
      maxMarks: 100,
      dueDate: new Date(Date.now() + 8 * 86400000)
    }
  });

  // Seed Alex's submission for OS (already graded)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: osAssignment.id,
      studentId: alexProfile.id,
      marksObtained: 84,
      feedback: 'Good implementation of safety check. Make sure edge cases for unavailable matrices are handled.',
      status: AssignmentStatus.GRADED
    }
  });

  // 9. Create Exams & Results
  const dbmsMidterm = await prisma.exam.create({
    data: {
      courseId: dbmsCourse.id,
      title: 'DBMS Midterm Examination',
      examType: 'MIDTERM',
      date: new Date('2026-08-28'),
      maxMarks: 100,
      weightage: 25
    }
  });

  const osMidterm = await prisma.exam.create({
    data: {
      courseId: osCourse.id,
      title: 'OS Midterm Examination',
      examType: 'MIDTERM',
      date: new Date('2026-08-30'),
      maxMarks: 100,
      weightage: 25
    }
  });

  const cnMidterm = await prisma.exam.create({
    data: {
      courseId: cnCourse.id,
      title: 'CN Midterm Examination',
      examType: 'MIDTERM',
      date: new Date('2026-09-01'),
      maxMarks: 100,
      weightage: 25
    }
  });

  // Upcoming Exam!
  await prisma.exam.create({
    data: {
      courseId: dbmsCourse.id,
      title: 'DBMS Quiz & Lab Assessment #2',
      examType: 'QUIZ',
      date: new Date(Date.now() + 4 * 86400000), // in 4 days
      maxMarks: 30,
      weightage: 10
    }
  });

  // Alex's Exam Results
  await prisma.examResult.create({
    data: {
      examId: dbmsMidterm.id,
      studentId: alexProfile.id,
      marksObtained: 62,
      grade: 'C+',
      remarks: 'Strong SQL and ER models, but failed the normalization questions heavily.',
      strengths: ['SQL Queries', 'Entity Relationship Diagrams'],
      weaknesses: ['3NF & BCNF Decomposition', 'Functional Dependencies']
    }
  });

  await prisma.examResult.create({
    data: {
      examId: osMidterm.id,
      studentId: alexProfile.id,
      marksObtained: 71,
      grade: 'B-',
      remarks: 'Good process scheduling knowledge. Needs improvement on multi-process deadlock sync.',
      strengths: ['CPU Scheduling (Round Robin, Priority)', 'Virtual Memory Paging'],
      weaknesses: ['Deadlock Avoidance', 'Semaphores & Mutex Locks']
    }
  });

  await prisma.examResult.create({
    data: {
      examId: cnMidterm.id,
      studentId: alexProfile.id,
      marksObtained: 86,
      grade: 'A',
      remarks: 'Outstanding performance across IP addressing and OSI stack.',
      strengths: ['Subnetting', 'TCP 3-way Handshake', 'DNS Resolution'],
      weaknesses: ['BGP Routing']
    }
  });

  // 10. Timetable Entries
  const timetable = await prisma.timetable.create({
    data: { classId: dbmsClass.id, semester: 5, academicYear: '2026-2027' }
  });

  await prisma.timetableEntry.createMany({
    data: [
      { timetableId: timetable.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', courseId: dbmsCourse.id, room: 'Hall 301' },
      { timetableId: timetable.id, dayOfWeek: 'MONDAY', startTime: '10:15', endTime: '11:15', courseId: osCourse.id, room: 'Hall 301' },
      { timetableId: timetable.id, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:00', courseId: mathCourse.id, room: 'Science Block 102' },
      { timetableId: timetable.id, dayOfWeek: 'TUESDAY', startTime: '11:30', endTime: '13:00', courseId: dbmsCourse.id, room: 'Lab 4' },
      { timetableId: timetable.id, dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '11:00', courseId: cnCourse.id, room: 'Hall 205' },
      { timetableId: timetable.id, dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '15:30', courseId: osCourse.id, room: 'OS Lab 2' },
      { timetableId: timetable.id, dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '10:00', courseId: dbmsCourse.id, room: 'Hall 301' },
      { timetableId: timetable.id, dayOfWeek: 'THURSDAY', startTime: '11:00', endTime: '12:00', courseId: mathCourse.id, room: 'Science Block 102' },
      { timetableId: timetable.id, dayOfWeek: 'FRIDAY', startTime: '10:00', endTime: '11:00', courseId: cnCourse.id, room: 'Hall 205' }
    ]
  });

  // 11. Initial Tasks for Alex
  await prisma.task.createMany({
    data: [
      {
        studentId: alexProfile.id,
        title: 'Revise 3NF & BCNF Decomposition Rules',
        description: 'Practice decomposing tables with non-trivial functional dependencies.',
        category: TaskCategory.STUDY,
        priority: Priority.HIGH,
        estimatedMinutes: 45,
        dueDate: new Date(Date.now() + 86400000),
        source: TaskSource.AI_RECOMMENDED
      },
      {
        studentId: alexProfile.id,
        title: 'Complete DBMS Assignment #2 (Hospital Schema)',
        description: 'Finish normalization diagrams and write SQL constraints.',
        category: TaskCategory.ASSIGNMENT,
        priority: Priority.URGENT,
        estimatedMinutes: 60,
        dueDate: new Date(Date.now() + 2 * 86400000),
        source: TaskSource.DAILY_PLAN
      },
      {
        studentId: alexProfile.id,
        title: 'Practice 5 Discrete Math Recurrence Relations',
        description: 'Prepare before Thursday lecture to reverse low attendance deficits.',
        category: TaskCategory.STUDY,
        priority: Priority.MEDIUM,
        estimatedMinutes: 30,
        dueDate: new Date(Date.now() + 3 * 86400000),
        source: TaskSource.AI_ONE_HOUR
      }
    ]
  });

  // 12. Notifications for Alex
  await prisma.notification.createMany({
    data: [
      {
        userId: alexUser.id,
        title: '⚠️ Attendance Warning: Discrete Math at 70%',
        message: 'Your attendance in Discrete Math has dropped below the 75% required threshold. Attend the next 3 consecutive lectures to recover.',
        type: NotificationType.ATTENDANCE_ALERT,
        actionUrl: '/attendance'
      },
      {
        userId: alexUser.id,
        title: '🤖 AI Daily Academic Plan Generated',
        message: 'Your high-priority focus today: DBMS Normalization revision (45 min) and Hospital Schema assignment draft.',
        type: NotificationType.DAILY_PLAN,
        actionUrl: '/dashboard'
      },
      {
        userId: alexUser.id,
        title: '📌 Assignment Due in 3 Days',
        message: 'Database Management Systems Assignment #2 is due on Friday.',
        type: NotificationType.ACADEMIC,
        actionUrl: '/dashboard'
      }
    ]
  });

  // 13. Community Doubts & Answers
  const post1 = await prisma.communityPost.create({
    data: {
      authorId: alexUser.id,
      title: 'How does Strict 2-Phase Locking (Strict 2PL) guarantee cascadeless aborts?',
      content: 'I understand basic 2PL has growing and shrinking phases. But why does Strict 2PL require holding all exclusive locks until the end of the transaction (COMMIT or ABORT)? How does this eliminate cascading rollbacks?',
      category: 'Database Systems',
      tags: ['DBMS', 'Concurrency', '2PL', 'Transactions'],
      views: 48
    }
  });

  const mayaUser = await prisma.user.findUnique({ where: { email: 'maya.chen@campus.edu' } });
  if (mayaUser) {
    const ans1 = await prisma.communityAnswer.create({
      data: {
        postId: post1.id,
        authorId: mayaUser.id,
        content: 'In basic 2PL, if Transaction T1 writes to item X and releases its exclusive lock before committing, Transaction T2 can read X. If T1 later aborts, T2 has read dirty data and must also abort (cascading rollback). Strict 2PL holds X-locks until COMMIT/ABORT, ensuring no other transaction can read uncommitted dirty writes. Hence, no cascading aborts!',
        isAccepted: true
      }
    });

    await prisma.communityVote.create({
      data: {
        userId: alexUser.id,
        postId: post1.id,
        answerId: ans1.id,
        voteType: 'UP'
      }
    });
  }

  const post2 = await prisma.communityPost.create({
    data: {
      authorId: mayaUser ? mayaUser.id : alexUser.id,
      title: 'Deadlock detection vs Deadlock prevention: Which is preferred in real-world OS?',
      content: 'Deadlock prevention restricts resource requests beforehand (like Banker’s Algorithm), while detection runs Wait-For-Graph cycles periodically. In modern general-purpose kernels like Linux, which strategy is actually implemented?',
      category: 'Operating Systems',
      tags: ['OS', 'Deadlocks', 'BankersAlgorithm', 'LinuxKernel'],
      views: 32
    }
  });

  await prisma.communityAnswer.create({
    data: {
      postId: post2.id,
      authorId: alexUser.id,
      content: 'In practice, modern OS like Linux and Windows use the "Ostrich Algorithm" for most user-space deadlocks because deadlock prevention overhead is too high. However, inside kernel space, lock ordering hierarchies (like lockdep in Linux) and timeouts are enforced to prevent circular wait!',
      isAccepted: false
    }
  });

  // 14. Projects & Team Collaboration
  const project = await prisma.project.create({
    data: {
      title: 'AI Crop Disease Detection & Prevention Network',
      description: 'Mobile & edge-friendly computer vision pipeline detecting tomato and corn leaf fungal blights with treatment recommendation engine.',
      creatorId: alexProfile.id,
      status: ProjectStatus.ACTIVE,
      githubUrl: 'https://github.com/campus-projects/ai-crop-pathology'
    }
  });

  // Add Alex as Lead / Fullstack
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      studentId: alexProfile.id,
      role: ProjectRole.LEAD
    }
  });

  // Add Maya Chen as ML_AI
  const mayaProfile = allStudentProfiles.find(p => p.rollNumber === '21BCSE015');
  if (mayaProfile) {
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        studentId: mayaProfile.id,
        role: ProjectRole.ML_AI
      }
    });
  }

  // Milestones
  const m1 = await prisma.projectMilestone.create({
    data: {
      projectId: project.id,
      title: 'Milestone 1: PlantVillage Dataset Preprocessing & Augmentation',
      description: 'Clean, normalize, and label 10,000 leaf image samples across 12 disease classes.',
      order: 1,
      completed: true
    }
  });

  const m2 = await prisma.projectMilestone.create({
    data: {
      projectId: project.id,
      title: 'Milestone 2: MobileNetV3 Transfer Learning & Quantization',
      description: 'Train CNN model achieving >94% top-1 accuracy and export to ONNX format.',
      order: 2,
      completed: false
    }
  });

  const m3 = await prisma.projectMilestone.create({
    data: {
      projectId: project.id,
      title: 'Milestone 3: FastAPI Backend & Real-time Inference Service',
      description: 'Create authenticated REST endpoints for camera upload, image analysis, and treatment suggestions.',
      order: 3,
      completed: false
    }
  });

  // Tasks
  await prisma.projectTask.createMany({
    data: [
      {
        projectId: project.id,
        milestoneId: m1.id,
        title: 'Download and verify PlantVillage dataset split',
        description: 'Ensure 80/10/10 train-val-test split without data leakage.',
        status: ProjectTaskStatus.DONE,
        priority: Priority.HIGH,
        assignedToId: mayaProfile ? mayaProfile.id : alexProfile.id
      },
      {
        projectId: project.id,
        milestoneId: m2.id,
        title: 'Benchmark MobileNet vs EfficientNet inference latency',
        description: 'Profile FPS on mobile target device.',
        status: ProjectTaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        assignedToId: mayaProfile ? mayaProfile.id : alexProfile.id
      },
      {
        projectId: project.id,
        milestoneId: m3.id,
        title: 'Design API schemas for crop diagnosis and treatment',
        description: 'Write Pydantic models and Swagger documentation.',
        status: ProjectTaskStatus.TODO,
        priority: Priority.MEDIUM,
        assignedToId: alexProfile.id
      }
    ]
  });

  // 15. Announcements from Dr. Sharma
  await prisma.announcement.createMany({
    data: [
      {
        courseId: dbmsCourse.id,
        teacherId: teacherProfile.id,
        title: 'Midterm 2 Lab Assessment scheduled for next Tuesday',
        content: 'Please review relational schema decomposition, BCNF algorithms, and SQL subquery indexing. Lab machines will have PostgreSQL 16 ready.',
        priority: Priority.HIGH,
        targetAudience: 'COURSE'
      },
      {
        teacherId: teacherProfile.id,
        title: 'Department Hackathon Registrations Open',
        content: 'Teams of 3 to 4 students can register their prototypes before the 25th of this month. Interdisciplinary collaboration is highly recommended.',
        priority: Priority.MEDIUM,
        targetAudience: 'ALL'
      }
    ]
  });

  console.log('✅ Database seeded successfully!');
  console.log('🧑‍🎓 Demo Student: alex.rivera@campus.edu | password: password123');
  console.log('👨‍🏫 Demo Teacher: dr.sharma@campus.edu | password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
