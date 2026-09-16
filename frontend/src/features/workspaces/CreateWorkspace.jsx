import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle,
  Bell,
  ShoppingCart,
  LayoutGrid,
  Rocket,
  BarChart3,
  Heart,
  Gamepad2,
  Briefcase,
  GraduationCap,
  MoreHorizontal,
  ChevronDown,
  Upload,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  MessageSquare,
  Lightbulb,
  FileText,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { getCurrentUser, getStoredWorkspaces, setStoredWorkspaces, setActiveWorkspaceId } from '../../utils/workspaceAccess';
import { workspaceApi } from '../../api/client';

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Form State
  const [workspaceName, setWorkspaceName] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('(GMT+05:30) Asia/Kolkata');
  const [currency, setCurrency] = useState('INR (₹) - Indian Rupee');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const iconsList = [
    { id: 'ShoppingCart', icon: ShoppingCart },
    { id: 'LayoutGrid', icon: LayoutGrid },
    { id: 'Rocket', icon: Rocket },
    { id: 'BarChart3', icon: BarChart3 },
    { id: 'Heart', icon: Heart },
    { id: 'Gamepad2', icon: Gamepad2 },
    { id: 'Briefcase', icon: Briefcase },
    { id: 'GraduationCap', icon: GraduationCap },
    { id: 'MoreHorizontal', icon: MoreHorizontal },
  ];

  const additionalDocCards = [
    { id: 'ird', title: 'Initial Requirement Document (IRD)', desc: 'Upload PRD, BRD or SRS', formats: 'PDF, DOCX, PPTX (Max 20MB)' },
    { id: 'brief', title: 'Product Brief / Overview', desc: 'High level overview of the product', formats: 'PDF, DOCX, PPTX (Max 20MB)' },
    { id: 'market', title: 'Market Research', desc: 'Market analysis, competitors, trends', formats: 'PDF, DOCX, PPTX (Max 20MB)' },
    { id: 'personas', title: 'Target Users / Personas', desc: 'User personas, JTBD, user stories', formats: 'PDF, DOCX, PPTX (Max 20MB)' },
    { id: 'goals', title: 'Business Goals & KPIs', desc: 'Goals, success metrics, KPIs', formats: 'PDF, DOCX, PPTX (Max 20MB)' },
    { id: 'roadmap', title: 'Product Roadmap (Draft)', desc: 'Existing roadmap or planning doc', formats: 'PDF, DOCX, PPTX, XLSX (Max 20MB)' },
    { id: 'design', title: 'Design / Wireframes (Optional)', desc: 'UI/UX mockups, wireframes', formats: 'PDF, PNG, JPG, Figma (Max 20MB)' },
    { id: 'other', title: 'Other Documents (Optional)', desc: 'Any other relevant documents', formats: 'Any File (Max 20MB)' },
  ];

  const handleDocUploadSimulate = (docId) => {
    setUploadedDocs((prev) => ({
      ...prev,
      [docId]: true,
    }));
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setErrorMessage('Please enter a workspace name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: workspaceName.trim(),
        description: description.trim(),
        product_name: productName.trim() || workspaceName.trim(),
        industry: industry || 'E-Commerce & Retail',
        timezone,
        currency,
        icon: selectedIcon,
      };

      const createdBackendWs = await workspaceApi.createWorkspace(payload);

      const generatedId = createdBackendWs?.id 
        ? String(createdBackendWs.id) 
        : workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

      const newWorkspaceItem = {
        id: generatedId,
        name: workspaceName.trim(),
        productName: productName.trim() || workspaceName.trim(),
        status: 'Active',
        description: description.trim() || `Central workspace for analyzing ${productName || workspaceName} customer feedback and building better products.`,
        ownerEmail: currentUser.email || 'pm@demo.com',
        ownerName: currentUser.name || 'Priya Sharma',
        createdAt: 'Just now',
        membersCount: 1,
        icon: selectedIcon,
        industry: industry || 'E-Commerce & Retail',
        timezone,
        currency,
        members: [
          {
            id: 'm_owner',
            name: currentUser.name || 'Priya Sharma',
            email: currentUser.email || 'pm@demo.com',
            role: 'Owner',
            roleTitle: currentUser.roleTitle || 'Product Manager (Owner)',
            avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            initials: 'PS',
            isCurrentUser: true,
          }
        ],
        stats: {
          totalFeedback: '0',
          feedbackGrowth: '0%',
          totalFeatures: '0',
          featuresGrowth: '0%',
          insightsGenerated: '0',
          insightsGrowth: '0%',
          activeMembers: '1',
          membersGrowth: '0%',
          dataSources: '1',
          dataSourcesGrowth: 'new'
        },
        dataSources: [
          { id: `ds_${Date.now()}`, name: 'Customer Inquiries', count: '0', icon: 'MessageSquare', color: 'text-blue-400 bg-blue-500/10' }
        ],
        recentActivity: [
          {
            id: `act_${Date.now()}`,
            activity: `Workspace "${workspaceName}" created`,
            user: currentUser.name || 'Priya Sharma',
            avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            module: 'Workspace',
            moduleColor: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
            time: 'Just now',
            icon: 'Layers'
          }
        ],
        storageUsage: {
          usedGb: '0.1',
          totalGb: '10',
          percentage: 1
        }
      };

      const existing = getStoredWorkspaces();
      setStoredWorkspaces([newWorkspaceItem, ...existing]);
      setActiveWorkspaceId(generatedId);

      // Redirect to workspaces list with the newly active workspace
      navigate(`/workspace/${generatedId}/overview`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create workspace.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans relative bg-[#070910] text-slate-100">
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 bg-[radial-gradient(#1a2236_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Sidebar */}
      <Sidebar isDark={true} />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative bg-[#070910]">
        
        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 scrollbar-hide">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
            
            {/* Left: Breadcrumbs & Titles */}
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
                <Link to="/workspaces" className="hover:text-white transition-colors">
                  Workspaces
                </Link>
                <span className="text-slate-600">&gt;</span>
                <span className="text-slate-300">Create New Workspace</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Create New Workspace
              </h1>
              <p className="text-xs lg:text-sm text-slate-400 mt-1">
                Set up a new workspace to analyze feedback and build better products.
              </p>
            </div>

            {/* Right: Controls & Profile */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <button 
                type="button" 
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Help"
              >
                <HelpCircle size={18} />
              </button>
              
              <button 
                type="button" 
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  8
                </span>
              </button>

              <div className="flex items-center gap-2.5 p-1 rounded-xl">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                  alt="Priya Sharma"
                  className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-xs font-bold text-white leading-tight truncate">{currentUser.name || 'Priya Sharma'}</p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate">{currentUser.roleTitle || 'Product Manager'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Form and Right Rail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pb-12">
            
            {/* ================= LEFT / MAIN FORM (8 cols) ================= */}
            <div className="lg:col-span-8">
              <form onSubmit={handleCreateWorkspace} className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-6 sm:p-8 space-y-6">
                
                {/* Section Header */}
                <div>
                  <h2 className="text-base font-bold text-white">Workspace Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Provide basic information about your workspace.</p>
                </div>

                {/* Workspace Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Workspace Name <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">{workspaceName.length}/50</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                    className="w-full bg-[#080b13] border border-[#1d263b] focus:border-[#5b3df5] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">This will be the name of your workspace.</p>
                </div>

                {/* Product / Project Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Product / Project Name <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">{productName.length}/100</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product or project name"
                    className="w-full bg-[#080b13] border border-[#1d263b] focus:border-[#5b3df5] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">The product or project you'll be working on.</p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Description</label>
                    <span className="text-[11px] text-slate-500">{description.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the goal of this workspace, what product you are building, and key objectives."
                    className="w-full bg-[#080b13] border border-[#1d263b] focus:border-[#5b3df5] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 resize-none transition-colors"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Industry (Optional)</label>
                  <div className="relative">
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-[#080b13] border border-[#1d263b] focus:border-[#5b3df5] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#0e1424] text-slate-400">Select industry</option>
                      <option value="E-Commerce & Retail" className="bg-[#0e1424]">E-Commerce & Retail</option>
                      <option value="FinTech & Banking" className="bg-[#0e1424]">FinTech & Banking</option>
                      <option value="SaaS & Cloud Software" className="bg-[#0e1424]">SaaS & Cloud Software</option>
                      <option value="Healthcare & Life Sciences" className="bg-[#0e1424]">Healthcare & Life Sciences</option>
                      <option value="EdTech & Education" className="bg-[#0e1424]">EdTech & Education</option>
                      <option value="Media & Entertainment" className="bg-[#0e1424]">Media & Entertainment</option>
                      <option value="Other" className="bg-[#0e1424]">Other</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Two-Column: Default Timezone & Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Default Timezone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Default Timezone</label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-[#080b13] border border-[#1d263b] focus:border-[#5b3df5] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors appearance-none cursor-pointer"
                      >
                        <option value="(GMT+05:30) Asia/Kolkata" className="bg-[#0e1424]">(GMT+05:30) Asia/Kolkata</option>
                        <option value="(GMT-08:00) America/Los_Angeles" className="bg-[#0e1424]">(GMT-08:00) America/Los_Angeles</option>
                        <option value="(GMT-05:00) America/New_York" className="bg-[#0e1424]">(GMT-05:00) America/New_York</option>
                        <option value="(GMT+00:00) Europe/London" className="bg-[#0e1424]">(GMT+00:00) Europe/London</option>
                        <option value="(GMT+08:00) Asia/Singapore" className="bg-[#0e1424]">(GMT+08:00) Asia/Singapore</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Currency (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Currency (Optional)</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-[#080b13] border border-[#1d263b] focus:border-[#5b3df5] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white transition-colors appearance-none cursor-pointer"
                      >
                        <option value="INR (₹) - Indian Rupee" className="bg-[#0e1424]">INR (₹) - Indian Rupee</option>
                        <option value="USD ($) - US Dollar" className="bg-[#0e1424]">USD ($) - US Dollar</option>
                        <option value="EUR (€) - Euro" className="bg-[#0e1424]">EUR (€) - Euro</option>
                        <option value="GBP (£) - British Pound" className="bg-[#0e1424]">GBP (£) - British Pound</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                </div>

                {/* Workspace Icon Selector */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-slate-300">Workspace Icon</label>
                    <p className="text-[11px] text-slate-500">Choose an icon that represents your workspace.</p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap pt-1">
                    {iconsList.map(({ id, icon: IconComponent }) => {
                      const isSelected = selectedIcon === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedIcon(id)}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/40 ring-2 ring-[#5b3df5]/40'
                              : 'bg-[#0e1424] border border-[#1e2840] text-slate-400 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          <IconComponent size={18} />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-[#5b3df5] rounded-full flex items-center justify-center text-[9px] font-bold">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Additional Settings */}
                <div className="border-t border-[#171f33] pt-5">
                  <button
                    type="button"
                    onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
                    className="flex items-center justify-between w-full text-left py-1 text-xs font-bold text-[#8b5cf6] hover:text-[#a78bfa] transition-colors cursor-pointer"
                  >
                    <span>Additional Settings (Optional)</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isAdditionalOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Add initial documents and information to give AI a head start on understanding your project.
                  </p>

                  {isAdditionalOpen && (
                    <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                      
                      {/* 8 Document Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {additionalDocCards.map((doc) => {
                          const isUploaded = uploadedDocs[doc.id];
                          return (
                            <div
                              key={doc.id}
                              className="bg-[#080b13] border border-[#1c263c] rounded-xl p-3 flex flex-col justify-between hover:border-[#2b3a5c] transition-all"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <FileText size={13} className="text-[#8b5cf6]" />
                                  <h4 className="text-[11px] font-bold text-white truncate leading-tight" title={doc.title}>
                                    {doc.title}
                                  </h4>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                                  {doc.desc}
                                </p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-[#141b2a]">
                                <button
                                  type="button"
                                  onClick={() => handleDocUploadSimulate(doc.id)}
                                  className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isUploaded
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-[#121828] text-slate-300 hover:text-white border border-[#212c45]'
                                  }`}
                                >
                                  {isUploaded ? (
                                    <>
                                      <Check size={11} />
                                      <span>Uploaded</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={11} />
                                      <span>Upload File</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-[9px] text-slate-500 block text-center mt-1 truncate">
                                  {doc.formats}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Privacy Assurance Banner */}
                      <div className="p-3 rounded-xl bg-[#5b3df5]/10 border border-[#5b3df5]/20 flex items-center gap-2.5 text-xs text-[#a78bfa]">
                        <ShieldCheck size={16} className="shrink-0 text-[#8b5cf6]" />
                        <span className="text-[11px]">
                          Your documents are private and secure. Only workspace members will be able to access them.
                        </span>
                      </div>

                    </div>
                  )}
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#171f33]">
                  <Link
                    to="/workspaces"
                    className="px-5 py-2.5 rounded-xl border border-[#202a42] text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#5b3df5] hover:bg-[#6c4ef7] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#5b3df5]/30 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Workspace</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>


            {/* ================= RIGHT RAIL (4 cols) ================= */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Illustrated Visual Card */}
              <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5b3df5]/15 blur-2xl pointer-events-none" />
                
                <div className="w-full max-w-[260px] py-4">
                  <div className="relative rounded-2xl bg-gradient-to-br from-[#121829] to-[#0a0e1a] border border-[#202a42] p-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#1b253b] pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#5b3df5] flex items-center justify-center text-white">
                          <ShoppingCart size={12} />
                        </div>
                        <span className="text-[11px] font-bold text-white">New Workspace</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>

                    <div className="space-y-2">
                      <div className="h-1.5 w-3/4 bg-slate-700/50 rounded-full" />
                      <div className="h-1.5 w-1/2 bg-slate-700/30 rounded-full" />
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#5b3df5] text-[8px] font-bold flex items-center justify-center text-white border border-[#0d121f]">PS</div>
                          <div className="w-5 h-5 rounded-full bg-[#06b6d4] text-[8px] font-bold flex items-center justify-center text-white border border-[#0d121f]">AM</div>
                          <div className="w-5 h-5 rounded-full bg-[#10b981] text-[8px] font-bold flex items-center justify-center text-white border border-[#0d121f]">NK</div>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">+18.6%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What you get with a workspace? Card */}
              <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">
                  What you get with a workspace?
                </h3>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#5b3df5]/15 border border-[#5b3df5]/30 flex items-center justify-center text-[#a78bfa] shrink-0 mt-0.5">
                      <Users size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Centralized Collaboration</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Invite your team and collaborate in one central place.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <MessageSquare size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Unified Feedback</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Collect feedback from multiple sources and analyze in real-time.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Lightbulb size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">AI-Powered Insights</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Get AI-driven insights to make better product decisions.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <FileText size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">End-to-End Product Management</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        From feedback to features, prioritization, roadmap and PRDs.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Enterprise Ready</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Secure, scalable and built for product teams of all sizes.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Bottom Customization Callout */}
              <div className="bg-[#0b0f19] border border-[#171f33] rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5b3df5]/10 border border-[#5b3df5]/25 flex items-center justify-center text-[#8b5cf6] shrink-0">
                  <Lock size={15} />
                </div>
                <p className="text-[11px] text-slate-400">
                  You can customize workspace settings and invite members after creation.
                </p>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}