'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Save, CheckCircle2, Bot, LayoutDashboard, Table, ArrowRightCircle, Users } from 'lucide-react';
import { ReportData, Project, Task } from '../types';

const defaultData: ReportData = {
  employeeName: '',
  department: '',
  dateRange: '',
  projects: []
};

interface ReportAppProps {
  currentUser?: string;
}

export default function ReportApp({ currentUser = 'Guest' }: ReportAppProps) {
  const [data, setData] = useState<ReportData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'presentation'>('presentation');
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftText, setDraftText] = useState('');

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
  }, []);

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
          backgroundColor: '#0B132B'
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
      const res = await fetch('http://localhost:3001/api/tasks');
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
                  return { ...t, contact: { ...t.contact, [contactField]: value } };
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
      <div className="report-preview-container" style={{ backgroundColor: '#E5E7EB', padding: '1rem', borderRadius: '0.5rem', height: '100vh', overflowY: 'auto' }}>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) {
            .responsive-grid { grid-template-columns: 1fr !important; }
            .report-preview-container { height: auto !important; padding: 0 !important; background: none !important; }
          }
          
          /* Table Mode Styles */
          .report-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; background: white; }
          .report-table th, .report-table td { border: 1px solid #D1D5DB; padding: 0.75rem; text-align: left; vertical-align: top; }
          .report-table th { background-color: #F3F4F6; font-weight: bold; color: #374151; white-space: nowrap; }
          .task-cell { white-space: pre-wrap; }
          .table-header { background: white; padding: 2rem; text-align: center; border-bottom: 2px solid #111827; }

          /* Presentation Mode Styles */
          .slide-deck { 
            display: flex; flex-direction: column; gap: 2rem; align-items: center; 
            font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif;
          }
          .slide {
            container-type: inline-size;
            width: 100%;
            aspect-ratio: 16/9;
            background: linear-gradient(135deg, #0B132B 0%, #000000 100%);
            color: #FFFFFF;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            padding: 4cqi;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
            page-break-after: always;
            box-sizing: border-box;
          }
          
          /* Print Settings */
          @media print {
            @page { size: 16in 9in; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #000000; margin: 0; }
            .no-print { display: none !important; }
            .report-preview-container { height: auto !important; overflow: visible !important; padding: 0 !important; background: none !important; }
            .slide-deck { gap: 0; }
            .slide {
              width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important;
              border: none !important; border-radius: 0 !important; box-shadow: none !important;
              margin: 0 !important; padding: 5vw !important;
            }
            .slide::after {
              content: ""; display: block; height: 0; page-break-after: always;
            }
          }

          /* Fluid Scaling Typography & Spacing based on cqi (container query inline size) */
          .slide svg { width: 1.2em; height: 1.2em; flex-shrink: 0; }
          .slide-header { border-bottom: 0.1cqi solid rgba(255,255,255,0.2); padding-bottom: 0.5cqi; margin-bottom: 1.5cqi; display: flex; justify-content: space-between; align-items: flex-end; }
          .slide-title { font-size: 4cqi; font-weight: bold; color: #FFFFFF; margin: 0; }
          .slide-meta { font-size: 1.8cqi; color: #9CA3AF; text-align: right; }
          .slide-content { display: flex; flex-direction: column; gap: 3cqi; flex: 1; min-height: 0; overflow: hidden; }
          .slide-col { display: flex; flex-direction: column; overflow: hidden; }
          .slide-col-title { font-size: 2.8cqi; font-weight: bold; color: #60A5FA; margin-bottom: 1cqi; display: flex; align-items: center; gap: 0.5cqi; }
          
          .slide-tasks-container { overflow-y: visible; padding-right: 0.5cqi; display: grid; grid-template-columns: 1fr 1fr; gap: 1cqi; align-content: start; }
          .slide-task-card { background: rgba(255,255,255,0.05); border-radius: 0.8cqi; padding: 1cqi; border-left: 0.6cqi solid #3B82F6; border-top: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
          .slide-task-desc { font-size: 2.2cqi; color: #F3F4F6; white-space: pre-wrap; line-height: 1.6; }
          
          .slide-contact { margin-top: 1cqi; background: rgba(59,130,246,0.15); padding: 1cqi; border-radius: 0.8cqi; font-size: 2cqi; color: #93C5FD; display: flex; flex-direction: column; gap: 0.4cqi; border: 1px solid rgba(59,130,246,0.2); }
          .slide-contact-row { display: flex; align-items: flex-start; gap: 0.5cqi; }
          
          .slide-next-week { background: rgba(255,255,255,0.02); border: 0.2cqi dashed rgba(255,255,255,0.15); border-radius: 1.5cqi; padding: 2cqi; font-size: 2.8cqi; color: #D1D5DB; white-space: pre-wrap; line-height: 1.7; flex: 1; overflow: hidden; }
          .slide-watermark { position: absolute; bottom: 2cqi; right: 3cqi; font-size: 1.4cqi; color: rgba(255,255,255,0.3); }
          .slide-page-num { position: absolute; bottom: 2cqi; left: 3cqi; font-size: 1.6cqi; font-weight: bold; color: rgba(255,255,255,0.2); }
        `}} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }} className="no-print">
          <button className="btn btn-primary" onClick={handleExportPDF} style={{ boxShadow: 'var(--shadow-md)', opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }} disabled={isExporting}>
            <Printer size={18} style={{ marginRight: '0.5rem' }}/> 
            {isExporting ? '正在產生 PDF...' : `直接匯出 PDF (${viewMode === 'presentation' ? '簡報格式' : '總表'})`}
          </button>
        </div>

        {viewMode === 'table' ? (
          /* TABLE MODE VIEW */
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
          <div className="slide-deck">
            {/* Title Slide */}
            <div className="slide" style={{ justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', border: '0.2cqi solid rgba(255,255,255,0.1)', padding: '5cqi', borderRadius: '2cqi', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <h1 style={{ fontSize: '8cqi', fontWeight: 'bold', margin: '0 0 2cqi 0', color: '#FFFFFF', textShadow: '0 4px 6px rgba(0,0,0,0.5)' }}>每週工作匯報</h1>
                <div style={{ fontSize: '3.5cqi', color: '#9CA3AF', marginBottom: '3cqi' }}>{data.dateRange || '未設定期間'}</div>
                <div style={{ fontSize: '2.5cqi', color: '#D1D5DB' }}>

                </div>
              </div>
            </div>

            {/* Content Slides (One per project, paginated if too many tasks) */}
            {data.projects.length === 0 && (
              <div className="slide" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ color: '#9CA3AF' }}>尚無專案資料，請從左側新增</h2>
              </div>
            )}
            
            {(() => {
              const CHUNK_SIZE = 10;
              const slidesData: { project: Project; tasks: Task[]; part: number; totalParts: number }[] = [];
              
              data.projects.forEach(project => {
                if (project.tasks.length === 0) {
                  slidesData.push({ project, tasks: [], part: 1, totalParts: 1 });
                } else {
                  const totalParts = Math.ceil(project.tasks.length / CHUNK_SIZE);
                  for (let i = 0; i < project.tasks.length; i += CHUNK_SIZE) {
                    slidesData.push({
                      project,
                      tasks: project.tasks.slice(i, i + CHUNK_SIZE),
                      part: Math.floor(i / CHUNK_SIZE) + 1,
                      totalParts
                    });
                  }
                }
              });

              return slidesData.map((slideData, idx) => (
                <div key={`${slideData.project.id}-${slideData.part}`} className="slide">
                  <div className="slide-page-num">{idx + 1} / {slidesData.length}</div>
                  <div className="slide-watermark">Weekly Report</div>
                  
                  <div className="slide-header">
                    <h2 className="slide-title">
                      {slideData.project.name || '未命名專案'}
                      {slideData.totalParts > 1 && <span style={{ fontSize: '2.5cqi', color: '#60A5FA', marginLeft: '1cqi' }}>(Part {slideData.part}/{slideData.totalParts})</span>}
                    </h2>
                    <div className="slide-meta">

                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{data.dateRange}</div>
                    </div>
                  </div>

                  <div className="slide-content">
                    {/* Left Column: This Week Tasks */}
                    <div className="slide-col">
                      <div className="slide-col-title">
                        <CheckCircle2 /> 本週執行項目
                      </div>
                      <div className="slide-tasks-container">
                        {slideData.tasks.length === 0 && <p style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '1.8cqi' }}>無具體項目</p>}
                        {slideData.tasks.map(task => (
                          <div key={task.id} className="slide-task-card">
                            <div className="slide-task-desc">{task.description || '(未填寫說明)'}</div>
                            
                            {task.hasContact && (
                              <div className="slide-contact">
                                <div className="slide-contact-row">
                                  <Users style={{ flexShrink: 0, marginTop: '0.2cqi' }}/>
                                  <span><strong>窗口：</strong>{task.contact?.person || '未指定'}</span>
                                </div>
                                <div className="slide-contact-row" style={{ marginTop: '0.25cqi' }}>
                                  <ArrowRightCircle style={{ flexShrink: 0, marginTop: '0.2cqi' }}/>
                                  <span><strong>進度：</strong>{task.contact?.progress || '無進度說明'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
