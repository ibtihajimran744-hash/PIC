import { supabase } from './supabase';

export async function seedAllDemoData() {
  console.log('Starting demo data seeding...');

  try {
    // 1. Create Teacher
    const demoTeacher = {
      full_name: 'Ibtihaj Imran',
      designation: 'Senior Faculty',
      subject_dept: 'Physics & Mathematics',
      phone: '0300-1234567',
      email: 'ibtihajimran744@gmail.com',
      username: 'ibtihaj',
      password: 'password123',
      assigned_classes: '9th-A, 10th-B'
    };

    const { data: teacherData, error: tErr } = await supabase
      .from('teachers')
      .upsert([demoTeacher], { onConflict: 'email' })
      .select()
      .single();

    if (tErr) throw tErr;
    const teacherId = teacherData.id;

    // 2. Create Students
    const studentDataList = [
      { name: 'Ahmed Khan', class: '9th-A' },
      { name: 'Sara Bibi', class: '9th-A' },
      { name: 'Zain Ali', class: '9th-A' },
      { name: 'Fatima Noor', class: '10th-B' },
      { name: 'Bilal Shah', class: '10th-B' },
      { name: 'Hamza Malik', class: '9th-A' },
      { name: 'Ayesha Rashid', class: '10th-B' },
      { name: 'Usman Ghani', class: '9th-A' },
      { name: 'Hafsa Jamil', class: '10th-B' },
      { name: 'Omer Farooq', class: '10th-B' }
    ];

    const students = studentDataList.map((s, i) => ({
      full_name: s.name,
      roll_no: 202600 + i,
      class_section: s.class,
      father_name: 'Parent of ' + s.name,
      status: 'Active',
      paid_amount: 15000,
      total_package: 150000,
      total_xp: Math.floor(Math.random() * 1000) + 500,
      current_badge: i === 0 ? 'Gold' : i < 3 ? 'Silver' : 'Bronze',
      username: `student${202600 + i}`,
      password: 'password123'
    }));

    const { data: studentRecords, error: sErr } = await supabase
      .from('students')
      .upsert(students, { onConflict: 'roll_no' })
      .select();

    if (sErr) throw sErr;

    // 3. Timetable
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timetable = [];

    for (const day of days) {
      // 9th-A Physics
      timetable.push({
        class_section: '9th-A',
        subject: 'Physics',
        teacher_id: teacherId,
        teacher_name: 'Ibtihaj Imran',
        day_of_week: day,
        start_time: '08:30',
        end_time: '09:20',
        room: 'Lab 1',
        campus: 'Main'
      });
      // 10th-B Mathematics
      timetable.push({
        class_section: '10th-B',
        subject: 'Mathematics',
        teacher_id: teacherId,
        teacher_name: 'Ibtihaj Imran',
        day_of_week: day,
        start_time: '10:15',
        end_time: '11:05',
        room: 'Room 204',
        campus: 'Main'
      });
    }

    await supabase.from('timetable').delete().eq('teacher_id', teacherId);
    await supabase.from('timetable').insert(timetable);

    // 4. Scheme of Study (Syllabus Overview)
    const today = new Date();
    const syllabusItems = [
      { subject: 'Physics', topic: 'Measurements & Errors', week: 1, status: 'Completed', date: '2026-03-01' },
      { subject: 'Physics', topic: 'Vectors & Scalars', week: 2, status: 'Completed', date: '2026-03-08' },
      { subject: 'Physics', topic: 'Kinematics', week: 3, status: 'Completed', date: '2026-03-15' },
      { subject: 'Physics', topic: 'Dynamics', week: 4, status: 'In Progress', date: '2026-03-22' },
      { subject: 'Physics', topic: 'Work and Power', week: 5, status: 'Planned', date: '2026-03-29' },
      { subject: 'Mathematics', topic: 'Algebraic Expressions', week: 1, status: 'Completed', date: '2026-03-02' },
      { subject: 'Mathematics', topic: 'Factorization', week: 2, status: 'Completed', date: '2026-03-09' },
      { subject: 'Mathematics', topic: 'Linear Equations', week: 3, status: 'In Progress', date: '2026-03-16' },
      { subject: 'Mathematics', topic: 'Quadratic Equations', week: 4, status: 'Planned', date: '2026-03-23' }
    ];

    const scheme = syllabusItems.map(item => ({
      teacher_id: teacherId,
      class_section: item.subject === 'Physics' ? '9th-A' : '10th-B',
      subject: item.subject,
      topic: item.topic,
      week_no: item.week,
      scheduled_date: item.date,
      status: item.status
    }));

    await supabase.from('scheme_of_study').delete().eq('teacher_id', teacherId);
    await supabase.from('scheme_of_study').insert(scheme);

    // 5. Exams, Tests & Grades
    const testData = [
      { title: 'Chapter 1 Quiz', type: 'Quiz', subject: 'Physics', class: '9th-A', marks: 25 },
      { title: 'Monthly Assessment - March', type: 'Monthly Test', subject: 'Mathematics', class: '10th-B', marks: 50 },
      { title: 'Mid-term Exam', type: 'Exam', subject: 'Physics', class: '9th-A', marks: 100 }
    ];

    // Clear existing for clean seed if possible
    // Note: Depends on cascade delete. 
    // I'll just insert and let user see the new ones.

    for (const test of testData) {
      const { data: exRecord, error: exErr } = await supabase.from('exams').insert([{
        teacher_id: teacherId,
        class_section: test.class,
        subject: test.subject,
        exam_type: test.type,
        title: test.title,
        total_marks: test.marks,
        date: today.toISOString().split('T')[0],
        grading_status: 'Completed'
      }]).select().single();

      if (!exErr && exRecord) {
        const grades = studentRecords
          .filter(s => s.class_section === test.class)
          .map(s => ({
            exam_id: exRecord.id,
            student_roll: s.roll_no,
            score: Math.floor(Math.random() * (test.marks * 0.4)) + (test.marks * 0.6),
            total_marks: test.marks,
            subject: test.subject,
            comments: 'Excellent effort.'
          }));
        await supabase.from('grades').insert(grades);
      }
    }

    // 6. Exam Duties
    const duties = [
      {
        teacher_id: teacherId,
        teacher_name: demoTeacher.full_name,
        exam_title: 'HSSC Part-1 Board Exams',
        date: today.toISOString().split('T')[0],
        time_slot: '09:00 AM - 12:00 PM',
        room_no: 'Exam Hall A',
        duty_type: 'Senior Invigilator'
      },
      {
        teacher_id: teacherId,
        teacher_name: demoTeacher.full_name,
        exam_title: 'HSSC Part-2 Board Exams',
        date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
        time_slot: '01:30 PM - 04:30 PM',
        room_no: 'Room 102',
        duty_type: 'Room Superintendent'
      }
    ];

    try {
      await supabase.from('examiner_invigilation').insert(duties);
    } catch (e) {
      console.warn('Invigilation duty insert failed:', e);
    }

    console.log('Demo data seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return false;
  }
}
