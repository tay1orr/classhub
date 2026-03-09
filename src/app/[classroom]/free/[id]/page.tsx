import PostDetailServer from '@/components/PostDetailServer'

export default function FreePostPage({ params }: { params: { id: string } }) {
  return <PostDetailServer postId={params.id} boardLabel="자유게시판" boardColor="blue" />
}
