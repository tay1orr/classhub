import BoardPage from '@/components/BoardPage'

export default function SuggestionPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1')
  return <BoardPage boardKey="SUGGESTION" title="건의사항" color="purple" emoji="💡" writeLabel="건의하기" page={page} />
}
