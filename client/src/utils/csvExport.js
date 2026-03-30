// client/src/utils/csvExport.js

/**
 * Convert an array of objects to a CSV string and trigger a download.
 * @param {Object[]} data       - Array of flat objects
 * @param {string[]} columns    - Keys to include (in order)
 * @param {Object}  headers     - { key: 'Display Header' } map
 * @param {string}  filename    - e.g. 'students.csv'
 */
export function exportToCSV(data, columns, headers, filename = 'export.csv') {
  if (!data || !data.length) return;

  // Build header row
  const headerRow = columns.map(col => `"${headers[col] || col}"`).join(',');

  // Build data rows
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""'); // escape double quotes
      return `"${str}"`;
    }).join(',')
  );

  const csv = [headerRow, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

// ── Pre-built export helpers ────────────────────────────────

export function exportUsers(users) {
  const columns = ['name', 'universityEmail', 'studentId', 'department', 'year', 'role', 'joinedClubs', 'registeredEvents', 'joinedStudyGroups', 'createdAt'];
  const headers = {
    name: 'Full Name',
    universityEmail: 'University Email',
    studentId: 'Student ID',
    department: 'Department',
    year: 'Year',
    role: 'Role',
    joinedClubs: 'Clubs Joined',
    registeredEvents: 'Events Registered',
    joinedStudyGroups: 'Study Groups',
    createdAt: 'Joined Date',
  };
  const flat = users.map(u => ({
    ...u,
    joinedClubs: u.joinedClubs?.length ?? 0,
    registeredEvents: u.registeredEvents?.length ?? 0,
    joinedStudyGroups: u.joinedStudyGroups?.length ?? 0,
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : '',
  }));
  exportToCSV(flat, columns, headers, `lgu_users_${today()}.csv`);
}

export function exportEventRegistrations(registrations, eventTitle) {
  const columns = ['name', 'universityEmail', 'studentId', 'department', 'year'];
  const headers = {
    name: 'Full Name',
    universityEmail: 'University Email',
    studentId: 'Student ID',
    department: 'Department',
    year: 'Academic Year',
  };
  const flat = registrations.map(s => ({ ...s, year: s.year ? `Year ${s.year}` : '' }));
  const safeName = (eventTitle || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  exportToCSV(flat, columns, headers, `${safeName}_registrations_${today()}.csv`);
}

export function exportStudyGroups(groups) {
  const columns = ['name', 'subject', 'department', 'semester', 'groupType', 'isOnline', 'memberCount', 'maxMembers', 'creatorName', 'createdAt'];
  const headers = {
    name: 'Group Name',
    subject: 'Subject',
    department: 'Department',
    semester: 'Semester',
    groupType: 'Type',
    isOnline: 'Mode',
    memberCount: 'Members',
    maxMembers: 'Max Members',
    creatorName: 'Created By',
    createdAt: 'Created Date',
  };
  const flat = groups.map(g => ({
    ...g,
    isOnline: g.isOnline ? 'Online' : 'Offline',
    memberCount: g.members?.length ?? 0,
    creatorName: g.creator?.name || '',
    createdAt: g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-US') : '',
  }));
  exportToCSV(flat, columns, headers, `lgu_study_groups_${today()}.csv`);
}

export function exportClubMembers(members, clubName) {
  const columns = ['name', 'universityEmail', 'studentId', 'department', 'year'];
  const headers = {
    name: 'Full Name',
    universityEmail: 'University Email',
    studentId: 'Student ID',
    department: 'Department',
    year: 'Academic Year',
  };
  const flat = members.map(m => ({ ...m, year: m.year ? `Year ${m.year}` : '' }));
  const safeName = (clubName || 'club').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  exportToCSV(flat, columns, headers, `${safeName}_members_${today()}.csv`);
}

function today() {
  return new Date().toISOString().split('T')[0];
}