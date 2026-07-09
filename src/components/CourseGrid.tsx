"use client";

import React from 'react';

export default function AdaptiveCourseGrid({ courses }: { courses: any[] }) {
  return (
    <div className="w-full px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {courses.map((course) => (
          <div key={course.id} className="flex flex-col bg-slate-900 border border-[#3DBFF2]/20 rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95">
            <div className="relative aspect-video w-full bg-black">
              <img src={course.image || '/fallback.png'} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-grow p-4 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2">{course.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-3">{course.description}</p>
              <div className="pt-2 mt-auto">
                <span className="text-sm font-semibold text-[#3DBFF2]">{course.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
