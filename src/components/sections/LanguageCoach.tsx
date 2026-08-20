import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Languages, Plus, BookOpen, CheckCircle, Trash2, Globe, Volume2, ArrowRight, RotateCw, X, Award, Paperclip, FileText, Download } from 'lucide-react';

export default function LanguageCoach() {
  const { effectiveRole, profile } = useAuth();
  const isCreator = effectiveRole === 'teacher' || effectiveRole === 'corporate_admin';

  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('All');

  // Form states for creating a module
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState('A1');
  const [description, setDescription] = useState('');
  const [flashcards, setFlashcards] = useState<{ term: string; translation: string; example_sentence: string }[]>([
    { term: '', translation: '', example_sentence: '' }
  ]);
  
  // File Attachment State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Practice Session Modal State
  const [activePracticeModule, setActivePracticeModule] = useState<any | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  async function fetchModules() {
    const { data, error } = await supabase
      .from('language_modules')
      .select('*, language_flashcards(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setModules(data);
    }
    setLoading(false);
  }

  const handleAddFlashcardRow = () => {
    setFlashcards([...flashcards, { term: '', translation: '', example_sentence: '' }]);
  };

  const handleFlashcardChange = (index: number, field: string, value: string) => {
    const updated = [...flashcards];
    updated[index][field as keyof typeof updated[0]] = value;
    setFlashcards(updated);
  };

  const handleRemoveFlashcardRow = (index: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setSuccessMsg('');

    let fileUrl = null;

    // 1. Upload Attachment File to Supabase Storage if provided
    if (attachmentFile) {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `module-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, attachmentFile);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(filePath);
        fileUrl = publicUrlData.publicUrl;
      } else {
        console.warn('File upload warning (proceeding without file):', uploadError.message);
      }
    }

    // 2. Insert Module
    const { data: modData, error: modError } = await supabase
      .from('language_modules')
      .insert({
        title,
        language,
        level,
        description,
        attachment_url: fileUrl,
        created_by: profile.id,
        is_published: true
      })
      .select()
      .single();

    if (modError || !modData) {
      alert('Error creating module: ' + modError?.message);
      setSubmitting(false);
      return;
    }

    // 3. Insert Associated Flashcards
    const validCards = flashcards.filter(f => f.term.trim() && f.translation.trim()).map(f => ({
      module_id: modData.id,
      term: f.term,
      translation: f.translation,
      example_sentence: f.example_sentence
    }));

    if (validCards.length > 0) {
      const { error: cardError } = await supabase
        .from('language_flashcards')
        .insert(validCards);

      if (cardError) {
        alert('Module created, but error adding flashcards: ' + cardError.message);
      }
    }

    setSubmitting(false);
    setSuccessMsg('Language module, flashcards, and attachments published successfully!');
    setTitle('');
    setDescription('');
    setAttachmentFile(null);
    setFlashcards([{ term: '', translation: '', example_sentence: '' }]);
    fetchModules();
  };

  const speakText = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const codeMap: Record<string, string> = {
      Spanish: 'es-ES',
      German: 'de-DE',
      Italian: 'it-IT',
      French: 'fr-FR',
      Swahili: 'sw-KE',
      Mandarin: 'zh-CN'
    };
    utterance.lang = codeMap[langCode] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const filteredModules = selectedLanguageFilter === 'All' 
    ? modules 
    : modules.filter(m => m.language === selectedLanguageFilter);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-rose-600 to-slate-900 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Languages className="w-8 h-8 text-rose-300" />
            <h2 className="text-2xl font-bold">AI Language Coach & Hub</h2>
          </div>
          <p className="text-rose-100/80 max-w-xl">
            Master world languages with community-driven flashcard modules, downloadable study sheets, and audio practice.
          </p>
        </div>
      </div>

      {/* Creator Panel (Teachers & Admins Only) */}
      {isCreator && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-600" />
            Create Custom Language Module
          </h3>

          {successMsg && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleCreateModule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Essential Travel Phrases"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="French">French</option>
                  <option value="Swahili">Swahili</option>
                  <option value="Mandarin">Mandarin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">CEFR Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="A1">A1 (Beginner)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Upper Intermediate)</option>
                  <option value="C1">C1 (Advanced)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of what learners will master..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* File Attachment Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Attach Study Material (PDF, Doc, or Sheet)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200">
                  <Paperclip className="w-4 h-4 text-rose-600" />
                  {attachmentFile ? 'Change File' : 'Choose Document'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachmentFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {attachmentFile ? (
                  <span className="text-xs text-slate-600 flex items-center gap-1 font-medium bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                    <FileText className="w-3.5 h-3.5 text-rose-600" /> {attachmentFile.name}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Optional file for download</span>
                )}
              </div>
            </div>

            {/* Flashcards Builder Sub-section */}
            <div className="border-t border-slate-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-800 text-sm">Add Vocabulary Flashcards</h4>
                <button
                  type="button"
                  onClick={handleAddFlashcardRow}
                  className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-medium px-3 py-1.5 rounded-lg transition-all"
                >
                  + Add Term
                </button>
              </div>

              <div className="space-y-3">
                {flashcards.map((card, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Term / Phrase (e.g., Hola)"
                      value={card.term}
                      onChange={(e) => handleFlashcardChange(index, 'term', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Translation (e.g., Hello)"
                      value={card.translation}
                      onChange={(e) => handleFlashcardChange(index, 'translation', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Example sentence"
                      value={card.example_sentence}
                      onChange={(e) => handleFlashcardChange(index, 'example_sentence', e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hidden md:block"
                    />
                    {flashcards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFlashcardRow(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-xl transition-all text-sm shadow-sm"
            >
              {submitting ? 'Publishing Module...' : 'Publish Module & Flashcards'}
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-600" />
          Published Language Modules
        </h3>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Spanish', 'German', 'Italian', 'French', 'Swahili', 'Mandarin'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguageFilter(lang)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedLanguageFilter === lang
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading language modules...</div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No language modules found</p>
          <p className="text-sm text-slate-400 mt-1">Try switching categories or create a new module above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">
                    <Globe className="w-3 h-3" />
                    {mod.language} ({mod.level})
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {mod.language_flashcards?.length || 0} terms
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{mod.title}</h4>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{mod.description || 'No description provided.'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                {mod.attachment_url ? (
                  <a
                    href={mod.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Study Sheet
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Community Module</span>
                )}
                
                <button
                  onClick={() => {
                    setActivePracticeModule(mod);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setPracticeCompleted(false);
                  }}
                  disabled={!mod.language_flashcards || mod.language_flashcards.length === 0}
                  className="text-xs font-semibold bg-slate-900 hover:bg-rose-600 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  Start Practice <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Flashcard Practice Modal */}
      {activePracticeModule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setActivePracticeModule(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-semibold bg-rose-50 text-rose-600 px-3 py-1 rounded-full">
                {activePracticeModule.language} • {activePracticeModule.level}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">{activePracticeModule.title}</h3>
            </div>

            {!practiceCompleted && activePracticeModule.language_flashcards?.length > 0 ? (
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
                  <span>Card {currentCardIndex + 1} of {activePracticeModule.language_flashcards.length}</span>
                  <span>Flip card to reveal</span>
                </div>

                {/* Flip Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full h-64 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-6 text-center select-none shadow-sm ${
                    isFlipped ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <p className="text-3xl font-extrabold tracking-tight">{activePracticeModule.language_flashcards[currentCardIndex].term}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(activePracticeModule.language_flashcards[currentCardIndex].term, activePracticeModule.language);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-rose-600" /> Listen Pronunciation
                      </button>
                      <p className="text-xs text-slate-400 pt-4 flex items-center justify-center gap-1">
                        <RotateCw className="w-3 h-3" /> Click card to see translation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-rose-500 uppercase">Translation</p>
                      <p className="text-3xl font-bold">{activePracticeModule.language_flashcards[currentCardIndex].translation}</p>
                      {activePracticeModule.language_flashcards[currentCardIndex].example_sentence && (
                        <p className="text-sm text-slate-600 italic mt-3 bg-white/60 p-3 rounded-xl border border-rose-100">
                          "{activePracticeModule.language_flashcards[currentCardIndex].example_sentence}"
                        </p>
                      )}
                      <p className="text-xs text-rose-400 pt-2 flex items-center justify-center gap-1">
                        <RotateCw className="w-3 h-3" /> Click card to flip back
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex(currentCardIndex - 1);
                      setIsFlipped(false);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition-all"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => {
                      if (currentCardIndex < activePracticeModule.language_flashcards.length - 1) {
                        setCurrentCardIndex(currentCardIndex + 1);
                        setIsFlipped(false);
                      } else {
                        setPracticeCompleted(true);
                      }
                    }}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                  >
                    {currentCardIndex === activePracticeModule.language_flashcards.length - 1 ? 'Finish Session' : 'Next Card'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Module Completed!</h4>
                <p className="text-sm text-slate-500">Great job practicing your {activePracticeModule.language} vocabulary.</p>
                <button
                  onClick={() => setActivePracticeModule(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-all text-sm"
                >
                  Close Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}