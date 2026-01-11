export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Appearance</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <label className="flex items-center justify-between">
              <span>Dark Mode</span>
              <input type="checkbox" className="toggle" />
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Data</h2>
          <div className="space-y-2">
            <button className="w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700">
              Export Data for Doctor
            </button>
            <button className="w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700">
              Delete All Data
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">About</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Digestive Diary v0.1.0
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              A non-judgmental tracking app for digestive disorders.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Disclaimer</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              This app is for logging purposes only and does not provide medical advice. 
              Always consult with a healthcare professional for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

