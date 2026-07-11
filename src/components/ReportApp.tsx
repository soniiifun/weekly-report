/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Save, CheckCircle2, Bot, LayoutDashboard, Table, ArrowRightCircle, Users, Clock } from 'lucide-react';
import { ReportData, Project, Task, Milestones } from '../types';

const defaultData: ReportData = {
  employeeName: '',
  department: '',
  dateRange: '',
  projects: []
};

const getDayOfYear = (dateStr: string) => {
  if (!dateStr) return null;
  const [m, d] = dateStr.split('/').map(Number);
  if (!m || !d || isNaN(m) || isNaN(d)) return null;
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let days = d;
  for (let i = 1; i < m; i++) days += daysInMonth[i];
  return days;
};

const formatDayToDate = (dayOfYear: number) => {
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let days = Math.round(dayOfYear);
  for (let m = 1; m <= 12; m++) {
    if (days <= daysInMonth[m]) {
      return `${m}/${days}`;
    }
    days -= daysInMonth[m];
  }
  return '';
};

// --- TIMELINE & CALENDAR PARSING LOGIC ---
const parseChineseNum = (str: string) => {
  if (!str) return 0;
  if (!isNaN(parseInt(str))) return parseInt(str);
  const map: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19,
    '二十': 20, '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25, '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29,
    '三十': 30, '三十一': 31
  };
  return map[str] || 0;
};

const parseDate = (text: string) => {
  if (!text) return null;
  // Matches formats like: 7/5, 07/05, 7.5, 7月5日, 7月5號, 七月八日
  const regex = /(?:^|\s|[^0-9a-zA-Z一-龥])([0-9]{1,2}|[一二三四五六七八九十]+)\s*[\/\.月]\s*([0-9]{1,2}|[一二三四五六七八九十]+)\s*(?:日|號)?/;
  const match = text.match(regex);
  if (match) {
    const month = parseChineseNum(match[1]);
    const day = parseChineseNum(match[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
  }
  return null;
};

const getDaysInMonth = (month: number) => {
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month] || 30;
};


// Morandi Palette
const PALETTE = ['#8C9088', '#9A8B84', '#A89F91', '#D0C8B8', '#7C8084', '#B4AFA7', '#867F77'];

interface TimelineTask {
  day: number;
  project: string;
  color: string;
  description: string;
  taskId: string;
}

interface TimelineMonth {
  month: number;
  days: number;
  tasks: TimelineTask[];
}
// ------------------------------

interface ReportAppProps {
  currentUser?: string;
}

const MiniCalendar = ({ year, month, activeDays, milestoneDays = [], color }: { year: number, month: number, activeDays: number[], milestoneDays?: number[], color: string }) => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  return (
    <div className="mini-calendar" style={{ width: '85%', fontSize: 'calc(1.5 * var(--cqi-unit))', margin: '0' }}>
      <div style={{ fontWeight: 'bold', fontSize: 'calc(2.2 * var(--cqi-unit))', marginBottom: 'calc(1.2 * var(--cqi-unit))', color: '#111827', textAlign: 'left', paddingLeft: 'calc(0.5 * var(--cqi-unit))' }}>
        {month} 月
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'calc(0.2 * var(--cqi-unit))', textAlign: 'center' }}>
        {weekDays.map(d => <div key={d} style={{ color: '#6B7280', fontWeight: 'bold', fontSize: 'calc(1.4 * var(--cqi-unit))' }}>{d}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`}></div>;
          const isActive = activeDays.includes(d);
          const isMilestone = milestoneDays.includes(d);
          const isToday = new Date().getFullYear() === year && (new Date().getMonth() + 1) === month && new Date().getDate() === d;
          
          let bgColor = 'transparent';
          let textColor = '#111827';
          let fontWeight = 'normal';
          
          if (isMilestone) {
            bgColor = '#F59E0B'; // Amber/Orange
            textColor = '#FFFFFF';
            fontWeight = 'bold';
          } else if (isActive) {
            bgColor = color;
            textColor = '#FFFFFF';
            fontWeight = 'bold';
          } else if (isToday) {
            textColor = '#EF4444';
            fontWeight = 'bold';
          }

          return (
            <div key={d} style={{ 
              aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: bgColor,
              color: textColor,
              borderRadius: '50%',
              fontWeight: fontWeight,
              fontSize: 'calc(1.5 * var(--cqi-unit))',
              opacity: isActive || isMilestone ? 0.9 : 0.8,
              position: 'relative'
            }}>
              <span style={{ position: 'relative', top: isToday ? 'calc(-0.2 * var(--cqi-unit))' : '0' }}>{d}</span>
              {isToday && (
                <div style={{ position: 'absolute', bottom: 'calc(0.4 * var(--cqi-unit))', width: 'calc(0.5 * var(--cqi-unit))', height: 'calc(0.5 * var(--cqi-unit))', backgroundColor: (isActive || isMilestone) ? '#FFFFFF' : '#EF4444', borderRadius: '50%' }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function ReportApp({ currentUser = 'Guest' }: ReportAppProps) {
  const [data, setData] = useState<ReportData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);
  const deferredData = React.useDeferredValue(data);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'presentation'>('presentation');
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isWebFullscreen, setIsWebFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsWebFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem(`weekly-report-data-${currentUser}`);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    setIsLoaded(true);
  }, [currentUser]);

  // Auto-save data whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(`weekly-report-data-${currentUser}`, JSON.stringify(data));
    }
  }, [data, isLoaded, currentUser]);

  const saveToLocal = () => {
    localStorage.setItem(`weekly-report-data-${currentUser}`, JSON.stringify(data));
    setSaveStatus('已儲存進度 (Draft Saved)');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const generateFromAI = async () => {
    if (!draftText.trim()) return;
    setIsGenerating(true);
    setSaveStatus('正在呼叫 AI 整理中...');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: draftText, employeeName: data.employeeName || currentUser })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        localStorage.setItem(`weekly-report-data-${currentUser}`, JSON.stringify(result.data));
        setSaveStatus('已載入 AI 整理資料！');
        setDraftText(''); // Clear draft after success
      } else {
        let errorMsg = result.error || '解析失敗';
        if (typeof errorMsg === 'string' && errorMsg.includes('503')) {
          errorMsg = 'AI 伺服器目前過於忙碌 (503)，請稍等幾秒鐘後再試一次！(免費版常見狀況)';
        } else if (typeof errorMsg === 'string' && errorMsg.includes('{')) {
           try {
             const parsed = JSON.parse(errorMsg.substring(errorMsg.indexOf('{')));
             if (parsed.error && parsed.error.message) {
               errorMsg = parsed.error.message;
             }
           } catch(e) {}
        }
        alert('錯誤: ' + errorMsg);
        setSaveStatus('');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('無法連線到 AI 伺服器');
      setSaveStatus('');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleFullscreen = () => {
    setIsWebFullscreen(true);
  };

  const handleExportPDF = async () => {
    if (viewMode === 'table') {
      window.print(); // Fallback for table view
      return;
    }
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const slides = document.querySelectorAll('.slide');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080]
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        const canvas = await html2canvas(slide, {
          scale: 3, 
          useCORS: true,
          backgroundColor: isDarkMode ? '#0B132B' : '#FFFFFF'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
      }
      
      pdf.save(`週報_${data.dateRange || '未命名'}.pdf`);
    } catch (error) {
      console.error('Export Error:', error);
      alert('產生 PDF 時發生錯誤，請稍後再試。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFromLINE = async () => {
    try {
      setSaveStatus('正在從 LINE 同步任務...');
      const res = await fetch('https://personal-secretary-bot-banx.onrender.com/api/tasks');
      const result = await res.json();
      if (result.success && result.data) {
        const lineTasks = result.data;
        // Group by project
        const grouped: Record<string, any[]> = {};
        lineTasks.forEach((t: any) => {
          const projName = t.project || '未分類';
          if (!grouped[projName]) grouped[projName] = [];
          grouped[projName].push({
             id: t.id || (Date.now().toString() + Math.random().toString()),
             description: t.description,
             hasContact: false,
             contact: null
          });
        });
        
        const newProjects = Object.keys(grouped).map(projName => ({
           id: Date.now().toString() + Math.random().toString(),
           name: projName,
           tasks: grouped[projName],
           nextWeekPlan: ''
        }));
        
        setData(prev => {
          const existing = prev.projects.filter(p => p.name.trim() !== '' || p.tasks.some(t => t.description.trim() !== ''));
          return { ...prev, projects: [...existing, ...newProjects] };
        });
        setSaveStatus('✅ 已成功匯入 LINE 任務！');
        alert(`太棒了！為您匯入了 ${lineTasks.length} 筆任務，分為 ${newProjects.length} 個專案。原先的空白欄位已自動移除！`);
      } else {
        setSaveStatus('❌ 匯入失敗');
        alert('匯入失敗：' + JSON.stringify(result));
      }
    } catch (e: any) {
      console.error(e);
      setSaveStatus('❌ 無法連線至 LINE 機器人');
      alert('連線失敗，請確認機器人是否正常啟動：' + e.message);
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const syncToLINE = async () => {
    if (!window.confirm('確定要將網頁上的任務同步回 LINE 嗎？\n這將會：\n1. 新增網頁上新建的任務\n2. 修改原有任務\n3. 從 LINE 刪除您在網頁上移除的任務！')) {
      return;
    }
    try {
      setSaveStatus('正在與 LINE 雙向同步...');
      const res = await fetch('https://personal-secretary-bot-banx.onrender.com/api/tasks');
      const result = await res.json();
      if (!result.success) throw new Error('無法取得 LINE 任務');
      const lineTasks = result.data;
      
      const currentTasks = data.projects.flatMap(p => p.tasks.map(t => ({ ...t, project: p.name })));
      
      let newCount = 0;
      let updateCount = 0;
      let deleteCount = 0;

      // 1. Delete tasks that are in LINE but no longer in UI
      for (const lt of lineTasks) {
        if (!currentTasks.some(ct => ct.id === lt.id)) {
          await fetch(`https://personal-secretary-bot-banx.onrender.com/api/tasks/${lt.id}`, { method: 'DELETE' });
          deleteCount++;
        }
      }

      // 2. Add or Update
      for (const ct of currentTasks) {
        if (!ct.description.trim()) continue;
        
        const existsInLine = lineTasks.some((lt: any) => lt.id === ct.id);

        if (existsInLine) {
           await fetch(`https://personal-secretary-bot-banx.onrender.com/api/tasks/${ct.id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ description: ct.description, project: ct.project || null })
           });
           updateCount++;
        } else {
           const createRes = await fetch('https://personal-secretary-bot-banx.onrender.com/api/tasks', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ description: ct.description, project: ct.project || null })
           });
           const created = await createRes.json();
           if (created.success && created.data) {
              // Update local ID to the real UUID so it matches next time
              setData(prev => ({
                ...prev,
                projects: prev.projects.map(p => ({
                  ...p,
                  tasks: p.tasks.map(t => t.id === ct.id ? { ...t, id: created.data.id } : t)
                }))
              }));
           }
           newCount++;
        }
      }

      setSaveStatus('✅ 同步成功！');
      alert(`雙向同步完成！\n新增了 ${newCount} 筆\n更新了 ${updateCount} 筆\n刪除了 ${deleteCount} 筆`);
    } catch (e: any) {
      console.error(e);
      setSaveStatus('❌ 同步失敗');
      alert('同步失敗：' + e.message);
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // State mutators
  const updateGeneralInfo = (field: keyof ReportData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addProject = () => {
    const newProject: Project = { id: Date.now().toString() + Math.random().toString(), name: '', tasks: [], nextWeekPlan: '' };
    setData(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
  };

  const removeProject = (projectId: string) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== projectId) }));
  };

  const updateProject = (projectId: string, field: keyof Project, value: any) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, [field]: value } : p)
    }));
  };

  const updateMilestone = (projectId: string, field: keyof Milestones, value: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          const currentMilestones = p.milestones || {};
          return { ...p, milestones: { ...currentMilestones, [field]: value } };
        }
        return p;
      })
    }));
  };

  const addTask = (projectId: string) => {
    const newTask: Task = { id: Date.now().toString() + Math.random().toString(), description: '', hasContact: false, contact: { person: '', progress: '' } };
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p)
    }));
  };

  const removeTask = (projectId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p)
    }));
  };

  const updateTask = (projectId: string, taskId: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.map(t => {
              if (t.id === taskId) {
                if (field.startsWith('contact.')) {
                  const contactField = field.split('.')[1];
                  const currentContact = t.contact || { person: '', progress: '' };
                  return { ...t, contact: { ...currentContact, [contactField]: value } };
                }
                return { ...t, [field]: value };
              }
              return t;
            })
          };
        }
        return p;
      })
    }));
  };

  const previewContent = React.useMemo(() => {
          const data = deferredData;
          return (
            <React.Fragment>
              <style dangerouslySetInnerHTML={{__html: `
                
          .report-preview-container { container-type: inline-size; --cqi-unit: 1cqi; }
          .fullscreen-mode { --cqi-unit: 1vw; }
          
          .slides-container { display: flex; flex-direction: column; gap: 2rem; }

          .slide {
            background-color: #B2A79D;
            border-radius: 0;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
            padding: calc(4 * var(--cqi-unit)) calc(4 * var(--cqi-unit)) calc(1 * var(--cqi-unit)) calc(4 * var(--cqi-unit));
            aspect-ratio: 16 / 9;
            /* removed container-type */
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            border: none;
            border-left: calc(3 * var(--cqi-unit)) solid #FFFFFF;
            border-top: calc(3 * var(--cqi-unit)) solid #FFFFFF;
            border-bottom: calc(3 * var(--cqi-unit)) solid #FFFFFF;
            color: #FFFFFF;
            z-index: 1;
          }
          
          .dark .slide {
            background: radial-gradient(circle at 50% 0%, #1E1B4B, #0B132B);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
          }

          .slide-title { font-size: calc(4.2 * var(--cqi-unit)); font-weight: 800; color: #FFFFFF; text-align: center; margin-top: auto; letter-spacing: calc(0.2 * var(--cqi-unit)); }
          .dark .slide-title { color: white; text-shadow: 0 0 20px rgba(255,255,255,0.3); }

          .cover-box { text-align: center; border: calc(0.2 * var(--cqi-unit)) solid rgba(255,255,255,0.2); padding: calc(5 * var(--cqi-unit)); border-radius: 0; background: rgba(255,255,255,0.05); /* removed backdrop-filter */ }
          .dark .cover-box { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          
          .slide-subtitle { font-size: calc(2.5 * var(--cqi-unit)); color: #E5E0DB; text-align: center; margin-bottom: auto; margin-top: calc(1 * var(--cqi-unit)); }
          .dark .slide-subtitle { color: #9CA3AF; }

          .slide-content { display: flex; flex-direction: row; gap: calc(3 * var(--cqi-unit)); flex: 1; overflow: hidden; }
          .slide-col { display: flex; flex-direction: column; overflow: hidden; }
          .slide-col-title { font-size: calc(2.8 * var(--cqi-unit)); font-weight: bold; color: #FFFFFF; margin-bottom: calc(1 * var(--cqi-unit)); display: flex; align-items: center; gap: calc(0.5 * var(--cqi-unit)); }
          .dark .slide-col-title { color: #60A5FA; }
          .slide-tasks-container { overflow-y: hidden; padding-right: calc(0.5 * var(--cqi-unit)); display: grid; grid-template-columns: 1fr 1fr; gap: calc(1.5 * var(--cqi-unit)); align-content: start; width: 100%; }
          
          .slide-task-card { background: rgba(255,255,255,0.08); border-radius: 0; padding: calc(2 * var(--cqi-unit)); border: none; border-left: 3px solid rgba(255,255,255,0.4); box-shadow: none; transition: transform 0.2s; }
          .dark .slide-task-card { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.05); box-shadow: none; }
          
          .slide-task-desc { font-size: calc(2.6 * var(--cqi-unit)); color: #FFFFFF; white-space: pre-wrap; line-height: 1.6; font-weight: 500; }
          .dark .slide-task-desc { color: #F3F4F6; }

          .slide-contact { margin-top: calc(1 * var(--cqi-unit)); background: rgba(255,255,255,0.08); padding: calc(1 * var(--cqi-unit)); border-radius: 0; font-size: calc(2.4 * var(--cqi-unit)); color: #E5E0DB; display: flex; flex-direction: column; gap: calc(0.4 * var(--cqi-unit)); border: 1px solid rgba(255,255,255,0.1); }
          .dark .slide-contact { background: rgba(59,130,246,0.15); color: #93C5FD; border-color: rgba(59,130,246,0.2); }
          
          .slide-contact-row { display: flex; align-items: flex-start; gap: calc(0.5 * var(--cqi-unit)); }
          
          .slide-next-week { background: rgba(0,0,0,0.02); border: calc(0.2 * var(--cqi-unit)) dashed rgba(0,0,0,0.15); border-radius: calc(1.5 * var(--cqi-unit)); padding: calc(2 * var(--cqi-unit)); font-size: calc(2.8 * var(--cqi-unit)); color: #4B5563; white-space: pre-wrap; line-height: 1.7; flex: 1; overflow: hidden; }
          .dark .slide-next-week { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.15); color: #D1D5DB; }
          
          /* Timeline UI */
          .timeline-container { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; margin: calc(5 * var(--cqi-unit)) 0; }
          
          .timeline-line { position: absolute; top: 50%; left: 0; width: 100%; height: calc(0.4 * var(--cqi-unit)); background: #E5E7EB; border-radius: calc(1 * var(--cqi-unit)); transform: translateY(-50%); }
          .dark .timeline-line { background: rgba(255,255,255,0.2); }
          
          .timeline-ticks { position: absolute; top: 50%; left: 0; width: 100%; height: 100%; pointer-events: none; }
          .timeline-tick { position: absolute; top: calc(-1 * var(--cqi-unit)); width: calc(0.2 * var(--cqi-unit)); height: calc(2.4 * var(--cqi-unit)); background: rgba(0,0,0,0.2); }
          .dark .timeline-tick { background: rgba(255,255,255,0.3); }
          
          .timeline-tick-label { position: absolute; top: calc(2.5 * var(--cqi-unit)); transform: translateX(-50%); font-size: calc(1.6 * var(--cqi-unit)); color: #6B7280; }
          .dark .timeline-tick-label { color: #9CA3AF; }
          
          .timeline-item { position: absolute; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; z-index: 10; }
          
          .timeline-dot { width: calc(1.8 * var(--cqi-unit)); height: calc(1.8 * var(--cqi-unit)); border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: calc(0.3 * var(--cqi-unit)) solid #FFF; background: currentColor; }
          .dark .timeline-dot { box-shadow: 0 0 10px currentColor; border-color: #0B132B; }
          
          .timeline-label-box { position: absolute; width: calc(22 * var(--cqi-unit)); padding: calc(0.8 * var(--cqi-unit)) calc(1 * var(--cqi-unit)); border-radius: calc(0.6 * var(--cqi-unit)); background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-size: calc(1.6 * var(--cqi-unit)); text-align: center; color: #1F2937; word-break: break-all; white-space: normal; }
          .dark .timeline-label-box { background: rgba(0,0,0,0.6); /* removed backdrop-filter */ border-color: rgba(255,255,255,0.1); box-shadow: none; color: white; }
          
          .timeline-label-box.top { bottom: calc(3 * var(--cqi-unit)); }
          .timeline-label-box.bottom { top: calc(3 * var(--cqi-unit)); }
          .timeline-proj-name { font-weight: bold; font-size: calc(1.4 * var(--cqi-unit)); margin-bottom: calc(0.2 * var(--cqi-unit)); }
          
          .timeline-month-title { font-size: calc(5 * var(--cqi-unit)); font-weight: bold; color: #111827; text-align: center; margin-bottom: calc(2 * var(--cqi-unit)); letter-spacing: calc(0.2 * var(--cqi-unit)); }
          .dark .timeline-month-title { color: white; text-shadow: 0 0 20px rgba(255,255,255,0.3); }
          
          .timeline-legend { display: flex; flex-wrap: wrap; gap: calc(1.5 * var(--cqi-unit)); justify-content: center; margin-top: auto; padding: calc(1.5 * var(--cqi-unit)); background: rgba(0,0,0,0.03); border-radius: calc(1 * var(--cqi-unit)); border: 1px solid rgba(0,0,0,0.05); }
          .dark .timeline-legend { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
          
          .timeline-legend-item { display: flex; align-items: center; gap: calc(0.5 * var(--cqi-unit)); font-size: calc(1.8 * var(--cqi-unit)); }
          .timeline-legend-dot { width: calc(1.2 * var(--cqi-unit)); height: calc(1.2 * var(--cqi-unit)); border-radius: 50%; }
          


          .slide-page-num { position: absolute; bottom: calc(2 * var(--cqi-unit)); right: calc(4 * var(--cqi-unit)); font-size: calc(2 * var(--cqi-unit)); color: #E5E0DB; font-family: monospace; }
          .dark .slide-page-num { color: #6B7280; }
          
          .slide-watermark { position: absolute; top: calc(2 * var(--cqi-unit)); right: calc(4 * var(--cqi-unit)); font-size: calc(1.5 * var(--cqi-unit)); color: #E5E0DB; opacity: 0.6; letter-spacing: 0.1em; text-transform: uppercase; }
          .dark .slide-watermark { color: #4B5563; }

        `}} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }} className="no-print">
          <button 
            className="btn" 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            style={{ 
              backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
              color: isDarkMode ? '#F9FAFB' : '#111827',
              boxShadow: 'var(--shadow-md)' 
            }}
          >
            {isDarkMode ? '🌙 切換明亮模式' : '☀️ 切換深色模式'}
          </button>
          
          {viewMode === 'presentation' && (
            <button className="btn" onClick={handleFullscreen} style={{ backgroundColor: '#10B981', color: 'white', boxShadow: 'var(--shadow-md)' }}>
              🖥️ 全螢幕簡報
            </button>
          )}
          
          <button className="btn btn-primary" onClick={handleExportPDF} style={{ boxShadow: 'var(--shadow-md)', opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }} disabled={isExporting}>
            <Printer size={18} style={{ marginRight: '0.5rem' }}/> 
            {isExporting ? '正在產生 PDF...' : `直接匯出 PDF (${viewMode === 'presentation' ? '簡報格式' : '總表'})`}
          </button>
        </div>

        {viewMode === 'table' ? (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-md)' }}>
            <div className="table-header">
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>每週工作匯報</h1>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', marginTop: '1rem' }}>
                <span><strong>期間：</strong> {data.dateRange || '未填寫'}</span>
              </div>
            </div>
            {data.projects.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }}>尚無專案資料</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>專案名稱</th>
                    <th style={{ width: '35%' }}>本週執行項目</th>
                    <th style={{ width: '15%' }}>聯絡窗口</th>
                    <th style={{ width: '20%' }}>聯絡進度</th>
                    <th style={{ width: '15%' }}>下週預計進度</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((project, pIdx) => {
                    const tasksCount = Math.max(project.tasks.length, 1);
                    return (
                      <React.Fragment key={project.id}>
                        {project.tasks.length > 0 ? (
                          project.tasks.map((task, tIdx) => (
                            <tr key={task.id}>
                              {tIdx === 0 && <td rowSpan={tasksCount} style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{project.name || '未命名專案'}</td>}
                              <td className="task-cell">{task.description}</td>
                              <td>{task.hasContact ? task.contact?.person || '-' : '-'}</td>
                              <td>{task.hasContact ? task.contact?.progress || '-' : '-'}</td>
                              {tIdx === 0 && <td rowSpan={tasksCount} style={{ whiteSpace: 'pre-wrap', backgroundColor: '#F9FAFB' }}>{project.nextWeekPlan || '-'}</td>}
                            </tr>
                          ))
                        ) : (
                          <tr key={project.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{project.name || '未命名專案'}</td>
                            <td colSpan={3} style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center' }}>無具體項目</td>
                            <td style={{ whiteSpace: 'pre-wrap', backgroundColor: '#F9FAFB' }}>{project.nextWeekPlan || '-'}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* PRESENTATION MODE VIEW */
          <div className="slide-deck" id="presentation-slides">
            {(() => {
              // 1. Build Monthly Data for Calendar & Timeline
              const monthsData: Record<number, TimelineMonth> = {};
              const projColors: Record<string, string> = {};
              let colorIdx = 0;

              data.projects.forEach(proj => {
                if (!proj.name.trim()) return;
                if (!projColors[proj.id]) {
                  projColors[proj.id] = PALETTE[colorIdx % PALETTE.length];
                  colorIdx++;
                }

                proj.tasks.forEach(task => {
                  const dateInfo = parseDate(task.description);
                  if (dateInfo) {
                    if (!monthsData[dateInfo.month]) {
                      monthsData[dateInfo.month] = {
                        month: dateInfo.month,
                        days: getDaysInMonth(dateInfo.month),
                        tasks: []
                      };
                    }
                    monthsData[dateInfo.month].tasks.push({
                      day: dateInfo.day,
                      project: proj.name,
                      color: projColors[proj.id],
                      description: task.description,
                      taskId: task.id
                    });
                  }
                });
              });

              const sortedMonths = Object.values(monthsData).sort((a, b) => a.month - b.month);

              // Find report month
              let reportMonth = new Date().getMonth() + 1;
              let reportYear = new Date().getFullYear();
              if (data.dateRange) {
                const dateMatch = data.dateRange.match(/(\d{4})[\/\-](\d{1,2})/);
                if (dateMatch) {
                  reportYear = parseInt(dateMatch[1]);
                  reportMonth = parseInt(dateMatch[2]);
                } else {
                  const simpleMatch = data.dateRange.match(/(\d{1,2})[\/\-]\d{1,2}/);
                  if (simpleMatch) reportMonth = parseInt(simpleMatch[1]);
                }
              }

              // 2. Build Project Slides Data
              const CHUNK_SIZE = 6; // Reduced from 10 to fit in slide without scrolling
              const slidesData: { 
                project: Project; 
                tasks: Task[]; 
                part: number; 
                totalParts: number; 
                activeDays: number[]; 
                milestoneDays: number[]; 
                milestoneList: {key: string, label: string, value: string}[];
                slideMonth: number;
                slideYear: number;
              }[] = [];
              
              const milestoneLabels: Record<string, string> = {
                scriptPhotoList: '腳本、商攝清單',
                filming: '照片影片',
                questionnaire: '問卷',
                platformProposal: '平台提案',
                pageStructure: '頁面架構',
                salesPage: '銷售頁設計',
                createSocials: '創：FB、IG、line',
                postContent: '發圖文：FB、line、EDM',
                launch: '上線',
                bulkArrival: '工廠出貨',
                officialSiteLaunch: '官網上架',
                shipping: '出貨給客人'
              };

              data.projects.forEach(project => {
                if (project.tasks.length === 0) {
                  const activeDays: number[] = [];
                  const milestoneDays: number[] = [];
                  const milestoneList: {key: string, label: string, value: string}[] = [];
                  if (project.milestones) {
                    Object.entries(project.milestones).forEach(([key, value]) => {
                      if (value && typeof value === 'string') {
                        milestoneList.push({ key, label: milestoneLabels[key] || key, value });
                        const dInfo = parseDate(value);
                        if (dInfo && dInfo.month === reportMonth && !milestoneDays.includes(dInfo.day)) {
                          milestoneDays.push(dInfo.day);
                        }
                      }
                    });
                  }
                  slidesData.push({ project, tasks: [], part: 1, totalParts: 1, activeDays, milestoneDays, milestoneList, slideMonth: reportMonth, slideYear: reportYear });
                } else {
                  const totalParts = Math.ceil(project.tasks.length / CHUNK_SIZE);
                  for (let i = 0; i < project.tasks.length; i += CHUNK_SIZE) {
                    const partNum = Math.floor(i / CHUNK_SIZE) + 1;
                    const slideMonth = ((reportMonth + partNum - 2) % 12) + 1;
                    const slideYear = reportYear + Math.floor((reportMonth + partNum - 2) / 12);
                    
                    const partActiveDays: number[] = [];
                    const partMilestoneDays: number[] = [];
                    const partMilestoneList: {key: string, label: string, value: string}[] = [];
                    
                    if (project.milestones) {
                      Object.entries(project.milestones).forEach(([key, value]) => {
                        if (value && typeof value === 'string') {
                          partMilestoneList.push({ key, label: milestoneLabels[key] || key, value });
                          const dInfo = parseDate(value);
                          if (dInfo && dInfo.month === slideMonth && !partMilestoneDays.includes(dInfo.day)) {
                            partMilestoneDays.push(dInfo.day);
                          }
                        }
                      });
                    }

                    project.tasks.forEach(task => {
                       const dInfo = parseDate(task.description);
                       if (dInfo && dInfo.month === slideMonth && !partActiveDays.includes(dInfo.day)) {
                         partActiveDays.push(dInfo.day);
                       }
                    });

                    slidesData.push({
                      project,
                      tasks: project.tasks.slice(i, i + CHUNK_SIZE),
                      part: partNum,
                      totalParts,
                      activeDays: partActiveDays,
                      milestoneDays: partMilestoneDays,
                      milestoneList: partMilestoneList,
                      slideMonth,
                      slideYear
                    });
                  }
                }
              });

              let slideIndexCounter = 1;

              // Render: Cover -> Calendar -> Projects -> Timeline
              return (
                <React.Fragment>
                  {/* Part 1: Title Slide */}
                  <div className="slide" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <div className="cover-box">
                      <h1 className="slide-title" style={{ fontSize: 'calc(8 * var(--cqi-unit))', margin: '0 0 calc(2 * var(--cqi-unit)) 0' }}>每週工作匯報</h1>
                      <div className="slide-subtitle" style={{ fontSize: 'calc(3.5 * var(--cqi-unit))', marginBottom: 'calc(3 * var(--cqi-unit))', marginTop: 0 }}>{data.employeeName || 'Sonia'}</div>
                    </div>
                  </div>


                  {/* Part 3: Project Content Slides */}
                  {data.projects.length === 0 && (
                    <div className="slide" style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <h2 style={{ color: '#9CA3AF' }}>尚無專案資料，請從左側新增</h2>
                    </div>
                  )}

                  {slidesData.map((slideData) => {
                    const pageNum = slideIndexCounter++;
                    const titleColor = '#9CA3AF'; // match screenshot color for title
                    const cardBgColor = '#949CA6'; // match screenshot color for task block
                    
                    const projIndex = data.projects.findIndex(p => p.id === slideData.project.id) + 1;
                    const projNumberStr = projIndex.toString().padStart(2, '0');
                    const projectColor = projColors[slideData.project.id] || '#4A5D4E';
                    
                    return (
                      <div key={`${slideData.project.id}-${slideData.part}`} className="slide" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 'calc(-1 * var(--cqi-unit))', left: 'calc(0 * var(--cqi-unit))', fontSize: 'calc(15 * var(--cqi-unit))', fontWeight: 900, lineHeight: 1, color: projectColor, filter: 'none', zIndex: 0, opacity: 0.15, letterSpacing: 'calc(-1 * var(--cqi-unit))' }}>
                          {projNumberStr}
                        </div>
                        <div className="slide-page-num" style={{ zIndex: 1 }}>{pageNum}</div>
                        <div className="slide-watermark" style={{ zIndex: 1 }}>Weekly Report</div>
                        
                        <div className="slide-header" style={{ position: 'relative', zIndex: 1, marginTop: 'calc(-3 * var(--cqi-unit))' }}>
                          <h2 className="slide-title" style={{ color: '#000000', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            {slideData.project.name}
                            {slideData.totalParts > 1 && <span style={{ fontSize: '50%', opacity: 0.7, marginLeft: 'calc(1 * var(--cqi-unit))' }}>(Part {slideData.part})</span>}
                          </h2>
                          <div className="slide-meta" style={{ fontSize: 'calc(2 * var(--cqi-unit))', color: '#6B7280', marginTop: 'calc(1 * var(--cqi-unit))' }}>
                            {data.employeeName}{data.employeeName && data.department ? ' | ' : ''}{data.department}
                          </div>
                        </div>
                        
                        <div className="slide-content" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '3.5fr 6.5fr', gap: 'calc(1 * var(--cqi-unit))', marginLeft: 'calc(-2 * var(--cqi-unit))', marginTop: 'calc(-2 * var(--cqi-unit))', overflow: 'visible' }}>
                          
                          <div className="slide-calendar-col" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(2 * var(--cqi-unit))', justifyContent: 'center' }}>
                            <MiniCalendar year={slideData.slideYear} month={slideData.slideMonth} activeDays={slideData.activeDays} milestoneDays={slideData.milestoneDays} color={projectColor} />
                            
                            {slideData.milestoneList && slideData.milestoneList.length > 0 && (
                              <div className="milestones-list" style={{ marginTop: 'calc(-0.5 * var(--cqi-unit))', marginLeft: 'calc(-2 * var(--cqi-unit))', padding: 'calc(1.5 * var(--cqi-unit))', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 'calc(0.8 * var(--cqi-unit))', fontSize: 'calc(1.4 * var(--cqi-unit))' }}>
                                <div style={{ fontWeight: 'bold', color: '#F59E0B', marginBottom: 'calc(1 * var(--cqi-unit))' }}>重要時程</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 'calc(0.5 * var(--cqi-unit))', rowGap: 'calc(0.6 * var(--cqi-unit))' }}>
                                  {slideData.milestoneList.map((m, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 'calc(0.5 * var(--cqi-unit))', alignItems: 'flex-start' }}>
                                      <div style={{ width: 'calc(0.8 * var(--cqi-unit))', height: 'calc(0.8 * var(--cqi-unit))', borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0, marginTop: 'calc(0.4 * var(--cqi-unit))' }}></div>
                                      <span style={{ color: '#4B5563', fontWeight: 'bold', lineHeight: '1.2' }}>{m.label}：{m.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="slide-col" style={{ flex: 1, width: '100%', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>

                            <div className="slide-tasks-container" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(0.2 * var(--cqi-unit))', overflowY: 'hidden', marginTop: 'calc(6 * var(--cqi-unit))' }}>
                              {slideData.tasks.length === 0 && <p style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 'calc(1.8 * var(--cqi-unit))', textAlign: 'center', width: '100%' }}>無具體項目</p>}
                              {slideData.tasks.map(task => (
                                <div key={task.id} className="slide-task-card" style={{ backgroundColor: 'transparent', color: '#1F2937', border: 'none', padding: 'calc(0.2 * var(--cqi-unit)) 0', boxShadow: 'none', display: 'flex', gap: 'calc(1.5 * var(--cqi-unit))', alignItems: 'flex-start' }}>
                                  <div style={{ marginTop: 'calc(0.8 * var(--cqi-unit))', width: 'calc(1.2 * var(--cqi-unit))', height: 'calc(1.2 * var(--cqi-unit))', borderRadius: '50%', backgroundColor: projectColor, flexShrink: 0 }}></div>
                                  <div style={{ flex: 1 }}>
                                    <div className="slide-task-desc" style={{ color: '#1F2937' }}>
                                      {task.link ? (
                                        <a href={task.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'underline' }}>
                                          {task.description || '(未填寫說明)'}
                                        </a>
                                      ) : (
                                        task.description || '(未填寫說明)'
                                      )}
                                    </div>
                                  
                                  {task.hasContact && (
                                    <div className="slide-contact" style={{ backgroundColor: 'transparent', border: 'none', padding: '0 0 0 calc(1 * var(--cqi-unit))', borderLeft: '2px solid rgba(0,0,0,0.1)', color: '#4B5563', gap: 'calc(0.2 * var(--cqi-unit))' }}>
                                      <div className="slide-contact-row">
                                        <span><strong>窗口：</strong>{task.contact?.person || '未指定'}</span>
                                      </div>
                                      <div className="slide-contact-row" style={{ marginTop: 'calc(0.25 * var(--cqi-unit))' }}>
                                        <span><strong>進度：</strong>{task.contact?.progress || '無進度說明'}</span>
                                      </div>
                                    </div>
                                  )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>


                        </div>
                      </div>
                    );
                  })}

                  {/* Part 4: Timeline Slides (at the very end) */}
                  {sortedMonths.map((monthData) => {
                    const activeProjects = Array.from(new Set(monthData.tasks.map(t => t.project)));
                    const pageNum = slideIndexCounter++;
                    
                    return (
                      <div key={`timeline-slide-${monthData.month}`} className="slide">
                        <div className="slide-page-num">{pageNum}</div>
                        <div className="slide-watermark">Weekly Report</div>
                        <div className="timeline-month-title">{monthData.month}月 專案時程總表</div>
                        
                        <div className="timeline-container">
                          <div className="timeline-line"></div>
                          
                          {/* Ticks */}
                          <div className="timeline-ticks">
                            {[1, 5, 10, 15, 20, 25, monthData.days].map(day => (
                              <div key={day}>
                                <div className="timeline-tick" style={{ left: `${(day / monthData.days) * 100}%` }}></div>
                                <div className="timeline-tick-label" style={{ left: `${(day / monthData.days) * 100}%` }}>{day}</div>
                              </div>
                            ))}
                          </div>

                          {/* SVG Connecting Lines */}
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
                            {(() => {
                              const tasks = [...monthData.tasks].sort((a, b) => a.day - b.day);
                              let topEdge = -10;
                              let bottomEdge = -10;
                              const LABEL_WIDTH = 22; // approx width in %
                              const GAP = 2; // gap in %

                              return tasks.map((task, i) => {
                                const isTop = i % 2 === 0;
                                const dotPos = (task.day / monthData.days) * 100;
                                let idealLeftEdge = dotPos - LABEL_WIDTH / 2;
                                
                                if (isTop) {
                                  if (idealLeftEdge < topEdge) idealLeftEdge = topEdge + GAP;
                                  topEdge = idealLeftEdge + LABEL_WIDTH;
                                } else {
                                  if (idealLeftEdge < bottomEdge) idealLeftEdge = bottomEdge + GAP;
                                  bottomEdge = idealLeftEdge + LABEL_WIDTH;
                                }
                                
                                const labelPos = idealLeftEdge + LABEL_WIDTH / 2;
                                
                                // Save positions for the next render pass
                                (task as any)._rendered = { dotPos, labelPos, isTop };
                                
                                return (
                                  <line 
                                    key={`line-${task.taskId}`}
                                    x1={`${dotPos}%`} 
                                    y1="50%" 
                                    x2={`${labelPos}%`} 
                                    y2={isTop ? "calc(50% - calc(3.5 * var(--cqi-unit)))" : "calc(50% + calc(3.5 * var(--cqi-unit)))"} 
                                    stroke={task.color} 
                                    strokeWidth="calc(0.2 * var(--cqi-unit))" 
                                    strokeDasharray="calc(0.6 * var(--cqi-unit))"
                                    opacity="0.6"
                                  />
                                );
                              });
                            })()}
                          </svg>

                          {/* Dots & Labels */}
                          {monthData.tasks.map((task) => {
                            const { dotPos, labelPos, isTop } = (task as any)._rendered;
                            return (
                              <React.Fragment key={task.taskId}>
                                <div className="timeline-item" style={{ left: `${dotPos}%` }}>
                                  <div className="timeline-dot" style={{ color: task.color }}></div>
                                </div>
                                <div className="timeline-item" style={{ left: `${labelPos}%`, zIndex: 11 }}>
                                  <div className={`timeline-label-box ${isTop ? 'top' : 'bottom'}`} style={{ borderColor: task.color, transform: 'translateX(-50%)', left: '0' }}>
                                    <div className="timeline-proj-name" style={{ color: task.color }}>{task.project}</div>
                                    <div>{task.description}</div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>

                        <div className="timeline-legend">
                          {activeProjects.map(projName => {
                            const proj = data.projects.find(p => p.name === projName);
                            const color = proj ? projColors[proj.id] : '#fff';
                            return (
                              <div key={projName} className="timeline-legend-item">
                                <div className="timeline-legend-dot" style={{ backgroundColor: color }}></div>
                                <span>{projName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })()}
          </div>
        )}
            </React.Fragment>
          );
        }, [deferredData, viewMode, isDarkMode]);

  if (!isLoaded) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="responsive-grid">
      {/* Editor Section (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '100vh', overflowY: 'auto', paddingRight: '1rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>工作週報系統</h1>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>個人專屬週報系統</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {saveStatus && <span style={{ fontSize: '0.875rem', color: 'green', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={16}/> {saveStatus}</span>}
            <button 
              onClick={() => {
                if (window.confirm('確定要清除畫面上所有的專案草稿嗎？這會讓您擁有乾淨的版面重新匯入任務。')) {
                  setData(prev => ({ ...prev, projects: [] }));
                }
              }} 
              className="btn" 
              style={{ backgroundColor: '#FEE2E2', color: '#EF4444', borderColor: '#FCA5A5' }}
            >
              🗑️ 清空所有草稿
            </button>
            <button className="btn" style={{ backgroundColor: '#10B981', color: 'white' }} onClick={handleImportFromLINE}>
              📥 匯入 LINE 任務
            </button>
            <button className="btn" style={{ backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }} onClick={syncToLINE}>
              🔄 雙向同步到 LINE
            </button>
            <button className="btn btn-primary" onClick={saveToLocal} style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Save size={18} style={{ marginRight: '0.5rem' }}/> 儲存進度
            </button>
            <button className="btn" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }} onClick={() => setData(defaultData)}>
              <Trash2 size={18} style={{ marginRight: '0.5rem' }}/> 清空
            </button>
          </div>
        </div>

        {/* View Toggles */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#F3F4F6', padding: '0.5rem', borderRadius: '0.5rem' }}>
          <button 
            className="btn" 
            style={{ flex: 1, backgroundColor: viewMode === 'presentation' ? 'white' : 'transparent', color: viewMode === 'presentation' ? 'var(--primary)' : '#6B7280', boxShadow: viewMode === 'presentation' ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => setViewMode('presentation')}
          >
            <LayoutDashboard size={18} style={{ marginRight: '0.5rem' }}/> PPT 簡報模式
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, backgroundColor: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? 'var(--primary)' : '#6B7280', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => setViewMode('table')}
          >
            <Table size={18} style={{ marginRight: '0.5rem' }}/> 總表模式
          </button>
        </div>

        {/* General Info */}
        <div className="card">
          <h2>基本資訊</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label>週報期間</label>
              <input className="input-field" value={data.dateRange} onChange={e => updateGeneralInfo('dateRange', e.target.value)} placeholder="如：2023/10/01 - 2023/10/07" />
            </div>
          </div>
        </div>

        {/* Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>專案進度回報</h2>
            <button className="btn btn-primary" onClick={addProject}>
              <Plus size={16} style={{ marginRight: '0.5rem' }}/> 新增專案
            </button>
          </div>

          {data.projects.map((project, pIndex) => (
            <div key={project.id} className="card" style={{ position: 'relative', borderLeft: '4px solid var(--primary)' }}>
              <button 
                onClick={() => removeProject(project.id)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
              >
                <Trash2 size={20} />
              </button>
              
              <div style={{ marginBottom: '1.5rem', width: '90%' }}>
                <label>專案名稱</label>
                <input className="input-field" value={project.name} onChange={e => updateProject(project.id, 'name', e.target.value)} placeholder="如：公司官網改版專案" />
              </div>
              
              <div style={{ marginBottom: '1.5rem', width: '95%', backgroundColor: '#EFF6FF', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid #3B82F6' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1E3A8A', marginBottom: '0.8rem', display: 'block' }}>重要時程</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>腳本、商攝清單</label>
                    <input className="input-field" value={project.milestones?.scriptPhotoList || ''} onChange={e => updateMilestone(project.id, 'scriptPhotoList', e.target.value)} placeholder="如：8/10" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>照片影片</label>
                    <input className="input-field" value={project.milestones?.filming || ''} onChange={e => updateMilestone(project.id, 'filming', e.target.value)} placeholder="如：8/15" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>問卷</label>
                    <input className="input-field" value={project.milestones?.questionnaire || ''} onChange={e => updateMilestone(project.id, 'questionnaire', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>平台提案</label>
                    <input className="input-field" value={project.milestones?.platformProposal || ''} onChange={e => updateMilestone(project.id, 'platformProposal', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>頁面架構</label>
                    <input className="input-field" value={project.milestones?.pageStructure || ''} onChange={e => updateMilestone(project.id, 'pageStructure', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>銷售頁設計</label>
                    <input className="input-field" value={project.milestones?.salesPage || ''} onChange={e => updateMilestone(project.id, 'salesPage', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>創：FB、IG、line</label>
                    <input className="input-field" value={project.milestones?.createSocials || ''} onChange={e => updateMilestone(project.id, 'createSocials', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>發圖文：FB、line、EDM</label>
                    <input className="input-field" value={project.milestones?.postContent || ''} onChange={e => updateMilestone(project.id, 'postContent', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>上線</label>
                    <input className="input-field" value={project.milestones?.launch || ''} onChange={e => updateMilestone(project.id, 'launch', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>工廠出貨</label>
                    <input className="input-field" value={project.milestones?.bulkArrival || ''} onChange={e => updateMilestone(project.id, 'bulkArrival', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>官網上架</label>
                    <input className="input-field" value={project.milestones?.officialSiteLaunch || ''} onChange={e => updateMilestone(project.id, 'officialSiteLaunch', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#3B82F6' }}>出貨給客人</label>
                    <input className="input-field" value={project.milestones?.shippingToCustomer || ''} onChange={e => updateMilestone(project.id, 'shippingToCustomer', e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '1rem' }}>本週工作項目</label>
                  <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#F3F4F6' }} onClick={() => addTask(project.id)}>
                    + 新增項目
                  </button>
                </div>

                {project.tasks.map((task, tIndex) => (
                  <div key={task.id} style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem', marginBottom: '0.5rem', position: 'relative' }}>
                    <button 
                      onClick={() => removeTask(project.id, task.id)}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <label style={{ fontSize: '0.75rem' }}>項目描述</label>
                    <textarea 
                      className="input-field" 
                      style={{ minHeight: '60px', marginBottom: '0.5rem', width: '95%' }} 
                      value={task.description} 
                      onChange={e => updateTask(project.id, task.id, 'description', e.target.value)} 
                    />

                    <label style={{ fontSize: '0.75rem' }}>外部連結 (選填)</label>
                    <input 
                      className="input-field" 
                      style={{ marginBottom: '0.5rem', width: '95%' }} 
                      value={task.link || ''} 
                      onChange={e => updateTask(project.id, task.id, 'link', e.target.value)} 
                      placeholder="例如：https://google.com"
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        id={`contact-${task.id}`} 
                        checked={task.hasContact} 
                        onChange={e => updateTask(project.id, task.id, 'hasContact', e.target.checked)} 
                      />
                      <label htmlFor={`contact-${task.id}`} style={{ margin: 0 }}>此項目有對外聯絡事項</label>
                    </div>

                    {task.hasContact && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '1.5rem', borderLeft: '2px dashed #E5E7EB' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem' }}>聯絡人 / 窗口</label>
                          <input className="input-field" value={task.contact?.person || ''} onChange={e => updateTask(project.id, task.id, 'contact.person', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem' }}>聯絡進度說明</label>
                          <input className="input-field" value={task.contact?.progress || ''} onChange={e => updateTask(project.id, task.id, 'contact.progress', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label>下週預計進度</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px' }} 
                  value={project.nextWeekPlan} 
                  onChange={e => updateProject(project.id, 'nextWeekPlan', e.target.value)} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Preview Section */}
      <div className={`report-preview-container ${isWebFullscreen ? "fullscreen-mode" : ""}`} style={isWebFullscreen ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999,
        backgroundColor: '#000', padding: '2rem', overflowY: 'auto', margin: 0, borderRadius: 0
      } : { backgroundColor: '#E5E7EB', padding: '1rem', borderRadius: '0.5rem', height: '100vh', overflowY: 'auto' }}>
      
      {isWebFullscreen && (
        <button 
          onClick={() => setIsWebFullscreen(false)}
          style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 10000, padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', cursor: 'pointer', /* removed backdrop-filter */ fontSize: '1rem', fontWeight: 'bold' }}
        >
          ❌ 退出全螢幕 (ESC)
        </button>
      )}
        {previewContent}
      </div>
    </div>
  );
}
