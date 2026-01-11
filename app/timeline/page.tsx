export default function TimelinePage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Timeline</h1>
      
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">
            All
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            Symptoms
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            Food
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Timeline entries will appear here. Scroll to see your history.
          </p>
        </div>
      </div>
    </div>
  );
}

