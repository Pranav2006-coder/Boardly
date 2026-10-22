/**
 * BoardCardSkeleton — shimmer placeholder for loading state
 * Matches the BoardCard layout exactly.
 */
export default function BoardCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD8] flex flex-col animate-fade-in-up">
      {/* Thumbnail placeholder */}
      <div className="h-44 skeleton" />
      {/* Meta placeholder */}
      <div className="p-4 flex flex-col gap-3">
        <div className="skeleton h-4 w-3/5 rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD8] mt-1">
          <div className="flex -space-x-1.5">
            <div className="skeleton w-6 h-6 rounded-full" />
            <div className="skeleton w-6 h-6 rounded-full" />
          </div>
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
