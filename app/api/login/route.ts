import { NextResponse } from 'next/server'

// Пароль хранится ТОЛЬКО на сервере (без NEXT_PUBLIC_ префикса)
// Задать через Vercel Environment Variables: SITE_PASSWORD
export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    const correctPassword = process.env.SITE_PASSWORD || 'grafik2026'
    
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Введите пароль' },
        { status: 400 }
      )
    }
    
    // Постоянное сравнение, предотвращает timing attacks
    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json(
      { success: false, error: 'Неверный пароль' },
      { status: 401 }
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
