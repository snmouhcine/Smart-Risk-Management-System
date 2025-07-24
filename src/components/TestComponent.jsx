import React from 'react';
import { Calculator } from 'lucide-react';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Money Management Test
            </h1>
          </div>
          <p className="text-slate-600">
            Tailwind CSS is working properly! The application is set up correctly.
          </p>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;