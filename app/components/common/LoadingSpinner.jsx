'use client';

import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'indigo' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // Color classes
  const colorClasses = {
    indigo: 'border-indigo-500 border-t-indigo-300',
    slate: 'border-slate-500 border-t-slate-300',
    emerald: 'border-emerald-500 border-t-emerald-300',
    rose: 'border-rose-500 border-t-rose-300',
    amber: 'border-amber-500 border-t-amber-300',
    white: 'border-white border-t-white/50'
  };

  // Animation delay classes for dual spinner effect
  const animationDelays = {
    sm: 'animation-delay-100',
    md: 'animation-delay-150',
    lg: 'animation-delay-200',
    xl: 'animation-delay-250'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
    
      <div 
        className={`absolute inset-0 rounded-full border-2 ${colorClasses[color]} animate-spin`}
        style={{ 
          borderTopColor: 'transparent',
          animationDuration: '1s'
        }}
      />
      

      <div 
        className={`absolute inset-1 rounded-full border-2 ${colorClasses[color]} animate-spin ${animationDelays[size]}`}
        style={{ 
          borderBottomColor: 'transparent',
          animationDuration: '1.5s'
        }}
      />
      

      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;