import { AdvancedExample } from "./examples";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center">
          <AdvancedExample />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center text-sm text-slate-600">
            <p>Built with React, TypeScript, and Tailwind CSS</p>
            <p className="mt-1">
              Use your microphone or the demo audio to see the visualizers in
              action
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
