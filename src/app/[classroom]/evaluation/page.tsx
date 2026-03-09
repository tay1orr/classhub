import BoardPage from '@/components/BoardPage'

export default function EvaluationPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1')
  return <BoardPage boardKey="EVALUATION" title="수행/지필평가" color="green" emoji="📝" writeLabel="정보 공유" page={page} />
}
