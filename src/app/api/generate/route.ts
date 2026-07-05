import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: '未授權的存取' }, { status: 401 });
    }

    const { prompt, employeeName } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: '請提供文字內容' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: '伺服器缺少 Gemini API Key 設定' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
你是一位專業的專案經理助理。
使用者會提供一段他們這週口語化或凌亂的工作筆記/草稿。
請將這段文字整理成以下 TypeScript 介面的 JSON 格式。
不要輸出任何其他文字，只能輸出合法的 JSON 字串。

介面定義：
interface Contact { person: string; progress: string; }
interface Task { id: string; description: string; hasContact: boolean; contact?: Contact; }
interface Milestones { filming?: string; questionnaire?: string; salesPage?: string; launch?: string; bulkArrival?: string; shipping?: string; }
interface Project { id: string; name: string; tasks: Task[]; nextWeekPlan: string; milestones?: Milestones; }
interface ReportData { employeeName: string; department: string; dateRange: string; projects: Project[]; }

規則：
1. employeeName: 如果草稿有提到名字，就填入。如果沒有，請填入 "${employeeName}"。
2. department: 根據草稿猜測，或留空字串。
3. dateRange: 填入「本週」的合理日期範圍，例如 "2024/06/10 - 2024/06/14"（或留空字串）。
4. projects: 根據草稿提到的專案或大項目進行分類。每個專案請產生一個唯一的 id (例如 "p1", "p2")。
5. tasks: 該專案底下的工作項目。每個 task 請產生一個唯一的 id (例如 "t1", "t2")。
6. contact: 如果工作項目有提到聯絡人、窗口或溝通進度，請將 hasContact 設為 true，並填寫 contact.person (聯絡人名字) 與 contact.progress (溝通進度)。否則 hasContact 設為 false。
7. nextWeekPlan: 如果草稿有提到該專案下週的計畫，請填寫在這裡。沒有的話請留空字串。
8. milestones: 如果草稿有提到專案的重要時程，請盡量提取並放入 milestones 物件中。欄位包含：filming (拍片), questionnaire (問卷), salesPage (銷售頁), launch (上線), bulkArrival (大貨), shipping (出貨給客人)。【非常重要】請務必將日期轉換為純數字的「MM/DD」格式（例如："08/15", "10/05"）。如果原文是「下週」、「八月中」等模糊字眼，請根據今天日期推算一個合理的 MM/DD 日期。不要填寫「進行中」或非日期的文字，如果真的不知道日期，請留空不要輸出該欄位。
9. 你的輸出必須是一個純 JSON 物件，不要用 \`\`\`json 包裝，直接輸出 { 開頭的 JSON。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    let text = response.text;
    if (!text) {
      throw new Error('No text generated');
    }

    // Clean up potential markdown formatting
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    const parsedData = JSON.parse(text);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'AI 處理過程中發生錯誤' }, { status: 500 });
  }
}
