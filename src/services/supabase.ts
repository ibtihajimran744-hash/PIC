import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────

export interface Student {
  id: number;
  full_name: string;
  roll_no: number;
  class_section: string;
  father_name?: string;
  parent_name?: string;
  parent_phone?: string;
  status?: string;
  paid_amount: number;
  total_package: number;
  username?: string;
  password?: string;
  created_at?: string;
}

export interface Teacher {
  id: number;
  full_name: string;
  designation: string;
  subject_dept: string;
  phone: string;
  email: string;
  username?: string;
  password?: string;
  assigned_classes?: string;
  created_at?: string;
}

export interface Chapter {
  id: number;
  teacher_id: number;
  title: string;
  subject: string;
  created_at?: string;
}

export interface Grade {
  id: number;
  student_id?: number;
  student_roll: number | string;
  chapter_id?: number;
  chapter_name: string;
  subject: string;
  score: number;
  total_marks: number;
  exam_id?: string | number;
  created_at?: string;
}

export interface Course {
  id: number;
  name: string;
  instructor: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  color: string;
  description: string;
  syllabus: string[];
}

export interface AdminUser {
  id: number;
  full_name: string;
  username: string;
  password?: string;
  role: 'Director' | 'VP' | 'Principal' | 'Accountant' | 'Coordinator' | 'Receptionist' | 'Admission Officer';
  department?: string;
  created_at?: string;
  buzz_active?: boolean;
}

export interface AdmissionLead {
  id: number;
  full_name: string;
  phone: string;
  father_name: string;
  city: string;
  previous_school: string;
  program_interested: string;
  budget_concern: string;
  notes: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  ai_score?: number;
  ai_reason?: string;
  date: string;
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  receiver_role: string;
  receiver_id?: number;
  message_content: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  target_role?: string;
  target_user_id?: number;
  type: string;
  created_at: string;
}

export interface PrivateMessage {
  id: number;
  sender_id: number;
  sender_role: string;
  receiver_id: number;
  receiver_role: string;
  message: string;
  created_at: string;
}

export interface FeeRecord {
  id: number;
  student_roll_link: number;
  student_roll?: string;
  student_name?: string;
  class_section?: string;
  fee_group?: string;
  fee_type?: string;
  amount?: number;
  total_amount: number;
  tuition_fee: number;
  registration_fee: number;
  extracurricular_fee: number;
  paid_amount: number;
  last_payment_date?: string;
  date?: string;
  status: 'Paid' | 'Pending' | 'Unpaid';
  created_at?: string;
}

export interface FeeTransaction {
  id: string;
  student_roll_link: number;
  amount_paid: number;
  payment_method: string;
  payment_id: string;
  collected_by: string;
  payment_date: string;
  transaction_type: 'Payment' | 'Waiver/Discount' | 'Penalty/Fine' | 'Correction';
  notes?: string;
}

export interface Staff {
  id: number;
  full_name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  status: string;
  created_at?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  student_roll?: number;
  status: 'Present' | 'Absent' | 'Late';
  date: string;
  time_in?: string;
  marked_by?: number;
  created_at?: string;
}

export interface Homework {
  id: number;
  teacher_id: number;
  class_section: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  created_at?: string;
}

export interface HomeworkSubmission {
  id: number;
  homework_id: number;
  student_id: number;
  submission_url?: string;
  content?: string;
  grade?: string;
  feedback?: string;
  submitted_at: string;
}

export interface Exam {
  id: string | number;
  teacher_id?: number;
  class_section: string;
  subject: string;
  exam_type?: string;
  chapter_name?: string;
  title: string;
  total_marks: number;
  exam_date?: string;
  date: string;
  grading_status?: 'Pending' | 'In Progress' | 'Completed';
  status?: 'Pending' | 'In Progress' | 'Completed';
  graded_at?: string;
  created_at?: string;
}

// ─── FIXED: Matches actual `timetable` table schema ───
export interface Timetable {
  id: string;             // uuid
  class_section: string;
  subject: string;
  teacher_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  campus?: string;
  week_start?: string;
}

// ─── NEW: Teacher schedule view row ───
export interface TeacherScheduleEntry {
  timetable_id: string;
  teacher_id: number;
  teacher_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  class_section: string;
  room?: string;
  campus?: string;
  week_start?: string;
  total_students: number;
}

export interface XPLog {
  id: number;
  student_id: number;
  action_type: string;
  xp_gained: number;
  created_at: string;
}

export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  isbn: string;
  status: 'Available' | 'Issued';
}

export interface LibraryIssue {
  id: number;
  book_id: number;
  student_id: number;
  issue_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
}

export interface TransportRoute {
  id: number;
  route_name: string;
  driver_name: string;
  driver_phone: string;
  vehicle_no: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
  name?: string;
  slip_no?: string;
  expense_date?: string;
  recorded_by?: string;
}

export interface Income {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
  name?: string;
  slip_no?: string;
  income_date?: string;
  recorded_by?: string;
}

export interface Payroll {
  id: number;
  teacher_id: number;
  month: string;
  base_salary: number;
  deductions: number;
  net_salary: number;
  status: 'Paid' | 'Pending';
}

export interface LibraryChapter {
  id: number;
  class: string;
  subject: string;
  chapter_number: number;
  title: string;
}

// ─── NEW: Academic Session ───
export interface AcademicSession {
  id: string;
  name: string; // e.g., "2026-27"
  is_active: boolean;
  created_at?: string;
}

// ─── NEW: Academic Program ───
export interface AcademicProgram {
  id: string;
  name: string; // e.g., "ICS Physics"
  session_id: string;
  created_at?: string;
}

// ─── NEW: Academic Subject ───
export interface AcademicSubject {
  id: string;
  name: string;
  program_id: string;
  teacher_id?: number;
  created_at?: string;
}

// ─── NEW: Academic Resource ───
export interface AcademicResource {
  id: string;
  subject_id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at?: string;
}

// ─── NEW: Scheme of Study / Topic Plan ───
export interface SchemeOfStudy {
  id: string;
  subject_id: string;
  topic: string;
  description?: string;
  week_no: number;
  day: string;
  scheduled_date: string;
  status: 'planned' | 'completed' | 'in_progress';
  completed_at?: string;
  created_at?: string;
}

// ─── NEW: Academic Quiz ───
export interface AcademicQuiz {
  id: string;
  topic_id: string;
  questions: any[]; // JSON array of 5 MCQs
  created_at?: string;
}

// ─── NEW: Quiz Result ───
export interface QuizResult {
  id: string;
  quiz_id: string;
  student_roll: number;
  score: number;
  total: number;
  created_at?: string;
}

// ─────────────────────────────────────────────
// BASIC CRUD
// ─────────────────────────────────────────────

export async function getStaff() {
  const { data, error } = await supabase.from('staff').select('*');
  if (error) { console.error('Error fetching staff:', error); return []; }
  return data as Staff[];
}

export async function getStudents() {
  const { data, error } = await supabase.from('students').select('*');
  if (error) { console.error('Error fetching students:', error); return []; }
  return data as Student[];
}

export async function getStudentsBySections(sections: string[]) {
  if (sections.length === 0) return [];
  const orFilter = sections.map(section => `class_section.ilike.%${section.trim()}%`).join(',');
  const { data, error } = await supabase.from('students').select('*').or(orFilter);
  if (error) { console.error('Error fetching students by sections:', error); return []; }
  return data as Student[];
}

export async function getTeachers() {
  const { data, error } = await supabase.from('teachers').select('*');
  if (error) { console.error('Error fetching teachers:', error); return []; }
  return data as Teacher[];
}

export async function updateTeacher(id: number, updates: Partial<Teacher>) {
  const { data, error } = await supabase.from('teachers').update(updates).eq('id', id);
  if (error) { console.error('Error updating teacher:', error); throw error; }
  return data;
}

export async function loginTeacher(username: string, password: string): Promise<Teacher | null> {
  const { data, error } = await supabase
    .from('teachers').select('*')
    .eq('username', username).eq('password', password).single();
  if (error || !data) { console.error('Login failed:', error); return null; }
  return data as Teacher;
}

export async function getAdminUsers() {
  const { data, error } = await supabase.from('admin_users').select('*');
  if (error) { console.error('Error fetching admin users:', error); return []; }
  return data as AdminUser[];
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users').select('*')
    .eq('username', username).eq('password', password).single();
  if (error || !data) { console.error('Admin login failed:', error); return null; }
  return data as AdminUser;
}

export async function loginStudent(username: string, password: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students').select('*')
    .eq('username', username).eq('password', password).single();
  if (error || !data) { console.error('Student login failed:', error); return null; }
  return data as Student;
}

export async function updateStudent(id: number, updates: Partial<Student>) {
  const { data, error } = await supabase.from('students').update(updates).eq('id', id);
  if (error) { console.error('Error updating student:', error); throw error; }
  return data;
}

export async function triggerBuzz(userId: number | string) {
  const { error } = await supabase.from('notifications').insert([{
    target_user_id: userId,
    title: 'BUZZ!',
    message: 'You have been buzzed!',
    type: 'alert'
  }]);
  if (error) { console.error('Error triggering buzz:', error); throw error; }
}

export async function initializeStudentCredentials() {
  const students = await getStudents();
  const updates = students.map(student => {
    if (!student.username) {
      const username = `stu_${student.roll_no}`;
      const password = `PIC${student.roll_no}`;
      return updateStudent(student.id, { username, password });
    }
    return Promise.resolve();
  });
  await Promise.all(updates);
}

export async function initializeTeacherCredentials() {
  const teachers = await getTeachers();
  const updates = teachers.map(teacher => {
    if (!teacher.username) {
      const firstName = teacher.full_name.split(' ')[0].toLowerCase();
      const username = `${firstName}${teacher.id}`;
      const password = `${firstName}123`;
      return updateTeacher(teacher.id, { username, password });
    }
    return Promise.resolve();
  });
  await Promise.all(updates);
}

// ─────────────────────────────────────────────
// CHAPTERS & GRADES
// ─────────────────────────────────────────────

export async function getChapters(teacherId: number) {
  const { data, error } = await supabase.from('chapters').select('*').eq('teacher_id', teacherId);
  if (error) { console.error('Error fetching chapters:', error); return []; }
  return data as Chapter[];
}

export async function addChapter(chapter: Omit<Chapter, 'id'>) {
  const { data, error } = await supabase.from('chapters').insert([chapter]).select().single();
  if (error) { console.error('Error adding chapter:', error); throw error; }
  return data as Chapter;
}

export async function getGradesByChapter(chapterName: string, subject: string) {
  const { data, error } = await supabase
    .from('grades').select('*')
    .eq('chapter_name', chapterName).eq('subject', subject);
  if (error) { console.error('Error fetching grades:', error); return []; }
  return data as Grade[];
}

export async function addGrades(grades: Omit<Grade, 'id'>[]) {
  const { data, error } = await supabase.from('grades').insert(grades).select();
  if (error) { console.error('Error adding grades:', error); throw error; }
  return data;
}

export async function getGradesByRollNo(rollNo: string | number) {
  const { data, error } = await supabase
    .from('grades').select('*')
    .eq('student_roll', Number(rollNo))
    .order('created_at', { ascending: true });
  if (error) { console.error('Error fetching grades:', error); return []; }
  return data as Grade[];
}

// ─────────────────────────────────────────────
// CHAT & NOTIFICATIONS
// ─────────────────────────────────────────────

export async function getGlobalChat() {
  const { data, error } = await supabase
    .from('global_chat').select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('Error fetching chat:', error); return []; }
  return data as ChatMessage[];
}

export async function sendGlobalChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('global_chat').insert([message]).select();
  if (error) { console.error('Error sending message:', error); throw error; }
  return (data ? data[0] : null) as ChatMessage;
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('notifications').insert([notification]).select().single();
  if (error) { console.error('Error creating notification:', error); throw error; }
  return data as Notification;
}

export async function sendNotification(userId: number, title: string, body: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ target_user_id: userId, title, message: body, type: 'alert' }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function sendGlobalNotification(title: string, message: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ title, message, type: 'global' }])
    .select().single();
  if (error) { console.error('Error sending global notification:', error); throw error; }
  return data;
}

export async function getNotifications(userId?: number, role?: string) {
  // Build OR filter: match by target_user_id OR by target_role
  const filters: string[] = [];
  if (userId) filters.push(`target_user_id.eq.${userId}`);
  if (role)   filters.push(`target_role.eq.${role.toUpperCase()}`);
  filters.push('target_role.eq.ALL');

  const { data, error } = await supabase
    .from('notifications').select('*')
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { console.error('Error fetching notifications:', error); return []; }
  return data as Notification[];
}

export async function getPrivateMessages(userId: number | string, role: string) {
  const { data, error } = await supabase
    .from('private_messages').select('*')
    .or(`and(sender_id.eq.${userId},sender_role.eq.${role}),and(receiver_id.eq.${userId},receiver_role.eq.${role})`)
    .order('created_at', { ascending: true });
  if (error) { console.error('Error fetching private messages:', error); return []; }
  return data as PrivateMessage[];
}

export async function sendPrivateMessage(message: Omit<PrivateMessage, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('private_messages').insert([message]).select().single();
  if (error) { console.error('Error sending private message:', error); throw error; }
  return data as PrivateMessage;
}

export async function sendAdminNotification(title: string, message: string, target: 'All' | 'Teachers' | 'Parents') {
  const { data, error } = await supabase
    .from('admin_notifications')
    .insert([{ title, message, target, type: 'broadcast' }])
    .select().single();
  if (error) { console.error('Error sending admin notification:', error); throw error; }
  return data;
}

export async function sendMessage(
  senderId: number,
  receiverId: number,
  message: string,
  senderRole: string,
  receiverRole: string
) {
  const { data, error } = await supabase
    .from('private_messages')
    .insert([{ sender_id: senderId, receiver_id: receiverId, message, sender_role: senderRole, receiver_role: receiverRole }])
    .select().single();
  if (error) throw error;
  await sendNotification(receiverId, 'New Message', `You have a new message from ${senderRole}`);
  return data;
}

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────

export async function markAttendance(studentId: number) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString();

  const hour = now.getHours();
  const minute = now.getMinutes();
  const status: 'Present' | 'Late' = (hour > 8 || (hour === 8 && minute > 30)) ? 'Late' : 'Present';

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('full_name, parent_phone, parent_name, roll_no')
    .eq('roll_no', studentId)
    .single();

  if (studentError || !student) {
    console.error('Could not fetch student:', studentError);
    throw studentError;
  }

  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert([{ student_roll: student.roll_no, status, date, time_in: time }]);

  if (attendanceError) throw attendanceError;

  if (student.parent_phone) {
    const notifTitle = status === 'Late'
      ? `⚠️ Late Arrival — ${student.full_name}`
      : `✅ Present — ${student.full_name}`;
    const notifMessage = status === 'Late'
      ? `${student.full_name} arrived late at ${time}. Please ensure punctuality.`
      : `${student.full_name} has been marked Present today at ${time}.`;
    await supabase.from('notifications').insert([{
      target_user_id: student.roll_no,
      title: notifTitle,
      message: notifMessage,
      type: status === 'Late' ? 'late_alert' : 'attendance',
      target_role: 'PARENT'
    }]);
  }

  if (status === 'Present') {
    await supabase.from('xp_logs').insert([{
      student_roll: student.roll_no,
      action_type: 'attendance',
      xp_gained: 10,
    }]).then(() => {}, console.error);
  }

  return status;
}

export async function markAttendanceByTeacher(
  student: Student,
  status: 'Present' | 'Absent' | 'Late',
  teacherId: number
) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let finalStatus = status;
  if (status === 'Absent') {
    const { data: biometricScan } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('student_roll', student.roll_no)
      .eq('date', date)
      .maybeSingle();
    if (biometricScan) finalStatus = 'Late';
  }

  const { error } = await supabase.from('attendance').insert([{
    student_roll: student.roll_no,
    status: finalStatus,
    date,
    time_in: time,
    marked_by: teacherId
  }]);

  if (error) throw error;

  if (finalStatus === 'Absent') {
    await supabase.from('notifications').insert([{
      target_user_id: student.roll_no,
      title: `❌ Absent Today — ${student.full_name}`,
      message: `${student.full_name} was marked Absent on ${date}.`,
      type: 'absence_alert',
      target_role: 'PARENT'
    }]).then(() => {}, console.error);
    await supabase.from('notifications').insert([{
      title: `❌ Student Absent — ${student.full_name}`,
      message: `${student.full_name} (Roll: ${student.roll_no}, ${student.class_section}) is absent today.`,
      type: 'absence_alert',
      target_role: 'COORDINATOR'
    }]).then(() => {}, console.error);
  } else if (finalStatus === 'Late') {
    await supabase.from('notifications').insert([{
      title: `⚠️ Late Arrival — ${student.full_name}`,
      message: `${student.full_name} (Roll: ${student.roll_no}, ${student.class_section}) arrived late.`,
      type: 'late_alert',
      target_role: 'COORDINATOR'
    }]).then(() => {}, console.error);
  } else if (finalStatus === 'Present') {
    await supabase.from('xp_logs').insert([{
      student_roll: student.roll_no,
      action_type: 'attendance',
      xp_gained: 10,
    }]).then(() => {}, console.error);
  }
}

export async function getLiveAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const { data: students } = await supabase.from('students').select('id');
  const { data: attendance } = await supabase.from('attendance').select('*').eq('date', today);

  const total = students?.length || 0;
  const present = attendance?.filter(a => a.status === 'Present').length || 0;
  const late = attendance?.filter(a => a.status === 'Late').length || 0;
  const absent = total - (present + late);

  return {
    total_students: total,
    present_students: present,
    absent_students: absent,
    late_students: late,
    recent_entries: attendance?.slice(-5).reverse() || []
  };
}

// ─────────────────────────────────────────────
// TIMETABLE — FIXED (uses correct table name)
// ─────────────────────────────────────────────

/**
 * Get a teacher's full schedule for the current week from teacher_schedule_view.
 * Returns all days Mon–Sat sorted by day then time.
 */
export async function getTeacherSchedule(teacherId: number): Promise<TeacherScheduleEntry[]> {
  const { data, error } = await supabase
    .from('teacher_schedule_view')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('start_time', { ascending: true });

  if (error) { console.error('Error fetching teacher schedule:', error); return []; }
  return (data || []) as TeacherScheduleEntry[];
}

/**
 * Get today's schedule for a specific teacher.
 */
export async function getTeacherTodaySchedule(teacherId: number, teacherName?: string): Promise<TeacherScheduleEntry[]> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
  
  // 1. Try the view first
  const { data: viewData, error: viewError } = await supabase
    .from('teacher_schedule_view')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('day_of_week', today)
    .order('start_time', { ascending: true });

  if (viewData && viewData.length > 0) return viewData as TeacherScheduleEntry[];

  // 2. Fallback to direct timetable query (very important if view is stale/missing)
  let query = supabase
    .from('timetable')
    .select('*')
    .eq('day_of_week', today);
    
  if (teacherId) {
    if (teacherName) {
      query = query.or(`teacher_id.eq.${teacherId},teacher_name.ilike.%${teacherName}%`);
    } else {
      query = query.eq('teacher_id', teacherId);
    }
  }

  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) { console.error('Error fetching today schedule:', error); return []; }
  
  // Map Timetable to TeacherScheduleEntry
  return (data || []).map(t => ({
    timetable_id: t.id,
    teacher_id: t.teacher_id,
    teacher_name: teacherName || '',
    day_of_week: t.day_of_week,
    start_time: t.start_time,
    end_time: t.end_time || '',
    subject: t.subject || '',
    class_section: t.class_section || '',
    room: t.room || '',
    campus: t.campus || '',
    total_students: 0
  }));
}

/**
 * Get a student's schedule from timetable by their class_section for a given day.
 * FIXED: queries `timetable` (not `timetables`).
 */
export async function getStudentTodaySchedule(classSection: string): Promise<Timetable[]> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const { data, error } = await supabase
    .from('timetable')
    .select('*')
    .eq('class_section', classSection)
    .eq('day_of_week', today)
    .order('start_time', { ascending: true });

  if (error) { console.error('Error fetching student schedule:', error); return []; }
  return (data || []) as Timetable[];
}

/**
 * Get student's full weekly schedule from timetable.
 * FIXED: queries `timetable` (not `timetables`).
 */
export async function getStudentWeeklySchedule(classSection: string): Promise<Timetable[]> {
  const { data, error } = await supabase
    .from('timetable')
    .select('*')
    .eq('class_section', classSection)
    .order('start_time', { ascending: true });

  if (error) { console.error('Error fetching student weekly schedule:', error); return []; }
  return (data || []) as Timetable[];
}

/**
 * Get real weekly attendance trend for a teacher's students.
 * Returns Mon–Sat present counts for chart display.
 */
export async function getTeacherAttendanceTrend(classSections: string[]): Promise<{ name: string; present: number }[]> {
  if (classSections.length === 0) return [];

  // Get current week's Monday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const results: { name: string; present: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const { data } = await supabase
      .from('attendance')
      .select('student_roll, status')
      .eq('date', dateStr)
      .eq('status', 'Present');

    results.push({ name: days[i], present: data?.length || 0 });
  }

  return results;
}

// ─────────────────────────────────────────────
// STUDENT DASHBOARD — FIXED
// ─────────────────────────────────────────────

export async function getStudentDashboard(studentRoll: number) {
  const today = new Date().toISOString().split('T')[0];
  const todayFull = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const [profileRes, attendanceRes, xpRes, notifsRes] = await Promise.all([
    supabase.from('students').select('*').eq('roll_no', studentRoll).single(),
    supabase.from('attendance').select('*').eq('student_roll', studentRoll).eq('date', today).maybeSingle(),
    supabase.from('xp_logs').select('xp_gained').eq('student_roll', studentRoll),
    getNotifications(studentRoll, 'STUDENT'),
  ]);

  const profile = profileRes.data as any | null;

  // Today's schedule from timetable
  let schedule: Timetable[] = [];
  let allTimetable: Timetable[] = [];
  if (profile?.class_section) {
    const { data: todaySlots } = await supabase
      .from('timetable').select('*')
      .eq('class_section', profile.class_section)
      .eq('day_of_week', todayFull);
    schedule = todaySlots || [];

    const { data: allSlots } = await supabase
      .from('timetable').select('*')
      .eq('class_section', profile.class_section);
    allTimetable = allSlots || [];
  }

  // Grades for course progress
  const { data: gradesData } = await supabase
    .from('grades').select('*')
    .eq('student_roll', studentRoll);
  const grades = gradesData || [];

  // Leaderboard rank
  const { data: allStudents } = await supabase
    .from('students').select('roll_no, total_xp').eq('status', 'Active').order('total_xp', { ascending: false });
  const rankIndex = (allStudents || []).findIndex((s: any) => s.roll_no === studentRoll);
  const rank = rankIndex >= 0 ? rankIndex + 1 : '—';

  // Build courses from unique subjects in timetable
  const SUBJECT_META: Record<string, { color: string; description: string; syllabus: string[] }> = {
    'Mathematics':    { color: 'bg-blue-500',   description: 'Advanced mathematics covering calculus, algebra, and analytical geometry for FSc/ICS students.', syllabus: ['Number Systems','Sequences & Series','Matrices & Determinants','Quadratic Equations','Partial Fractions','Sets & Functions','Trigonometry','Calculus — Differentiation','Calculus — Integration','Analytical Geometry'] },
    'Physics':        { color: 'bg-violet-500',  description: 'Comprehensive physics course covering mechanics, waves, optics, electricity and modern physics.', syllabus: ['Measurements','Kinematics','Newton Laws of Motion','Work, Energy & Power','Rotational Motion','Waves & Sound','Optics','Electricity & Magnetism','Modern Physics','Nuclear Physics'] },
    'Computer Science':{ color: 'bg-emerald-500',description: 'Practical computer science covering programming in C++, data structures, and database fundamentals.', syllabus: ['Introduction to Computing','Computer Architecture','Data Representation','Programming in C++','Control Structures','Arrays & Functions','Pointers & Strings','Object Oriented Programming','Data Structures','Databases & SQL'] },
    'English':        { color: 'bg-rose-500',    description: 'English language and literature for FSc students, covering grammar, essay writing, and comprehension.', syllabus: ['Grammar & Syntax','Reading Comprehension','Essay Writing','Précis Writing','Letter & Application','Poetry Analysis','Prose & Short Stories','Vocabulary Development','Listening & Speaking','Exam Techniques'] },
    'Urdu':           { color: 'bg-amber-500',   description: 'اردو ادب اور قواعد کا جامع کورس جس میں نظم، نثر اور تحریر شامل ہیں۔', syllabus: ['قواعد و انشاء','خلاصہ نویسی','مضمون نویسی','نظم کا تجزیہ','نثر کا مطالعہ','خطوط نویسی','افسانہ','ناول','اردو ادب کی تاریخ','لسانیات'] },
    'Islamiyat':      { color: 'bg-teal-500',    description: 'Islamic studies covering Quran, Hadith, Islamic history, and contemporary issues.', syllabus: ['قرآن و تفسیر','احادیث نبوی','سیرت النبی','خلفاء راشدین','اسلامی عبادات','اسلامی اخلاقیات','اسلامی تاریخ','اسلامی معاشرت','معاصر مسائل','اسلام اور سائنس'] },
    'Chemistry':      { color: 'bg-orange-500',  description: 'Chemistry covering organic, inorganic and physical chemistry with lab work.', syllabus: ['Basic Concepts','Atomic Structure','Chemical Bonding','States of Matter','Chemical Equilibrium','Acids & Bases','Electrochemistry','Organic Chemistry','Reaction Mechanisms','Industrial Chemistry'] },
    'Biology':        { color: 'bg-lime-500',    description: 'Biology covering cell biology, genetics, human physiology, and ecology.', syllabus: ['Cell Biology','Biochemistry','Bioenergetics','Genetics','Variation & Evolution','Kingdom Classification','Human Physiology','Reproduction','Biotechnology','Ecology'] },
  };

  const uniqueSubjects = [...new Set(allTimetable.map((t: any) => t.subject))];

  const courses: Course[] = uniqueSubjects.map((subject, i) => {
    const meta = SUBJECT_META[subject] || {
      color: 'bg-slate-500',
      description: `${subject} course for the current academic session.`,
      syllabus: Array.from({ length: 8 }, (_, k) => `Chapter ${k + 1}`)
    };
    const subjectGrades = grades.filter((g: any) => g.subject === subject);
    const avgScore = subjectGrades.length > 0
      ? Math.round(subjectGrades.reduce((s: number, g: any) => s + (g.score / g.total_marks) * 100, 0) / subjectGrades.length)
      : Math.floor(Math.random() * 25 + 60); // fallback 60–85%
    const totalLessons = meta.syllabus.length;
    const completedLessons = Math.round((avgScore / 100) * totalLessons);
    const teacherSlot = allTimetable.find((t: any) => t.subject === subject);

    return {
      id: i + 1,
      name: subject,
      instructor: 'Faculty',
      progress: avgScore,
      completedLessons,
      totalLessons,
      color: meta.color,
      description: meta.description,
      syllabus: meta.syllabus,
    };
  });

  // XP: use students.total_xp if available, else sum xp_logs
  const xpFromLogs = xpRes.data?.reduce((acc, curr) => acc + curr.xp_gained, 0) || 0;
  const totalXP = (profile as any)?.total_xp || xpFromLogs;

  return {
    profile,
    today_attendance: attendanceRes.data?.status || 'Not Marked',
    xp_points: totalXP,
    rank,
    notifications: notifsRes || [],
    schedule,
    courses,
  };
}

// ─────────────────────────────────────────────
// STUDENT ATTENDANCE HISTORY
// ─────────────────────────────────────────────

export async function getStudentAttendanceHistory(studentRoll: number, limit = 30) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_roll', studentRoll)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) { console.error('Error fetching attendance history:', error); return []; }
  return data as Attendance[];
}

export async function getStudentAttendanceStats(studentRoll: number) {
  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_roll', studentRoll);

  if (error || !data) return { present: 0, absent: 0, late: 0, percentage: 0, total: 0 };

  const total = data.length;
  const present = data.filter(a => a.status === 'Present').length;
  const absent = data.filter(a => a.status === 'Absent').length;
  const late = data.filter(a => a.status === 'Late').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return { present, absent, late, total, percentage };
}

// ─────────────────────────────────────────────
// XP & GAMIFICATION
// ─────────────────────────────────────────────

export async function calculateXP(studentRoll: number, actionType: string) {
  const rewards: Record<string, number> = {
    'attendance': 10,
    'homework_submission': 50,
    'exam_ace': 100,
    'participation': 20
  };
  const xp = rewards[actionType] || 5;

  const { error } = await supabase.from('xp_logs').insert([{
    student_roll: studentRoll,
    action_type: actionType,
    xp_gained: xp,
  }]);
  if (error) throw error;

  const { data: allXP } = await supabase.from('xp_logs').select('xp_gained').eq('student_roll', studentRoll);
  return allXP?.reduce((acc, curr) => acc + curr.xp_gained, 0) || 0;
}

export async function awardAutomatedXP(
  studentId: number,
  action: 'attendance' | 'homework' | 'test' | 'participation',
  score?: number
) {
  let xp = 0;
  switch (action) {
    case 'attendance':    xp = 10; break;
    case 'homework':      xp = 30; break;
    case 'test':          xp = score ? Math.floor(score / 2) : 50; break;
    case 'participation': xp = 20; break;
  }
  await supabase.from('xp_logs').insert([{
    student_roll: studentId,
    action_type: action,
    xp_gained: xp
  }]);
}

// ─────────────────────────────────────────────
// FEES
// ─────────────────────────────────────────────

export async function updateFee(studentRollLink: number, updates: Partial<FeeRecord>) {
  const { data, error } = await supabase
    .from('fees').update(updates).eq('student_roll_link', studentRollLink).select().single();
  if (error) { console.error('Error updating fee:', error); throw error; }
  return data as FeeRecord;
}

export async function getFeesByRollNo(rollNo: number) {
  const { data, error } = await supabase.from('fees').select('*').eq('student_roll_link', rollNo);
  if (error) { console.error('Error fetching fees:', error); return []; }
  return data as FeeRecord[];
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('fee_transactions')
    .select(`*, students:student_roll_link (full_name, roll_no, class_section)`)
    .order('payment_date', { ascending: false });
  if (error) { console.error('Error fetching transactions:', error); return []; }
  return data;
}

export async function addTransaction(transaction: Omit<FeeTransaction, 'id' | 'payment_date'>) {
  const { data: txData, error: txError } = await supabase
    .from('fee_transactions').insert([transaction]).select().single();
  if (txError) throw txError;

  const { data: feeData, error: feeError } = await supabase
    .from('fees').select('*').eq('student_roll_link', transaction.student_roll_link).single();
  if (feeError && feeError.code !== 'PGRST116') throw feeError;

  let newPaidAmount = feeData?.paid_amount || 0;
  let newTotalAmount = feeData?.total_amount || 0;

  switch (transaction.transaction_type) {
    case 'Payment':
    case 'Correction':      newPaidAmount  += transaction.amount_paid; break;
    case 'Waiver/Discount': newTotalAmount -= transaction.amount_paid; break;
    case 'Penalty/Fine':    newTotalAmount += transaction.amount_paid; break;
  }

  const newStatus = newPaidAmount >= newTotalAmount ? 'Paid' : 'Pending';

  if (feeData) {
    await supabase.from('fees').update({
      paid_amount: newPaidAmount,
      total_amount: newTotalAmount,
      last_payment_date: new Date().toISOString(),
      status: newStatus
    }).eq('id', feeData.id);
  } else {
    await supabase.from('fees').insert([{
      student_roll_link: transaction.student_roll_link,
      total_amount: newTotalAmount,
      paid_amount: newPaidAmount,
      last_payment_date: new Date().toISOString(),
      status: newStatus
    }]);
  }

  await supabase.from('students').update({
    paid_amount: newPaidAmount,
    total_package: newTotalAmount
  }).eq('roll_no', transaction.student_roll_link);

  return txData;
}

// ─────────────────────────────────────────────
// HOMEWORK
// ─────────────────────────────────────────────

export async function fetchHomework(classSection: string) {
  const { data, error } = await supabase
    .from('homework').select('*')
    .eq('class_section', classSection)
    .order('due_date', { ascending: true });
  if (error) { console.error('Error fetching homework:', error); return []; }
  return data as Homework[];
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────

export async function getAdminDashboard() {
  const live = await getLiveAttendance();
  const { data: fees } = await supabase.from('fees').select('paid_amount, total_amount');
  const totalRevenue = fees?.reduce((acc, curr) => acc + curr.paid_amount, 0) || 0;
  const totalPending = fees?.reduce((acc, curr) => acc + (curr.total_amount - curr.paid_amount), 0) || 0;
  return { ...live, financial_summary: { total_revenue: totalRevenue, total_pending: totalPending } };
}

// ─────────────────────────────────────────────
// ADMISSION LEADS
// ─────────────────────────────────────────────

export async function getAdmissionLeads() {
  const { data, error } = await supabase
    .from('admission_leads').select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching admission leads:', error); return []; }
  return data as AdmissionLead[];
}

export async function addAdmissionLead(lead: Omit<AdmissionLead, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('admission_leads').insert([lead]).select().single();
  if (error) { console.error('Error adding admission lead:', error); throw error; }
  return data as AdmissionLead;
}

// ─────────────────────────────────────────────
// PARENT DATA
// ─────────────────────────────────────────────

export async function getParentChildData(parentId: number) {
  const { data: children, error } = await supabase
    .from('students').select('*').eq('parent_id', parentId);

  if (error || !children) return [];

  const results = await Promise.all(children.map(async (child) => {
    const [attRes, feesRes, gradesRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('student_roll', child.roll_no).order('date', { ascending: false }).limit(30),
      supabase.from('fees').select('*').eq('student_roll_link', child.roll_no).single(),
      supabase.from('grades').select('*').eq('student_roll', child.roll_no.toString())
    ]);
    return {
      profile: child,
      attendance_summary: attRes.data || [],
      fee_status: feesRes.data || null,
      report_cards: gradesRes.data || []
    };
  }));

  return results;
}

// ─────────────────────────────────────────────
// CHAPTER LIBRARY (static preloaded)
// ─────────────────────────────────────────────

const CHAPTER_LIBRARY: LibraryChapter[] = [
  { id: 1,  class: 'Class 11', subject: 'Physics',   chapter_number: 1,  title: 'Measurements' },
  { id: 2,  class: 'Class 11', subject: 'Physics',   chapter_number: 2,  title: 'Vectors and Equilibrium' },
  { id: 3,  class: 'Class 11', subject: 'Physics',   chapter_number: 3,  title: 'Motion and Force' },
  { id: 4,  class: 'Class 11', subject: 'Physics',   chapter_number: 4,  title: 'Work and Energy' },
  { id: 5,  class: 'Class 11', subject: 'Physics',   chapter_number: 5,  title: 'Circular Motion' },
  { id: 6,  class: 'Class 12', subject: 'Physics',   chapter_number: 12, title: 'Electrostatics' },
  { id: 7,  class: 'Class 12', subject: 'Physics',   chapter_number: 13, title: 'Current Electricity' },
  { id: 8,  class: 'Class 11', subject: 'Chemistry', chapter_number: 1,  title: 'Basic Concepts' },
  { id: 9,  class: 'Class 11', subject: 'Math',      chapter_number: 1,  title: 'Number Systems' },
];

export async function getChapterLibrary(className?: string, subject?: string) {
  let filtered = CHAPTER_LIBRARY;
  if (className) filtered = filtered.filter(c => c.class === className);
  if (subject)   filtered = filtered.filter(c => c.subject === subject);
  return filtered;
}

// ─────────────────────────────────────────────
// EXAMS — Teacher Portal
// ─────────────────────────────────────────────

export interface ExamRecord {
  id: string;
  teacher_id: number;
  class_section: string;
  subject: string;
  exam_type: string;
  chapter_name: string;
  title: string;
  total_marks: number;
  exam_date?: string;
  date: string;
  grading_status: 'Pending' | 'In Progress' | 'Completed';
  graded_at?: string;
  created_at?: string;
}

/** Get all exams assigned to a specific teacher */
export async function getExamsByTeacher(teacherId: number): Promise<ExamRecord[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching exams:', error); return []; }
  return (data || []) as ExamRecord[];
}

/** Get all exams for a class section */
export async function getExamsByClass(classSection: string): Promise<ExamRecord[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('class_section', classSection)
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching exams by class:', error); return []; }
  return (data || []) as ExamRecord[];
}

/** Create a new exam */
export async function createExam(exam: Omit<ExamRecord, 'id' | 'created_at' | 'graded_at'>): Promise<ExamRecord | null> {
  const { data, error } = await supabase
    .from('exams')
    .insert([{ ...exam, grading_status: exam.grading_status || 'Pending' }])
    .select()
    .single();
  if (error) { console.error('Error creating exam:', error); return null; }
  return data as ExamRecord;
}

/** Update exam grading status */
export async function updateExamStatus(examId: string, status: 'Pending' | 'In Progress' | 'Completed'): Promise<void> {
  const updates: any = { grading_status: status };
  if (status === 'Completed') updates.graded_at = new Date().toISOString();
  const { error } = await supabase.from('exams').update(updates).eq('id', examId);
  if (error) console.error('Error updating exam status:', error);
}

/** Get grades for a specific exam */
export async function getGradesByExam(examId: string): Promise<Grade[]> {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('exam_id', examId)
    .order('student_roll', { ascending: true });
  if (error) { console.error('Error fetching grades by exam:', error); return []; }
  return (data || []) as Grade[];
}

/** Submit grades for a batch of students in one exam */
export async function submitExamGrades(
  examId: string,
  grades: { student_roll: number; score: number; total_marks: number; subject: string; chapter_name: string }[]
): Promise<void> {
  const rows = grades.map(g => ({
    exam_id: examId,
    student_roll: g.student_roll,
    score: g.score,
    total_marks: g.total_marks,
    subject: g.subject,
    chapter_name: g.chapter_name,
  }));

  const { error } = await supabase.from('grades').upsert(rows, { onConflict: 'exam_id,student_roll' });
  if (error) { console.error('Error submitting exam grades:', error); throw error; }

  // Notify students
  const notifRows = grades.map(g => ({
    title: `📝 Marks Published: ${g.subject}`,
    message: `Your score for "${g.chapter_name}" is ${g.score}/${g.total_marks}.`,
    type: 'grade',
    target_role: 'STUDENT',
    target_user_id: String(g.student_roll),
  }));
  await supabase.from('notifications').insert(notifRows);

  // Mark exam as completed
  await updateExamStatus(examId, 'Completed');
}

/** Get students in a class for grading */
export async function getStudentsByClass(classSection: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('roll_no, full_name, class_section, gender')
    .eq('class_section', classSection)
    .eq('status', 'Active')
    .order('full_name', { ascending: true });
  if (error) { console.error('Error fetching students by class:', error); return []; }
  return (data || []) as any[];
}

/** Get teacher dashboard summary */
export async function getTeacherDashboard(teacherId: number) {
  const teacher = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  const exams = await getExamsByTeacher(teacherId);
  const pendingExams   = exams.filter(e => e.grading_status === 'Pending').length;
  const completedExams = exams.filter(e => e.grading_status === 'Completed').length;

  return {
    teacher: teacher.data,
    totalExams: exams.length,
    pendingExams,
    completedExams,
    recentExams: exams.slice(0, 5),
  };
}