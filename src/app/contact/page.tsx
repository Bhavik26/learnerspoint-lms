"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Query");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-slate-900 dark:text-slate-100 font-sans animate-fade-in space-y-10">
      
      {/* Header section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-white">Contact Our Team</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
          Have questions about fees, customized corporate training batches, or placement tie-ups? Drop us a query.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Contact Information (2 columns) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Institutional Details</h3>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-3">
                <span className="text-primary text-base">📍</span>
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200 font-bold">Office Address</strong>
                  <span className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 block">
                    Keen Infotech Systems,<br />
                    Sector 11, Udaipur,<br />
                    Rajasthan, India
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-primary text-base">📞</span>
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200 font-bold">Admissions Hotline</strong>
                  <span className="text-slate-505 text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 block">
                    +91 94142-34321<br />
                    +91 0294-248999
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-primary text-base">✉</span>
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200 font-bold">Academic Support</strong>
                  <span className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 block">
                    support@keeninfotech.com<br />
                    info@learnerspoint.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/20 text-center space-y-2 text-xs">
            <strong className="block text-slate-800 dark:text-slate-200 font-bold">Looking for Callback?</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Submit the query form on the right. Our support team calls back students within 15 minutes.
            </p>
          </div>
        </div>

        {/* Right Side: Contact / Query Form (3 columns) */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 shadow-sm space-y-6">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-900 pb-2">
              Query Submission Form
            </h3>

            {submitted ? (
              <div className="p-8 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 text-center space-y-2">
                <span className="text-2xl block">✓</span>
                <strong className="block text-sm">Query Submitted Successfully!</strong>
                <p className="text-xs font-semibold max-w-sm mx-auto leading-relaxed">
                  Thank you, {name}. A ticket has been registered for {email}. One of our senior counselors will call you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer hover:opacity-90"
                >
                  Submit Another Query
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Your Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 99999-99999"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@gmail.com"
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 focus:outline-none"
                    >
                      <option value="General Query">General</option>
                      <option value="Fee Details">Fee Inquiry</option>
                      <option value="Batch Schedule">Batch Timings</option>
                      <option value="Placements Help">Placements</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Message Details</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your learning requirements or questions in detail..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 leading-normal font-medium focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Send Inquiry Message
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
