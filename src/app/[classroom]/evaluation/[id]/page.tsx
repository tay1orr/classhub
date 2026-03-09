import PostDetailServer from '@/components/PostDetailServer'

export default function EvaluationPostPage({ params }: { params: { id: string } }) {
  return <PostDetailServer postId={params.id} boardLabel="수행/지필평가" boardColor="green" />
}
