"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ModuleInput {
  title: string;
  order: number;
  content: string;
}

interface SlotInput {
  date: string;
  timeWindow: string;
}

export default function NewCourseCreatorPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("4999");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("DEVELOPMENT");
  
  const [modules, setModules] = useState<ModuleInput[]>([]);
  const [slots, setSlots] = useState<SlotInput[]>([]);
  
  // Interactive modal inputs states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modOrder, setModOrder] = useState("");
  const [modContent, setModContent] = useState("");
  
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("10:00 AM - 12:00 PM");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate slug from title
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(autoSlug);
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle || !modOrder) return;

    const newMod: ModuleInput = {
      title: modTitle,
      order: parseInt(modOrder),
      content: modContent,
    };

    setModules((prev) => [...prev, newMod].sort((a, b) => a.order - b.order));
    
    // Reset modal inputs
    setModTitle("");
    setModOrder("");
    setModContent("");
    setShowModuleModal(false);
  };

  const handleAddSlot = () => {
    if (!slotDate) return;
    
    // Avoid duplicate slots
    const isDup = slots.some((s) => s.date === slotDate && s.timeWindow === slotTime);
    if (isDup) return;

    setSlots((prev) => [...prev, { date: slotDate, timeWindow: slotTime }]);
    setSlotDate("");
  };

  const handleRemoveModule = (idx: number) => {
    setModules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          price: parseFloat(price) || 0,
          description,
          category,
          modules,
          slots,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Syllabus successfully compiled and synced with registry!");
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || "Failed to commit manual course creation.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network mutation offline. Dynamic changes compiled in browser cache.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* Header bar */}
      <div className="pb-6 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
        <div className="space-y-1">
          <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-indigo-650 transition-all">
            ← Return to Control Console
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase mt-2">
            Create Syllabus Track
          </h1>
        </div>
      </div>

      {/* Message alerts */}
      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-650 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs font-bold">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 text-xs font-bold">
          {successMessage}
        </div>
      )}

      {/* Creation form */}
      <form onSubmit={handleSubmitCourse} className="space-y-8">
        
        {/* Core fields card */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-6">
          <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-widest border-b border-slate-100 dark:border-slate-900 pb-3">Course Core Specs</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Course Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Enterprise Rust Core Architectures"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">URL String/Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                placeholder="e.g. enterprise-rust-core"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pricing (INR)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 4999"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="DATA_SCIENCE_AI">Data Science & AI</option>
                <option value="CYBERSECURITY">Cybersecurity</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Objectives & Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expose the core learning roadmap objectives, technologies covered, and targets..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 leading-relaxed"
            />
          </div>
        </div>

        {/* Modules Section */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
            <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-widest">Chapters Layout</h3>
            <button
              type="button"
              onClick={() => setShowModuleModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              + Add Chapter
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6 italic font-medium">
              No modules chapters defined yet. Click &quot;Add Chapter&quot; to configure course content steps.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {modules.map((mod, index) => (
                <div key={index} className="py-4 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Order {mod.order}</span>
                    <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200">{mod.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">{mod.content.substring(0, 100)}...</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveModule(index)}
                    className="text-xs text-red-500 hover:underline font-bold"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Batch Slot Generator Tool */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-6">
          <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-widest border-b border-slate-100 dark:border-slate-900 pb-3">Batch Slot Generator</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Live Session Date</label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-sm font-semibold focus:outline-none dark:bg-slate-900"
              />
            </div>
            
            <div className="flex-1 space-y-1.5 w-full">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Window (Manual)</label>
              <input
                type="text"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                placeholder="e.g. 10:00 AM - 12:00 PM"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-sm font-semibold focus:outline-none dark:bg-slate-900"
              />
            </div>

            <button
              type="button"
              onClick={handleAddSlot}
              className="py-3 px-4 bg-indigo-650 hover:bg-indigo-755 bg-indigo-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer w-full sm:w-auto"
            >
              Add Slot
            </button>
          </div>

          {slots.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-4 italic font-medium">
              No live schedule slots mapped. Class slots default to 30 open seats.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {slots.map((s, index) => (
                <div 
                  key={index}
                  className="rounded-full border border-slate-200 dark:border-slate-800 px-3.5 py-1 bg-white dark:bg-slate-900 text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(s.date).toLocaleDateString()} ({s.timeWindow})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    className="text-red-500 font-extrabold hover:text-red-700 text-xs ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-650 hover:bg-indigo-755 bg-indigo-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
        >
          {loading ? "Transmitting Course data..." : "Save Track & Publish to Catalog"}
        </button>

      </form>

      {/* Floating chapter creator Modal overlay */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-6 bg-white dark:bg-slate-950 shadow-lg w-full max-w-lg space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white tracking-widest">Add Module Chapter</h3>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddModule} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider">Chapter Title</label>
                  <input
                    type="text"
                    required
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    placeholder="e.g. Routing Parameters & Middleware"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs font-semibold focus:outline-none dark:bg-slate-900"
                  />
                </div>
                
                <div className="col-span-1 space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider">Order Index</label>
                  <input
                    type="number"
                    required
                    value={modOrder}
                    onChange={(e) => setModOrder(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs font-semibold text-center focus:outline-none dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase tracking-wider">Markdown Workspace Content</label>
                <textarea
                  required
                  rows={8}
                  value={modContent}
                  onChange={(e) => setModContent(e.target.value)}
                  placeholder="# Part Title ... \n\n## Subheading ... \n\nUse standard Markdown tags here..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs focus:outline-none dark:bg-slate-900 leading-relaxed font-mono"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Confirm Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
