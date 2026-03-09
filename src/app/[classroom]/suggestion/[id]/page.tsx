import PostDetailServer from '@/components/PostDetailServer'

export default function SuggestionPostPage({ params }: { params: { id: string } }) {
  return <PostDetailServer postId={params.id} boardLabel="건의사항" boardColor="purple" />
}
