import PostDetailServer from '@/components/PostDetailServer'

export default function MemoryPostPage({ params }: { params: { id: string } }) {
  return <PostDetailServer postId={params.id} boardLabel="우리반 추억" boardColor="pink" />
}
