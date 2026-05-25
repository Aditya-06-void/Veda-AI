"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AssignmentEmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="relative flex min-h-[640px] flex-col items-center justify-center overflow-hidden px-4 text-center md:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(241,241,241,0.6)_35%,_transparent_72%)]" />
      <div className="relative mb-8">
        <div className="absolute inset-0 scale-125 rounded-full bg-[#ececec] blur-2xl" />
        <div className="relative flex size-44 items-center justify-center rounded-full bg-white/60 md:size-52">
          <div className="relative flex h-38 w-32 items-center justify-center rounded-[24px] bg-white shadow-xl">
            <div className="absolute top-5 left-4 h-2.5 w-12 rounded-full bg-[#0d2233]" />
            <div className="absolute top-14 left-4 h-2 w-14 rounded-full bg-[#d7d7d7]" />
            <div className="absolute top-20 left-4 h-2 w-14 rounded-full bg-[#d7d7d7]" />
            <div className="absolute top-26 left-4 h-2 w-14 rounded-full bg-[#d7d7d7]" />
          </div>
          <div className="absolute right-6 bottom-7 flex size-30 items-center justify-center rounded-full border-[8px] border-[#d3cce6] bg-white shadow-lg">
            <div className="relative size-12">
              <span className="absolute top-1/2 left-1/2 h-3 w-12 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-[#ff4747]" />
              <span className="absolute top-1/2 left-1/2 h-3 w-12 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-[#ff4747]" />
            </div>
          </div>
          <div className="absolute top-7 -right-1 h-10 w-14 rounded-2xl bg-white shadow-md" />
          <div className="absolute top-10 right-2 h-3 w-3 rounded-full bg-[#c9c4db]" />
          <div className="absolute top-10 right-6 h-3 w-8 rounded-full bg-[#d7d7d7]" />
          <div className="absolute right-0 bottom-16 size-3 rounded-full bg-[#4181b8]" />
          <div className="absolute left-0 bottom-6 text-4xl text-[#4181b8]">✧</div>
        </div>
      </div>

      <h2 className="relative text-[36px] font-extrabold tracking-[-0.04em] text-[#2d2d2d] md:text-[42px]">
        No assignments yet
      </h2>
      <p className="relative mt-3 max-w-2xl text-base leading-8 text-[#7c7c7c] md:text-lg">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>
      <Button className="relative mt-8 h-14 px-8 text-base" onClick={onCreate}>
        <Plus className="size-5" />
        Create Your First Assignment
      </Button>
    </div>
  );
}
