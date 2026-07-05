import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: '請輸入 Email' }, { status: 400 });
    }

    const allowedEmailsString = process.env.ALLOWED_EMAILS || '';
    const allowedEmails = allowedEmailsString.split(',').map(e => e.trim().toLowerCase());
    const inputEmail = email.trim().toLowerCase();

    if (allowedEmails.includes(inputEmail)) {
      const cookieStore = await cookies();
      cookieStore.set('user_email', inputEmail, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      return NextResponse.json({ success: true, email: inputEmail });
    } else {
      return NextResponse.json({ success: false, error: '此 Email 不在授權名單內，請聯絡管理員。' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('user_email');
  return NextResponse.json({ success: true });
}
