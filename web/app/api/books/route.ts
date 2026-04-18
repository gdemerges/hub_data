import { NextResponse } from 'next/server'
import { loadBooks } from '@/lib/books-loader'

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }

export async function GET() {
  try {
    const books = await loadBooks()
    if (books.length === 0) {
      return NextResponse.json({ books: [], error: 'No books file found' })
    }
    return NextResponse.json({ books, count: books.length }, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json({ books: [], error: 'Failed to load books data' }, { status: 500 })
  }
}
