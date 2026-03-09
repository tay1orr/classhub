import BoardPage from '@/components/BoardPage'

export default function FreePage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1')
  return <BoardPage boardKey="FREE" title="자유게시판" color="blue" emoji="💬" page={page} />
}
