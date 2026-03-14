const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');
const Event = require('./models/Event');
const StudyGroup = require('./models/StudyGroup');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/university-portal';
const DOMAIN = process.env.UNIVERSITY_EMAIL_DOMAIN || 'cs.lgu.edu.pk';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Club.deleteMany({});
    await Event.deleteMany({});
    await StudyGroup.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const adminUser = await User.create({
      name: 'Dr. Admin Smith',
      universityEmail: `admin@${DOMAIN}`,
      password: 'password123',
      studentId: 'ADMIN001',
      department: 'Administration',
      year: 1,
      role: 'admin',
    });

    const studentUser = await User.create({
      name: 'Alex Johnson',
      universityEmail: `alex.johnson@${DOMAIN}`,
      password: 'password123',
      studentId: 'STU2024001',
      department: 'Computer Science',
      year: 3,
      role: 'student',
    });

    console.log('👥 Created 2 users');

    // Create clubs
    const clubs = await Club.insertMany([
      {
        name: 'ACM Computer Science Club',
        description:
          'The Association for Computing Machinery student chapter brings together students passionate about computing, software development, and technology. We host hackathons, coding competitions, and tech talks with industry professionals.',
        category: 'Technical',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        presidentName: 'Sarah Chen',
        presidentEmail: `s.chen@${DOMAIN}`,
        members: [studentUser._id],
        tags: ['programming', 'algorithms', 'hackathons'],
      },
      {
        name: 'University Football Club',
        description:
          'Our football club competes in the intercollegiate league and welcomes players of all skill levels. We train three times a week and participate in national university competitions.',
        category: 'Sports',
        coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
        presidentName: 'Marcus Williams',
        presidentEmail: `m.williams@${DOMAIN}`,
        members: [],
        tags: ['football', 'sports', 'competition'],
      },
      {
        name: 'Fine Arts & Photography Society',
        description:
          'A creative hub for artists, photographers, and designers. We organize exhibitions, photography walks, life drawing sessions, and collaborative art projects throughout the year.',
        category: 'Arts',
        coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
        presidentName: 'Priya Patel',
        presidentEmail: `p.patel@${DOMAIN}`,
        members: [],
        tags: ['art', 'photography', 'design'],
      },
      {
        name: 'International Cultural Exchange',
        description:
          'Celebrating diversity through cultural exchange programs, international food festivals, language exchange meetups, and cultural nights that showcase traditions from around the world.',
        category: 'Cultural',
        coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
        presidentName: 'Yuki Tanaka',
        presidentEmail: `y.tanaka@${DOMAIN}`,
        members: [],
        tags: ['culture', 'diversity', 'international'],
      },
      {
        name: 'Debate & Model UN Society',
        description:
          'Develop critical thinking, public speaking, and argumentation skills through competitive debating and Model United Nations simulations. We compete at regional and national championships.',
        category: 'Academic',
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        presidentName: 'James Harrison',
        presidentEmail: `j.harrison@${DOMAIN}`,
        members: [],
        tags: ['debate', 'UN', 'public speaking'],
      },
    ]);

    console.log('🏛️  Created 5 clubs');

    // Update student's joined clubs
    await User.findByIdAndUpdate(studentUser._id, { joinedClubs: [clubs[0]._id] });

    // Create events
    const now = new Date();
    const futureDate = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const events = await Event.insertMany([
      {
        title: 'Annual Hackathon 2025',
        description:
          'A 24-hour coding marathon where teams of 2-4 students build innovative solutions to real-world problems. Prizes worth $5,000 and internship opportunities with our sponsor companies.',
        organizer: clubs[0]._id,
        organizerName: 'ACM Computer Science Club',
        eventType: 'Competition',
        date: futureDate(15),
        time: '09:00 AM',
        venue: 'Engineering Building, Hall A',
        coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
        registeredStudents: [studentUser._id],
        maxCapacity: 100,
        isRegistrationOpen: true,
      },
      {
        title: 'AI & Machine Learning Workshop',
        description:
          'Hands-on workshop covering the fundamentals of machine learning using Python and TensorFlow. Participants will build their own image classification model. Laptops required.',
        organizer: clubs[0]._id,
        organizerName: 'ACM Computer Science Club',
        eventType: 'Workshop',
        date: futureDate(8),
        time: '02:00 PM',
        venue: 'Computer Lab 201',
        coverImage: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800',
        registeredStudents: [],
        maxCapacity: 30,
        isRegistrationOpen: true,
      },
      {
        title: 'Interfaculty Football Championship',
        description:
          'The annual football championship featuring teams from all departments. Come cheer for your faculty team in the most anticipated sporting event of the semester!',
        organizer: clubs[1]._id,
        organizerName: 'University Football Club',
        eventType: 'Sports',
        date: futureDate(20),
        time: '10:00 AM',
        venue: 'University Sports Ground',
        coverImage: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
        registeredStudents: [],
        maxCapacity: 200,
        isRegistrationOpen: true,
      },
      {
        title: 'International Night 2025',
        description:
          'A spectacular evening celebrating the diversity of our university community. Enjoy performances, food stalls, art exhibitions, and cultural showcases from over 30 countries.',
        organizer: clubs[3]._id,
        organizerName: 'International Cultural Exchange',
        eventType: 'Cultural',
        date: futureDate(30),
        time: '06:00 PM',
        venue: 'University Main Hall',
        coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
        registeredStudents: [],
        maxCapacity: 500,
        isRegistrationOpen: true,
      },
      {
        title: 'Research Methods Seminar',
        description:
          'A comprehensive seminar on advanced research methodologies for undergraduate and postgraduate students. Topics include qualitative and quantitative research design, data analysis, and academic writing.',
        organizer: clubs[4]._id,
        organizerName: 'Debate & Model UN Society',
        eventType: 'Seminar',
        date: futureDate(5),
        time: '11:00 AM',
        venue: 'Lecture Hall B',
        coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
        registeredStudents: [],
        maxCapacity: 80,
        isRegistrationOpen: true,
      },
      {
        title: 'End of Semester Social Mixer',
        description:
          'Celebrate the end of semester with your fellow students! Music, food, games, and a chance to relax after exams. All students and faculty welcome.',
        organizer: clubs[3]._id,
        organizerName: 'International Cultural Exchange',
        eventType: 'Social',
        date: futureDate(45),
        time: '04:00 PM',
        venue: 'Student Union Building',
        coverImage: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800',
        registeredStudents: [],
        maxCapacity: 300,
        isRegistrationOpen: true,
      },
    ]);

    console.log('📅 Created 6 events');

    // Update student's registered events
    await User.findByIdAndUpdate(studentUser._id, { registeredEvents: [events[0]._id] });

    // Create study groups
    const studyGroups = await StudyGroup.insertMany([
      {
        name: 'Data Structures Study Crew',
        subject: 'Data Structures & Algorithms',
        description: 'Weekly sessions covering DSA topics, LeetCode problems, and exam preparation. Friendly group for serious learners!',
        course: 'CS301',
        department: 'Computer Science',
        semester: 'Spring',
        creator: studentUser._id,
        members: [studentUser._id],
        maxMembers: 8,
        meetingSchedule: {
          day: 'Wednesday',
          time: '5:00 PM',
          location: 'Library Room 3',
        },
        isOnline: false,
        groupType: 'Open',
      },
      {
        name: 'Calculus II Online Group',
        subject: 'Calculus II',
        description: 'Online study group for Calculus II. We meet on Zoom three times a week to work through problem sets and prepare for quizzes.',
        course: 'MATH202',
        department: 'Mathematics',
        semester: 'Spring',
        creator: adminUser._id,
        members: [adminUser._id, studentUser._id],
        maxMembers: 10,
        meetingSchedule: {
          day: 'Monday',
          time: '7:00 PM',
          location: 'https://zoom.us/j/example',
        },
        isOnline: true,
        groupType: 'Open',
      },
      {
        name: 'Organic Chemistry Lab Prep',
        subject: 'Organic Chemistry',
        description: 'Preparing for lab practicals and theory exams. We share notes, discuss mechanisms, and quiz each other.',
        course: 'CHEM301',
        department: 'Chemistry',
        semester: 'Spring',
        creator: adminUser._id,
        members: [adminUser._id],
        maxMembers: 6,
        meetingSchedule: {
          day: 'Thursday',
          time: '3:00 PM',
          location: 'Science Building, Room 105',
        },
        isOnline: false,
        groupType: 'Open',
      },
      {
        name: 'Business Strategy Case Studies',
        subject: 'Strategic Management',
        description: 'Invite-only group for MBA students analyzing business case studies. Strong analytical skills required.',
        course: 'MBA501',
        department: 'Business',
        semester: 'Spring',
        creator: adminUser._id,
        members: [adminUser._id],
        maxMembers: 5,
        meetingSchedule: {
          day: 'Friday',
          time: '2:00 PM',
          location: 'Business School, Seminar Room 2',
        },
        isOnline: false,
        groupType: 'Invite-Only',
      },
    ]);

    console.log('📚 Created 4 study groups');

    // Update student's joined groups
    await User.findByIdAndUpdate(studentUser._id, {
      joinedStudyGroups: [studyGroups[0]._id, studyGroups[1]._id],
    });

    console.log('\n✨ Seed completed successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('  SAMPLE LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log(`  👨‍💼 Admin:   admin@${DOMAIN}`);
    console.log(`  👨‍🎓 Student: alex.johnson@${DOMAIN}`);
    console.log('  🔑 Password: password123 (both)');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();