export default function InsightsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Insights</h1>
      
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Insights appear after you&apos;ve logged enough data. These are pattern observations only and do not constitute medical advice.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep logging your food and symptoms to see patterns and insights here.
          </p>
        </div>
      </div>
    </div>
  );
}

