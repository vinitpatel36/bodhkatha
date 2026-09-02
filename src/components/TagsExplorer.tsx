import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tag as TagIcon, 
  Search, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Star, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Users, 
  User, 
  Layers, 
  Filter, 
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Edit3,
  Share2,
  FolderPlus
} from 'lucide-react';
import { Story, UserPreferences } from '../types';
import { fetchAnonymousCommunityTags } from '../services/supabaseService';
import { CATEGORIES } from '../data/categories';

interface TagsExplorerProps {
  stories: Story[];
  preferences: UserPreferences;
  onUpdatePreferences: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onSelectStory: (storyId: number) => void;
  initialSelectedTag?: string | null;
}

const STARTER_TAG_SUGGESTIONS = [
  'પ્રેરણાદાયી',
  'બાળકો માટે',
  'પ્રવચન સંદર્ભ',
  'રોજિંદો બોધ',
  'ધ્યાન અને મનન',
  'ગુરુભક્તિ',
  'સેવા ભાવના',
  'નમ્રતા અને સહનશીલતા',
  'નિયમ પાલન',
  'સત્સંગ મહિમા',
  'સત્ય અને નિષ્ઠા',
  'શાંતિ અને સમભાવ'
];

export const TagsExplorer: React.FC<TagsExplorerProps> = ({
  stories,
  preferences,
  onUpdatePreferences,
  onSelectStory,
  initialSelectedTag = null,
}) => {
  // Tab state: 'my-tags' (Personal) or 'community-tags' (All Other User / Community Tags)
  const [activeTab, setActiveTab] = useState<'my-tags' | 'community-tags'>('my-tags');
  const [selectedTag, setSelectedTag] = useState<string | null>(initialSelectedTag);
  const [searchQuery, setSearchQuery] = useState('');
  const [communitySort, setCommunitySort] = useState<'count' | 'alpha'>('count');
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [communityTagsMap, setCommunityTagsMap] = useState<Record<string, number[]>>({});

  // Modal / Creator State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagStoryId, setNewTagStoryId] = useState<number>(preferences.lastReadStoryId || 1);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editedTagName, setEditedTagName] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Load Anonymous Community Tags on mount or tab switch
  useEffect(() => {
    let isMounted = true;
    const loadCommunity = async () => {
      setIsLoadingCommunity(true);
      try {
        const res = await fetchAnonymousCommunityTags(stories);
        if (isMounted) {
          setCommunityTagsMap(res);
        }
      } catch (err) {
        console.warn('Failed to load community tags:', err);
      } finally {
        if (isMounted) setIsLoadingCommunity(false);
      }
    };

    loadCommunity();
    return () => { isMounted = false; };
  }, [stories]);

  // Aggregate My Tags: Map of tag -> array of story IDs
  const myTagsMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    Object.entries(preferences.customTags || {}).forEach(([storyIdStr, tags]) => {
      const storyId = Number(storyIdStr);
      if (storyId && Array.isArray(tags)) {
        tags.forEach((tag) => {
          const clean = tag.trim();
          if (clean) {
            if (!map[clean]) map[clean] = [];
            if (!map[clean].includes(storyId)) {
              map[clean].push(storyId);
            }
          }
        });
      }
    });
    return map;
  }, [preferences.customTags]);

  // If initialSelectedTag changes from parent
  useEffect(() => {
    if (initialSelectedTag) {
      const clean = initialSelectedTag.trim();
      setSelectedTag(clean);
      // Auto switch to appropriate tab if it exists in my tags or community tags
      if (myTagsMap[clean]?.length) {
        setActiveTab('my-tags');
      } else {
        setActiveTab('community-tags');
      }
    }
  }, [initialSelectedTag, myTagsMap]);

  // Total count of unique personal tags and tagged stories
  const myTagsList = useMemo(() => {
    return Object.keys(myTagsMap).sort((a, b) => {
      return (myTagsMap[b]?.length || 0) - (myTagsMap[a]?.length || 0) || a.localeCompare(b, 'gu');
    });
  }, [myTagsMap]);

  // Community tags sorted list
  const communityTagsList = useMemo(() => {
    const tags = Object.keys(communityTagsMap);
    return tags.sort((a, b) => {
      if (communitySort === 'count') {
        const countDiff = (communityTagsMap[b]?.length || 0) - (communityTagsMap[a]?.length || 0);
        if (countDiff !== 0) return countDiff;
      }
      return a.localeCompare(b, 'gu');
    });
  }, [communityTagsMap, communitySort]);

  // Filtered tags based on search
  const filteredMyTags = useMemo(() => {
    if (!searchQuery.trim()) return myTagsList;
    const q = searchQuery.toLowerCase().trim();
    return myTagsList.filter((t) => t.toLowerCase().includes(q));
  }, [myTagsList, searchQuery]);

  const filteredCommunityTags = useMemo(() => {
    if (!searchQuery.trim()) return communityTagsList;
    const q = searchQuery.toLowerCase().trim();
    return communityTagsList.filter((t) => t.toLowerCase().includes(q));
  }, [communityTagsList, searchQuery]);

  // Selected Tag stories list - comprehensive matching
  const activeStories = useMemo(() => {
    if (!selectedTag) return [];
    const cleanTag = selectedTag.trim();
    
    if (activeTab === 'my-tags') {
      const storyIds = myTagsMap[cleanTag] || [];
      return stories.filter((s) => {
        const custom = preferences.customTags?.[s.id] || [];
        return storyIds.includes(s.id) || custom.includes(cleanTag);
      });
    } else {
      const commStoryIds = communityTagsMap[cleanTag] || [];
      return stories.filter((s) => {
        const custom = preferences.customTags?.[s.id] || [];
        return (
          commStoryIds.includes(s.id) ||
          s.tags.includes(cleanTag) ||
          custom.includes(cleanTag)
        );
      });
    }
  }, [selectedTag, activeTab, myTagsMap, communityTagsMap, stories, preferences.customTags]);

  // Auto-select first tag if none selected and tags exist
  useEffect(() => {
    if (selectedTag) {
      // Check if current selected tag exists in current tab
      if (activeTab === 'my-tags' && !myTagsMap[selectedTag]) {
        if (myTagsList.length > 0) {
          setSelectedTag(myTagsList[0]);
        }
      } else if (activeTab === 'community-tags' && !communityTagsMap[selectedTag] && !stories.some(s => s.tags.includes(selectedTag))) {
        if (communityTagsList.length > 0) {
          setSelectedTag(communityTagsList[0]);
        }
      }
      return;
    }

    if (activeTab === 'my-tags') {
      if (myTagsList.length > 0) {
        setSelectedTag(myTagsList[0]);
      } else {
        setSelectedTag(null);
      }
    } else {
      if (communityTagsList.length > 0) {
        setSelectedTag(communityTagsList[0]);
      } else {
        setSelectedTag(null);
      }
    }
  }, [activeTab, myTagsList, communityTagsList, myTagsMap, communityTagsMap, stories]);

  // Handlers for My Tags
  const handleCreateNewTag = () => {
    const clean = newTagName.trim();
    if (!clean) return;

    onUpdatePreferences((prev) => {
      const currentList = prev.customTags[newTagStoryId] || [];
      if (!currentList.includes(clean)) {
        return {
          ...prev,
          customTags: {
            ...prev.customTags,
            [newTagStoryId]: [...currentList, clean],
          },
        };
      }
      return prev;
    });

    setSelectedTag(clean);
    setNewTagName('');
    setShowCreateModal(false);
    showToast(`"${clean}" ટેગ બોધકથા #${newTagStoryId} માં સફળતાપૂર્વક ઉમેરાયો!`);
  };

  const handleQuickAddStarterTag = (tagToAdd: string) => {
    const targetStoryId = preferences.lastReadStoryId || 1;
    onUpdatePreferences((prev) => {
      const currentList = prev.customTags[targetStoryId] || [];
      if (!currentList.includes(tagToAdd)) {
        return {
          ...prev,
          customTags: {
            ...prev.customTags,
            [targetStoryId]: [...currentList, tagToAdd],
          },
        };
      }
      return prev;
    });
    setSelectedTag(tagToAdd);
    showToast(`"${tagToAdd}" ટેગ બોધકથા #${targetStoryId} માં ઉમેરાયો!`);
  };

  const handleAdoptCommunityTag = (tag: string, storyId?: number) => {
    const targetId = storyId || (communityTagsMap[tag]?.[0] || preferences.lastReadStoryId || 1);
    onUpdatePreferences((prev) => {
      const currentList = prev.customTags[targetId] || [];
      if (!currentList.includes(tag)) {
        return {
          ...prev,
          customTags: {
            ...prev.customTags,
            [targetId]: [...currentList, tag],
          },
        };
      }
      return prev;
    });
    showToast(`"${tag}" ટેગ તમારા અંગત ટેગ્સમાં ઉમેરાયો!`);
  };

  const handleRemoveTagFromStory = (storyId: number, tagToRemove: string) => {
    onUpdatePreferences((prev) => {
      const currentList = prev.customTags[storyId] || [];
      const updated = currentList.filter((t) => t !== tagToRemove);
      const nextCustom = { ...prev.customTags };
      if (updated.length > 0) {
        nextCustom[storyId] = updated;
      } else {
        delete nextCustom[storyId];
      }
      return {
        ...prev,
        customTags: nextCustom,
      };
    });
    showToast(`"${tagToRemove}" ટેગ બોધકથા #${storyId} માંથી દૂર કર્યો.`);
  };

  const handleDeleteTagEntirely = (tagToDelete: string) => {
    if (!window.confirm(`શું તમે ખરેખર "${tagToDelete}" ટેગને તમારી બધી કથાઓમાંથી દૂર કરવા માંગો છો?`)) {
      return;
    }

    onUpdatePreferences((prev) => {
      const nextCustom: Record<number, string[]> = {};
      const customMap = (prev.customTags || {}) as Record<string, string[]>;
      Object.entries(customMap).forEach(([sId, tags]) => {
        if (Array.isArray(tags)) {
          const filtered = tags.filter((t: string) => t !== tagToDelete);
          if (filtered.length > 0) {
            nextCustom[Number(sId)] = filtered;
          }
        }
      });
      return {
        ...prev,
        customTags: nextCustom,
      };
    });

    if (selectedTag === tagToDelete) {
      setSelectedTag(null);
    }
    showToast(`"${tagToDelete}" ટેગ સફળતાપૂર્વક ડિલીટ થયો.`);
  };

  const handleSaveRenameTag = (oldTag: string) => {
    const clean = editedTagName.trim();
    if (!clean || clean === oldTag) {
      setEditingTag(null);
      return;
    }

    onUpdatePreferences((prev) => {
      const nextCustom: Record<number, string[]> = {};
      const customMap = (prev.customTags || {}) as Record<string, string[]>;
      Object.entries(customMap).forEach(([sId, tags]) => {
        if (Array.isArray(tags)) {
          const updated = tags.map((t: string) => (t === oldTag ? clean : t));
          // Deduplicate
          nextCustom[Number(sId)] = Array.from(new Set(updated));
        }
      });
      return {
        ...prev,
        customTags: nextCustom,
      };
    });

    setEditingTag(null);
    setSelectedTag(clean);
    showToast(`ટેગનું નામ બદલીને "${clean}" કર્યું.`);
  };

  const toggleFavorite = (e: React.MouseEvent, storyId: number) => {
    e.stopPropagation();
    const isFav = preferences.favorites.includes(storyId);
    onUpdatePreferences((prev) => ({
      ...prev,
      favorites: isFav
        ? prev.favorites.filter((id) => id !== storyId)
        : [...prev.favorites, storyId],
    }));
  };

  const toggleRead = (e: React.MouseEvent, storyId: number) => {
    e.stopPropagation();
    const isRead = preferences.readStories.includes(storyId);
    onUpdatePreferences((prev) => ({
      ...prev,
      readStories: isRead
        ? prev.readStories.filter((id) => id !== storyId)
        : [...prev.readStories, storyId],
    }));
  };

  return (
    <div id="tags-explorer-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-5 z-50 bg-amber-900 text-white dark:bg-amber-100 dark:text-amber-950 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-700/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 dark:text-amber-700 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Header & Tab Navigation */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <TagIcon className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati']">
                બોધકથા ટેગ્સ હબ (Tags Hub)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              તમારા અંગત વિષય ટેગ્સ અને તમામ વાચકોના સામૂહિક વિષયો દ્વારા કથાઓ શોધો અને વર્ગીકૃત કરો.
            </p>
          </div>

          {/* Quick Create Tag Button */}
          <button
            id="create-new-tag-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>નવો ટેગ બનાવો</span>
          </button>
        </div>

        {/* Navigation Tabs: My Tags vs All Other User / Community Tags */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl">
            <button
              id="tab-my-tags-btn"
              onClick={() => {
                setActiveTab('my-tags');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'my-tags'
                  ? 'bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-200 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <User className="w-4 h-4 text-amber-600" />
              <span>મારા ટેગ્સ (My Tags)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {myTagsList.length}
              </span>
            </button>

            <button
              id="tab-community-tags-btn"
              onClick={() => {
                setActiveTab('community-tags');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'community-tags'
                  ? 'bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-200 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>સામૂહિક ટેગ્સ (All Other User Tags)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                {communityTagsList.length}
              </span>
            </button>
          </div>

          {/* Privacy & Anonymity Badge for Community Tags */}
          {activeTab === 'community-tags' && (
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 px-3 py-1 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>સંપૂર્ણ અનામી (વાચકની ઓળખ દર્શાવવામાં આવતી નથી)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout: Left Tag Sidebar + Right Story Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tag Selector / Cloud (4 Cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            {/* Search Input for Tags */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'my-tags' ? "તમારા ટેગ્સમાં શોધો..." : "સામૂહિક ટેગ્સમાં શોધો..."}
                className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Controls (in Community Tab) */}
            {activeTab === 'community-tags' && (
              <div className="flex items-center justify-between text-xs px-1 text-stone-500">
                <span>ક્રમ પસંદ કરો:</span>
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setCommunitySort('count')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      communitySort === 'count' 
                        ? 'bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-200 shadow-xs' 
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    લોકપ્રિયતા
                  </button>
                  <button
                    onClick={() => setCommunitySort('alpha')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      communitySort === 'alpha' 
                        ? 'bg-white dark:bg-stone-700 text-amber-900 dark:text-amber-200 shadow-xs' 
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    A-Z અકારાદિ
                  </button>
                </div>
              </div>
            )}

            {/* Tags List / Chips */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {activeTab === 'my-tags' ? (
                // MY TAGS LIST
                filteredMyTags.length > 0 ? (
                  filteredMyTags.map((tag) => {
                    const count = myTagsMap[tag]?.length || 0;
                    const isSelected = selectedTag === tag;
                    const isEditing = editingTag === tag;

                    return (
                      <div
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-xs'
                            : 'bg-stone-50/60 dark:bg-stone-800/40 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editedTagName}
                              onChange={(e) => setEditedTagName(e.target.value)}
                              className="text-xs px-2 py-1 bg-white dark:bg-stone-700 border border-amber-500 rounded-lg flex-1 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRenameTag(tag)}
                              className="p-1 rounded-lg bg-amber-600 text-white"
                              title="સાચવો"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
                              title="રદ કરો"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-amber-600 dark:text-amber-400 font-bold">#</span>
                              <span className="text-xs sm:text-sm font-semibold truncate">{tag}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isSelected 
                                  ? 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200' 
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                              }`}>
                                {count} કથા
                              </span>

                              {/* Edit / Delete action triggers */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTag(tag);
                                  setEditedTagName(tag);
                                }}
                                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-700 transition-opacity"
                                title="નામ બદલો (Rename)"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTagEntirely(tag);
                                }}
                                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-950 text-stone-400 hover:text-rose-600 transition-opacity"
                                title="ટેગ ડિલીટ કરો"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {searchQuery ? "કોઈ ટેગ મળ્યો નથી." : "હજુ સુધી તમે કોઈ અંગત ટેગ બનાવ્યો નથી."}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-200"
                    >
                      + પ્રથમ ટેગ ઉમેરો
                    </button>
                  </div>
                )
              ) : (
                // COMMUNITY / ALL OTHER USER TAGS LIST
                filteredCommunityTags.length > 0 ? (
                  filteredCommunityTags.map((tag) => {
                    const count = communityTagsMap[tag]?.length || 0;
                    const isSelected = selectedTag === tag;
                    const isAlreadyMyTag = Boolean(myTagsMap[tag]);

                    return (
                      <div
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-xs'
                            : 'bg-stone-50/60 dark:bg-stone-800/40 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">#</span>
                          <span className="text-xs sm:text-sm font-semibold truncate">{tag}</span>
                          {isAlreadyMyTag && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              મારામાં સેવ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected 
                              ? 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200' 
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                          }`}>
                            {count} કથા
                          </span>

                          {!isAlreadyMyTag && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdoptCommunityTag(tag);
                              }}
                              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-amber-100 text-stone-400 hover:text-amber-700 transition-opacity text-[10px] font-bold"
                              title="મારા ટેગ્સમાં ઉમેરો"
                            >
                              + સેવ
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400">
                    કોઈ સામૂહિક ટેગ મળ્યો નથી.
                  </div>
                )
              )}
            </div>

            {/* Quick Starter Suggestions */}
            {activeTab === 'my-tags' && myTagsList.length < 4 && (
              <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 space-y-2">
                <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>લોકપ્રિય સૂચવેલા ટેગ્સ:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_TAG_SUGGESTIONS.slice(0, 6).map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleQuickAddStarterTag(sug)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 transition-colors"
                    >
                      + #{sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Tag Stories Display (8 Cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTag ? (
            <div className="space-y-4">
              {/* Selected Tag Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-400/30 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {activeTab === 'my-tags' ? 'તમારો અંગત ટેગ' : 'સામૂહિક વિષય ટેગ'}
                    </span>
                    {activeTab === 'community-tags' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        સર્વ વાચકોનો સંગ્રહ
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-['Noto_Sans_Gujarati'] flex items-center gap-2">
                    <span className="text-amber-600">#</span>
                    <span>{selectedTag}</span>
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    આ વિષય સાથે કુલ <strong>{activeStories.length}</strong> બોધકથાઓ જોડાયેલી છે.
                  </p>
                </div>

                {/* Tag Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeTab === 'community-tags' && !myTagsMap[selectedTag] && (
                    <button
                      onClick={() => handleAdoptCommunityTag(selectedTag)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>મારા ટેગ્સમાં સેવ કરો</span>
                    </button>
                  )}
                  {activeTab === 'my-tags' && (
                    <button
                      onClick={() => {
                        setNewTagName(selectedTag);
                        setShowCreateModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>વધુ કથા જોડો</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Story Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeStories.map((story) => {
                  const isRead = preferences.readStories.includes(story.id);
                  const isFav = preferences.favorites.includes(story.id);
                  const catObj = CATEGORIES.find((c) => c.id === story.category);

                  return (
                    <div
                      key={story.id}
                      onClick={() => onSelectStory(story.id)}
                      className="group bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-800/90 hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        {/* Header: Story Number + Read Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            કથા #{story.id}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => toggleFavorite(e, story.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isFav 
                                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950' 
                                  : 'text-stone-400 hover:text-amber-500'
                              }`}
                              title={isFav ? 'મનપસંદમાંથી દૂર કરો' : 'મનપસંદ'}
                            >
                              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => toggleRead(e, story.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isRead 
                                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' 
                                  : 'text-stone-400 hover:text-emerald-600'
                              }`}
                              title={isRead ? 'વાંચેલ' : 'અણવાંચેલ'}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isRead ? 'fill-emerald-500 text-white dark:text-stone-900' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-['Noto_Sans_Gujarati']">
                          {story.title}
                        </h3>

                        {/* Moral snippet */}
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed italic">
                          "{story.moral}"
                        </p>
                      </div>

                      {/* Footer Info & Read Button */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {story.estimatedMinutes} મિ.
                          </span>
                          <span>•</span>
                          <span>પાનું {story.bookPage}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {activeTab === 'my-tags' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTagFromStory(story.id, selectedTag);
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-700 font-medium px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950"
                              title="આ કથામાંથી ટેગ હટાવો"
                            >
                              ટેગ હટાવો
                            </button>
                          )}
                          <span className="text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            વાંચો <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center mx-auto">
                <TagIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  ડાબી બાજુથી કોઈ ટેગ પસંદ કરો
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  ટેગ પર ક્લિક કરીને તેની સાથે જોડાયેલી બધી બોધકથાઓ વાંચો અથવા નવો ટેગ બનાવો.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create or Add New Tag */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 flex items-center justify-center font-bold">
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  નવો ટેગ ઉમેરો (Add Custom Tag)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  તમારી પસંદગી મુજબ કથાને ટેગ કરો
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  ટેગનું નામ (Tag Name) *
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="દા.ત. પ્રેરણાદાયી, બાળકો માટે, પ્રવચન..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  બોધકથા પસંદ કરો (Select Story)
                </label>
                <select
                  value={newTagStoryId}
                  onChange={(e) => setNewTagStoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600 text-xs"
                >
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} - {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-stone-400 block mb-1">ઝડપી સૂચનો:</span>
                <div className="flex flex-wrap gap-1">
                  {STARTER_TAG_SUGGESTIONS.slice(0, 6).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewTagName(sug)}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-stone-600 dark:text-stone-300 text-[10px]"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                રદ કરો
              </button>
              <button
                onClick={handleCreateNewTag}
                disabled={!newTagName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                સાચવો (Save Tag)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
