export default function ExperimentsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Experiments</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Current Experiment</h2>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active experiment. Start one to track how diet changes affect your symptoms.
          </p>
        </div>
        <button className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg">
          Start Experiment
        </button>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Past Experiments</h2>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Past experiments will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

