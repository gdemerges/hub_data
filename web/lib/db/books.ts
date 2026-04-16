import { createClient } from '@/lib/supabase/server'
import type { Book } from '@/lib/types'

interface DbBookRow {
  id: string
  user_id: string
  title: string
  title_vo?: string
  author?: string
  format?: string
  lectorat?: string
  genre1?: string
  genre2?: string
  editeur?: string
  collection?: string
  year?: number
  pages?: number
  langue?: string
  rating?: string | number
  avg_rating?: string | number
  date_read?: string
  date_purchase?: string
  type?: string
  isbn?: string
  cover_url?: string
  created_at?: string
  updated_at?: string
}

/**
 * Map database row to Book type
 * Converts snake_case to camelCase
 */
function mapDbToBook(row: DbBookRow): Book {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    titleVO: row.title_vo,
    author: row.author,
    format: row.format,
    lectorat: row.lectorat,
    genre1: row.genre1,
    genre2: row.genre2,
    editeur: row.editeur,
    collection: row.collection,
    year: row.year,
    pages: row.pages,
    langue: row.langue,
    rating: row.rating ? parseFloat(String(row.rating)) : undefined,
    avgRating: row.avg_rating ? parseFloat(String(row.avg_rating)) : undefined,
    dateRead: row.date_read,
    datePurchase: row.date_purchase,
    type: row.type,
    isbn: row.isbn,
    coverUrl: row.cover_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * Map Book type to database row
 * Converts camelCase to snake_case
 */
function mapBookToDb(book: Partial<Book>) {
  return {
    title: book.title,
    title_vo: book.titleVO,
    author: book.author,
    format: book.format,
    lectorat: book.lectorat,
    genre1: book.genre1,
    genre2: book.genre2,
    editeur: book.editeur,
    collection: book.collection,
    year: book.year,
    pages: book.pages,
    langue: book.langue,
    rating: book.rating,
    avg_rating: book.avgRating,
    date_read: book.dateRead,
    date_purchase: book.datePurchase,
    type: book.type,
    isbn: book.isbn,
    cover_url: book.coverUrl,
  }
}

/**
 * Get all books for a user
 */
export async function getBooks(userId: string): Promise<Book[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('date_read', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching books:', error)
    throw new Error('Failed to fetch books')
  }

  return (data || []).map(row => mapDbToBook(row as DbBookRow))
}

/**
 * Get a single book by ID
 */
export async function getBook(bookId: string, userId: string): Promise<Book | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    console.error('Error fetching book:', error)
    throw new Error('Failed to fetch book')
  }

  return mapDbToBook(data as DbBookRow)
}

/**
 * Create a new book
 */
export async function createBook(
  userId: string,
  book: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Book> {
  const supabase = await createClient()

  const dbBook = {
    user_id: userId,
    ...mapBookToDb(book),
  }

  const { data, error } = await supabase
    .from('books')
    .insert(dbBook)
    .select()
    .single()

  if (error) {
    console.error('Error creating book:', error)
    throw new Error('Failed to create book')
  }

  return mapDbToBook(data as DbBookRow)
}

/**
 * Update a book
 */
export async function updateBook(
  bookId: string,
  userId: string,
  updates: Partial<Book>
): Promise<Book> {
  const supabase = await createClient()

  const dbUpdates = mapBookToDb(updates)

  const { data, error } = await supabase
    .from('books')
    .update(dbUpdates)
    .eq('id', bookId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating book:', error)
    throw new Error('Failed to update book')
  }

  return mapDbToBook(data as DbBookRow)
}

/**
 * Delete a book
 */
export async function deleteBook(bookId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting book:', error)
    throw new Error('Failed to delete book')
  }
}

/**
 * Get books count for a user
 */
export async function getBooksCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting books:', error)
    return 0
  }

  return count || 0
}
