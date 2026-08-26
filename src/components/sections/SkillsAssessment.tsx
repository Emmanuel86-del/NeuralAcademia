import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, FileText, Upload, Clock, Award, BookOpen, CheckCircle2, ArrowRight, Search, Filter, Bold, Italic, Code, CheckCircle, AlertCircle, Paperclip, ToggleLeft, ToggleRight, Trash2, Download, Terminal } from 'lucide-react';

export const SkillsAssessment: React.FC = () => {
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [teacherTab, setTeacherTab] = useState<'submissions' | 'posted-exams'>('submissions');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTakeExamModal, setShowTakeExamModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'pending' | 'marked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(2500);

  // Form states (Teacher Create)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newQuestions, setNewQuestions] = useState('');
  const [newType, setNewType] = useState('pdf');
  const [pdfFileName, setPdfFileName] = useState('');
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [examDurationMins, setExamDurationMins] = useState(30);

  // Form states (Student Submit)
  const [studentTextAnswer, setStudentTextAnswer] = useState('');
  const [attachedPdfFile, setAttachedPdfFile] = useState<string | null>(null);
  
  // Grading states
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (examsError) throw examsError;

      const { data: subsData, error: subsError } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (subsError) throw subsError;

      setExams(examsData || []);
      setSubmissions(subsData || []);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
      triggerToast('Failed to load data from database.', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkRoleSelector = () => {
      const headerRoleText = document.body.innerText;
      if (headerRoleText.includes('Corporate Admin') || headerRoleText.includes('Teacher')) {
        setUserRole('teacher');
      } else {
        setUserRole('student');
      }
    };

    checkRoleSelector();
    const interval = setInterval(checkRoleSelector, 1000);
    fetchData();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: any;
    if (showTakeExamModal && selectedExam?.timer_enabled) {
      setTimeLeft((selectedExam.duration_mins || 30) * 60);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showTakeExamModal, selectedExam]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = async () => {
    if (!selectedExam) return;
    const newSub = {
      exam_id: selectedExam.id,
      assessment_title: selectedExam.title,
      student_name: 'Patrick',
      submission_content: studentTextAnswer || '[Auto-submitted: Time expired]',
      attached_file: attachedPdfFile,
      status: 'pending'
    };

    const { error } = await supabase.from('submissions').insert([newSub]);
    if (error) {
      triggerToast('Failed to auto-submit exam.', 'info');
      return;
    }

    await fetchData();
    setShowTakeExamModal(false);
    setStudentTextAnswer('');
    setAttachedPdfFile(null);
    triggerToast('Exam time expired and was auto-submitted!', 'info');
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExam = {
      title: newTitle,
      description: newDesc,
      questions: newQuestions,
      exam_type: newType,
      pdf_url: pdfFileName || 'Exam_Document.html',
      timer_enabled: timerEnabled,
      duration_mins: Number(examDurationMins)
    };

    const { error } = await supabase.from('exams').insert([newExam]);
    if (error) {
      console.error(error);
      triggerToast('Error saving exam to Supabase.', 'info');
      return;
    }

    await fetchData();
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewQuestions('');
    setPdfFileName('');
    triggerToast('New exam successfully created and saved permanently!');
  };

  const handleDeleteExam = async (examId: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', examId);
    if (error) {
      triggerToast('Error deleting exam.', 'info');
      return;
    }
    await fetchData();
    triggerToast('Exam successfully deleted.', 'info');
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    const newSub = {
      exam_id: selectedExam.id,
      assessment_title: selectedExam.title,
      student_name: 'Patrick',
      submission_content: studentTextAnswer || (attachedPdfFile ? 'Submitted via uploaded file attachment.' : ''),
      attached_file: attachedPdfFile,
      status: 'pending'
    };

    const { error } = await supabase.from('submissions').insert([newSub]);
    if (error) {
      console.error(error);
      triggerToast('Error submitting exam.', 'info');
      return;
    }

    await fetchData();
    setShowTakeExamModal(false);
    setStudentTextAnswer('');
    setAttachedPdfFile(null);
    triggerToast('Exam successfully submitted to database!');
  };

  const handleTeacherGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'marked',
        score: gradeScore,
        feedback: gradeFeedback
      })
      .eq('id', selectedSubmission.id);

    if (error) {
      triggerToast('Error updating grade.', 'info');
      return;
    }

    await fetchData();
    setShowGradingModal(false);
    setGradeScore('');
    setGradeFeedback('');
    triggerToast('Grade and feedback permanently saved!');
  };

  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFileName(file.name);
      triggerToast(`Exam file uploaded: ${file.name}`);
    }
  };

  const handleStudentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedPdfFile(file.name);
      triggerToast(`Successfully attached: ${file.name}`);
    }
  };

  const handleDownloadExamFile = (exam: any) => {
    // Fallback or dynamic course theme extracted from the exam
    const theme = exam.color_theme || {
      primary: '#4f46e5', // Indigo primary
      primaryLight: '#e0e7ff',
      textMain: '#1e293b',
      background: '#fdfdfd',
      cardBg: '#ffffff',
      border: '#cbd5e1'
    };

    // Format description and questions safely into HTML blocks
    const formattedDescription = exam.description 
      ? exam.description.replace(/\n/g, '<br/>') 
      : '';
      
    const formattedQuestions = exam.questions 
      ? exam.questions.replace(/\n/g, '<br/>') 
      : 'No questions body provided.';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${exam.title}</title>
        <style>
          :root {
            --theme-primary: ${theme.primary};
            --theme-primary-light: ${theme.primaryLight};
            --theme-text: ${theme.textMain};
            --theme-bg: ${theme.background};
            --theme-card: ${theme.cardBg};
            --theme-border: ${theme.border};
          }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 850px; 
            margin: 40px auto; 
            padding: 30px; 
            color: var(--theme-text); 
            line-height: 1.6; 
            background: var(--theme-bg); 
          }
          h1 { 
            color: var(--theme-primary); 
            border-bottom: 2px solid var(--theme-primary-light); 
            padding-bottom: 12px; 
            margin-top: 10px; 
          }
          .badge { 
            background: var(--theme-primary-light); 
            color: var(--theme-primary); 
            padding: 6px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: bold; 
            display: inline-block; 
            letter-spacing: 0.05em; 
          }
          .meta-info {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }
          .section { 
            background: var(--theme-card); 
            border: 1px solid var(--theme-border); 
            padding: 30px; 
            border-radius: 12px; 
            margin-top: 25px; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); 
          }
          h3 { 
            margin-top: 0; 
            color: var(--theme-primary); 
            font-size: 13px; 
            text-transform: uppercase; 
            letter-spacing: 0.08em; 
            border-bottom: 1px solid #f1f5f9; 
            padding-bottom: 8px; 
          }
          .content-box { 
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px; 
            color: #0f172a; 
            line-height: 1.7;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 15px; 
          }
        </style>
      </head>
      <body>
        <span class="badge">NEURAL ACADEMY OFFICIAL ASSESSMENT</span>
        <h1>${exam.title}</h1>
        
        <div class="meta-info">
          <span>⏱ Duration: ${exam.timer_enabled !== false ? `${exam.duration_mins || 30} minutes` : 'Untimed'}</span>
          <span>📁 Ref: ${exam.pdf_url || 'N/A'}</span>
        </div>

        ${formattedDescription ? `
        <div class="section">
          <h3>Instructions & Overview</h3>
          <div class="content-box">${formattedDescription}</div>
        </div>` : ''}

        <div class="section">
          <h3>Exam Questions & Tasks</h3>
          <div class="content-box">${formattedQuestions}</div>
        </div>

        <div class="footer">
          Neural Academy Learning Management System &bull; Generated Official Copy
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_exam.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerToast(`Complete exam downloaded cleanly with color theme!`);
  };

  const getSubmissionForExam = (examId: string) => {
    return submissions.find(s => s.exam_id === examId);
  };

  const insertFormatting = (wrapper: string) => {
    setStudentTextAnswer(prev => prev + wrapper);
  };

  const insertCodeSnippet = (type: string) => {
    let snippet = '';
    if (type === 'html') {
      snippet = '<!DOCTYPE html>\n<html>\n<head>\n    <title>Page Title</title>\n</head>\n<body>\n    <!-- Write code here -->\n</body>\n</html>';
    } else if (type === 'css') {
      snippet = 'selector {\n    property: value;\n}';
    } else if (type === 'js') {
      snippet = 'function solution() {\n    // Write your code here\n}';
    } else if (type === 'sql') {
      snippet = 'SELECT column_name\nFROM table_name\nWHERE condition;';
    }
    setStudentTextAnswer(prev => prev + (prev ? '\n\n' : '') + snippet);
    triggerToast(`Inserted ${type.toUpperCase()} snippet template!`, 'info');
  };

  const filteredExams = exams.filter(exam => {
    const sub = getSubmissionForExam(exam.id);
    const isSubmitted = !!sub;
    const isMarked = sub?.status === 'marked';

    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'available') return !isSubmitted;
    if (filterTab === 'pending') return isSubmitted && !isMarked;
    if (filterTab === 'marked') return isMarked;
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans relative">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-sm font-medium">
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-indigo-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {userRole === 'teacher' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment Management</h2>
              <p className="text-slate-500 text-sm mt-1">Create exams with custom questions, timer durations, and review student submissions.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Create Exams
              </button>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setTeacherTab('submissions')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                teacherTab === 'submissions' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Student Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setTeacherTab('posted-exams')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                teacherTab === 'posted-exams' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Posted Exams List ({exams.length})
            </button>
          </div>

          {teacherTab === 'submissions' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <h3 className="text-lg font-semibold text-slate-900">Student Submissions Queue</h3>
              <div className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">No student submissions received yet.</div>
                ) : (
                  submissions.map(sub => (
                    <div key={sub.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{sub.student_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">{sub.assessment_title}</span>
                          {sub.attached_file && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {sub.attached_file}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-xl whitespace-pre-wrap">
                          {sub.submission_content}
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedSubmission(sub); setShowGradingModal(true); }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow-sm shrink-0"
                      >
                        Grade Exam
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <h3 className="text-lg font-semibold text-slate-900">List of Posted Exams for Students</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {exams.map(exam => (
                  <div key={exam.id} className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4 bg-slate-50/50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-base">{exam.title}</h4>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                          {exam.timer_enabled !== false ? `${exam.duration_mins || 30} mins` : 'No Timer'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{exam.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-medium truncate">{exam.pdf_url || 'Exam_Document.pdf'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <span className="text-[11px] text-slate-400 font-medium">Posted: {new Date(exam.created_at || Date.now()).toLocaleDateString()}</span>
                      <button 
                        onClick={() => handleDeleteExam(exam.id)} 
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition flex items-center gap-1 text-xs font-semibold"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Exam
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Skills Assessments</h2>
                <p className="text-slate-500 text-sm mt-1">Complete posted evaluations and check instructor feedback.</p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exams..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pt-2 border-t border-slate-100">
              {[
                { key: 'all', label: 'All Exams' },
                { key: 'available', label: 'Available' },
                { key: 'pending', label: 'Pending Review' },
                { key: 'marked', label: 'Marked' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    filterTab === tab.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredExams.length === 0 ? (
              <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
                No assessments found matching your filter criteria.
              </div>
            ) : (
              filteredExams.map(exam => {
                const sub = getSubmissionForExam(exam.id);
                const isSubmitted = !!sub;
                const isMarked = sub?.status === 'marked';

                return (
                  <div key={exam.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase mb-1 block">NEURAL ASSESSMENT</span>
                          <h3 className="text-lg font-bold text-slate-900 leading-snug">{exam.title}</h3>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${
                          isMarked ? 'bg-emerald-50 text-emerald-700' : isSubmitted ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {isMarked ? 'Marked' : isSubmitted ? 'Pending Review' : 'Available'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{exam.description}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{exam.timer_enabled !== false ? `${exam.duration_mins || 30} mins` : 'Untimed'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="truncate max-w-[180px]">{exam.pdf_url || 'Exam_Document.pdf'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleDownloadExamFile(exam)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Exam
                        </button>

                        {!isSubmitted ? (
                          <button
                            onClick={() => { setSelectedExam(exam); setShowTakeExamModal(true); }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2"
                          >
                            Take Exam <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedExam(exam); setSelectedSubmission(sub); setShowResultsModal(true); }}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 text-white ${
                              isMarked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                          >
                            {isMarked ? 'View Score & Feedback' : 'View My Submission'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: Teacher Create Exam */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create New Assessment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Post an exam with questions, duration timer, and document upload.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Exam Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Advanced Database Systems Practical"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Instructions & Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide brief guidelines for taking this assessment..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Exam Questions / Content</label>
                <textarea
                  rows={5}
                  value={newQuestions}
                  onChange={(e) => setNewQuestions(e.target.value)}
                  placeholder="Type or paste the exam questions here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={examDurationMins}
                    onChange={(e) => setExamDurationMins(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Upload Exam Document</label>
                  <label className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer rounded-xl px-4 py-3 text-sm text-slate-700 flex items-center justify-between transition">
                    <span className="truncate">{pdfFileName || 'Choose file...'}</span>
                    <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                    <input type="file" onChange={handleTeacherFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
                >
                  Publish Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Student Take Exam - ENHANCED WORKSPACE WITH CODE SNIPPET HELPER */}
      {showTakeExamModal && selectedExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-7xl h-[94vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
            
            {/* Top Bar Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full">
                  Secure Examination Workspace
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">{selectedExam.title}</h3>
              </div>

              <div className="flex items-center gap-4">
                {selectedExam.timer_enabled !== false && (
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-mono font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-pulse text-red-400" />
                    <span>Time Remaining: {formatTime(timeLeft)}</span>
                  </div>
                )}
                <button 
                  onClick={() => setShowTakeExamModal(false)} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition"
                  title="Close Workspace"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Split-Screen Workstation Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
              
              {/* LEFT COLUMN: Questions & Instructions */}
              <div className="flex flex-col h-full bg-slate-900/50 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center shrink-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> Exam Questions & Guidelines
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleDownloadExamFile(selectedExam)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 border border-indigo-800/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Complete Exam File
                  </button>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 shrink-0">
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{selectedExam.description || 'Follow all instructions carefully.'}</p>
                </div>

                <div className="flex-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-y-auto">
                  <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                    {selectedExam.questions || selectedExam.description || 'No direct questions provided. Please download the exam document above.'}
                  </pre>
                </div>
              </div>

              {/* RIGHT COLUMN: Answer Editor & Submission Workspace */}
              <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto">
                <form onSubmit={handleStudentSubmit} className="flex flex-col h-full space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-4 h-4 text-emerald-400" /> Your Solution / Answer Sheet
                    </label>
                    
                    {/* Code Snippets & Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Snippets:</span>
                      <button type="button" onClick={() => insertCodeSnippet('html')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded font-mono font-bold" title="Insert HTML Template">HTML</button>
                      <button type="button" onClick={() => insertCodeSnippet('css')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-pink-300 rounded font-mono font-bold" title="Insert CSS Rule Template">CSS</button>
                      <button type="button" onClick={() => insertCodeSnippet('js')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded font-mono font-bold" title="Insert JavaScript Function">JS</button>
                      <button type="button" onClick={() => insertCodeSnippet('sql')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded font-mono font-bold" title="Insert SQL Query Template">SQL</button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-[280px]">
                    <textarea
                      required
                      value={studentTextAnswer}
                      onChange={(e) => setStudentTextAnswer(e.target.value)}
                      placeholder="Type your complete exam solutions, code, or answers here clearly..."
                      className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="shrink-0 space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attach Answer Document or ZIP File (Optional)</label>
                      <label className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer rounded-2xl px-4 py-3 text-sm text-slate-300 flex items-center justify-between transition">
                        <span className="truncate flex items-center gap-2 text-xs">
                          <Paperclip className="w-4 h-4 text-indigo-400" />
                          {attachedPdfFile || 'Upload complete answer sheet (.pdf, .doc, .zip)...'}
                        </span>
                        <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                        <input type="file" onChange={handleStudentFileUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowTakeExamModal(false)}
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                      >
                        Submit Final Exam <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: Teacher Grade Submission */}
      {showGradingModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Grade Student Submission</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review and provide feedback for {selectedSubmission.student_name}.</p>
              </div>
              <button onClick={() => setShowGradingModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Student Answer</span>
              <p className="text-xs text-slate-800 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{selectedSubmission.submission_content}</p>
            </div>

            <form onSubmit={handleTeacherGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Score / Grade (e.g., 95/100, A)</label>
                <input
                  type="text"
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  placeholder="e.g. 95"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Feedback & Comments</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide constructive feedback..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
                >
                  Save & Publish Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Score & Feedback */}
      {showResultsModal && selectedExam && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Assessment Results</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedExam.title}</h3>
              </div>
              <button onClick={() => setShowResultsModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status & Score</span>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-800">{selectedSubmission.status === 'marked' ? 'Graded by Instructor' : 'Pending Review'}</span>
                  <span className="text-base font-bold text-indigo-600">{selectedSubmission.score ? `Score: ${selectedSubmission.score}` : 'Pending'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Instructor Feedback</span>
                <p className="text-xs text-slate-700 font-medium">{selectedSubmission.feedback || 'Your submission has been received and is awaiting instructor review.'}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Submitted Answer</span>
                <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-28 overflow-y-auto">{selectedSubmission.submission_content}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowResultsModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SkillsAssessment;
