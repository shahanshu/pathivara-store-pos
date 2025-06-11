'use client';

// A simple Tailwind CSS spinner
const LoadingSpinner = ({ size = 'md', color = 'text-indigo-600' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClasses[size]} ${color}`}
         style={{ borderTopColor: 'transparent' }} // Ensure the top border is transparent for the spin effect
         role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;