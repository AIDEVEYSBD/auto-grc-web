"use client";

const Loader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="flex flex-col items-center justify-center">
        <img
          src="/AutoGRC.png"
          alt="Loading..."
          className="w-24 h-24 animate-pulse mb-6"
        />
        <span className="text-lg text-gray-600 dark:text-gray-300">
          Loading application details...
        </span>
      </div>
    </div>
  );
};

export default Loader;
