import { Books } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components'
import { BooksClient } from '@/components/books-client'
import { loadBooks } from '@/lib/books-loader'

export const revalidate = 3600

export default async function BooksPage() {
  const books = await loadBooks()

  const totalBooks = books.length
  const booksRead = books.filter(b => b.dateRead?.trim()).length

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Lecture"
        subtitle="Bibliothèque personnelle · notes et auteurs"
        eyebrow="Bibliothèque"
        dateline={`${booksRead.toLocaleString('fr-FR')} lus · ${totalBooks.toLocaleString('fr-FR')} au total`}
        color="indigo"
        icon={Books}
      />

      <BooksClient books={books} />
    </div>
  )
}
