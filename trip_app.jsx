import { useState, useEffect, useCallback, useRef } from "react";
import { Camera, MapPin, Users, Compass, Calendar, DollarSign, Star, Plus, ChevronRight, ChevronDown, ChevronLeft, Globe, Heart, Send, Check, X, Clock, Navigation, Utensils, Home, Plane, Search, Bell, User, Settings, ArrowRight, ExternalLink, ThumbsUp, MessageCircle, Share2, Bookmark, CreditCard, TrendingUp, Award, Map, Coffee, ShoppingBag, Music, Sunrise, Edit3, Trash2, Link, Vote, BarChart3, Filter, Zap, AlertCircle, CheckSquare, Package, FileText, Upload, Shield, Image, BookOpen, Smile, Loader2, LogOut } from "lucide-react";
import { supabase } from "./src/lib/supabase";
import { useAuth } from "./src/contexts/AuthContext";
import Auth from "./src/components/Auth";

// ─── (Seed data removed — all data now comes from Supabase) ───
// ─── Utility Components ──────────────────────────────────
const Badge = ({ children, color = "sky" }) => {
    const colors = {
        sky: "bg-sky-100 text-sky-700", green: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700", rose: "bg-rose-100 text-rose-700",
        violet: "bg-violet-100 text-violet-700", slate: "bg-slate-100 text-slate-600",
        orange: "bg-orange-100 text-orange-700", teal: "bg-teal-100 text-teal-700",
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
};

const StatusBadge = ({ status }) => {
    const map = { booked: ["Booked", "green"], needs_booking: ["Needs Booking", "amber"], needs_reschedule: ["Reschedule", "rose"], confirmed: ["Confirmed", "sky"], cancelled: ["Cancelled", "slate"] };
    const [label, color] = map[status] || ["Unknown", "slate"];
    return <Badge color={color}>{label}</Badge>;
};

const Avatar = ({ name, size = "md" }) => {
    const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-xl" };
    const colors = ["bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];
    const c = colors[name?.charCodeAt(0) % colors.length] || colors[0];
    return <div className={`${sizes[size]} ${c} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>{name?.[0] || "?"}</div>;
};

const AvatarStack = ({ names, max = 4 }) => (
    <div className="flex -space-x-2">
        {names.slice(0, max).map(n => <div key={n} className="ring-2 ring-white rounded-full"><Avatar name={n} size="sm" /></div>)}
        {names.length > max && <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 ring-2 ring-white">+{names.length - max}</div>}
    </div>
);

const Card = ({ children, className = "", onClick }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`} onClick={onClick}>{children}</div>
);

const IconBtn = ({ icon: Icon, label, active, onClick, badge }) => (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${active ? "text-sky-600 bg-sky-50" : "text-slate-400 hover:text-slate-600"}`}>
        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
        <span>{label}</span>
        {badge > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">{badge}</span>}
    </button>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3"><Icon size={24} className="text-slate-400" /></div>
        <p className="font-semibold text-slate-700 mb-1">{title}</p>
        <p className="text-sm text-slate-400 max-w-xs">{desc}</p>
    </div>
);

const SectionHeader = ({ title, action, onAction }) => (
    <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {action && <button onClick={onAction} className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">{action} <ChevronRight size={14} /></button>}
    </div>
);

const catIcon = (cat) => {
    const map = { accommodation: Home, dining: Utensils, excursion: Compass, transport: Plane, restaurant: Utensils, hotel: Home, cafe: Coffee, bar: Music, store: ShoppingBag };
    return map[cat] || MapPin;
};

const catColor = (cat) => {
    const map = { accommodation: "text-violet-500 bg-violet-50", dining: "text-orange-500 bg-orange-50", excursion: "text-emerald-500 bg-emerald-50", transport: "text-sky-500 bg-sky-50", restaurant: "text-orange-500 bg-orange-50", hotel: "text-violet-500 bg-violet-50", cafe: "text-amber-500 bg-amber-50", bar: "text-rose-500 bg-rose-50", store: "text-teal-500 bg-teal-50" };
    return map[cat] || "text-slate-500 bg-slate-50";
};

const ICON_MAP = { Users, Calendar, DollarSign, Heart, Star };

// ─── Profile Tab ─────────────────────────────────────────
const ProfileTab = ({ user, authUserId, recommendations, onNavigate, onUpdateUser, allUsers, viewingProfile, onViewProfile }) => {
    const [expandedCountry, setExpandedCountry] = useState(null);
    const [expandedCity, setExpandedCity] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", bio: "", avatar: "" });
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizStep, setQuizStep] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState([]);
    const [currentSelections, setCurrentSelections] = useState([]);
    const [wishlistInput, setWishlistInput] = useState("");
    const [showWishlistInput, setShowWishlistInput] = useState(false);
    const [showList, setShowList] = useState(null); // "followers" | "following" | null
    const profileInputRef = useRef(null);
    const bgInputRef = useRef(null);

    // Determine which profile to display
    const isOwnProfile = !viewingProfile || viewingProfile === user.handle;
    const u = isOwnProfile ? user : (allUsers[viewingProfile] || user);

    const followerCount = u.followerHandles?.length || 0;
    const followingCount = u.followingHandles?.length || 0;

    const handleImageUpload = async (file, field) => {
        if (!file || !isOwnProfile) return;
        if (!file.type.startsWith("image/")) return;
        const filePath = `${authUserId}/${field}-${Date.now()}.${file.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
        if (error) return;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        if (urlData?.publicUrl) {
            onUpdateUser({ [field]: urlData.publicUrl });
        }
    };

    const startEdit = () => {
        setEditForm({ name: u.name, bio: u.bio, avatar: u.avatar });
        setIsEditing(true);
    };

    const saveEdit = () => {
        onUpdateUser({ name: editForm.name || user.name, bio: editForm.bio, avatar: editForm.avatar || user.avatar });
        setIsEditing(false);
    };

    const navigateToProfile = (handle) => {
        setShowList(null);
        setExpandedCountry(null);
        setExpandedCity(null);
        setIsEditing(false);
        onViewProfile(handle === user.handle ? null : handle);
    };

    const quizQuestions = [
        { q: "Your ideal vacation pace?", options: [["🏃", "Non-stop adventure"], ["🚶", "Balanced mix"], ["🛋️", "Slow & relaxed"]] },
        { q: "Budget preference?", options: [["💰", "Budget-friendly"], ["⚖️", "Mid-range comfort"], ["💎", "Luxury all the way"]] },
        { q: "What draws you most?", options: [["🍜", "Food & culinary experiences"], ["🏛️", "History & culture"], ["🏔️", "Nature & outdoors"], ["🎉", "Nightlife & social"]] },
        { q: "Travel group size?", options: [["👤", "Solo"], ["👥", "Small group (2-4)"], ["👥👥", "Larger group (5+)"]] },
    ];

    const styleMap = {
        "Non-stop adventure": "Adventure", "Balanced mix": "Explorer", "Slow & relaxed": "Relaxation",
        "Budget-friendly": "Budget", "Mid-range comfort": "Comfort", "Luxury all the way": "Luxury",
        "Food & culinary experiences": "Foodie", "History & culture": "Cultural", "Nature & outdoors": "Nature",
        "Nightlife & social": "Nightlife", "Solo": "Solo", "Small group (2-4)": "Small Group", "Larger group (5+)": "Social",
    };

    const toggleSelection = (label) => {
        setCurrentSelections(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
    };

    const handleQuizNext = () => {
        if (currentSelections.length === 0) return;
        const newAnswers = [...quizAnswers, ...currentSelections];
        if (quizStep < quizQuestions.length - 1) {
            setQuizAnswers(newAnswers);
            setCurrentSelections([]);
            setQuizStep(quizStep + 1);
        } else {
            const styles = newAnswers.map(a => styleMap[a] || a).filter(Boolean);
            onUpdateUser({ travelStyles: styles });
            setShowQuiz(false);
            setQuizStep(0);
            setQuizAnswers([]);
            setCurrentSelections([]);
        }
    };

    // User list overlay for followers/following
    if (showList) {
        const handles = showList === "followers" ? (u.followerHandles || []) : (u.followingHandles || []);
        const title = showList === "followers" ? "Followers" : "Following";
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowList(null)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronLeft size={20} className="text-slate-600" /></button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        <p className="text-sm text-slate-500">{u.name} · {handles.length} {title.toLowerCase()}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {handles.map(handle => {
                        const person = allUsers[handle];
                        if (!person) return null;
                        return (
                            <Card key={handle} className="p-3.5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToProfile(handle)}>
                                <div className="flex items-center gap-3">
                                    {person.profileImage ? (
                                        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"><img src={person.profileImage} alt={person.name} className="w-full h-full object-cover" /></div>
                                    ) : (
                                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">{person.avatar}</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700">{person.name}</p>
                                        <p className="text-xs text-slate-400">{person.handle}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{person.bio}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                                </div>
                                <div className="flex gap-1.5 mt-2 ml-14">
                                    {person.travelStyles?.slice(0, 3).map(s => <Badge key={s} color="sky">{s}</Badge>)}
                                </div>
                            </Card>
                        );
                    })}
                    {handles.length === 0 && <EmptyState icon={Users} title={`No ${title.toLowerCase()}`} desc={`${u.name} has no ${title.toLowerCase()} yet.`} />}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Back button when viewing another profile */}
            {!isOwnProfile && (
                <button onClick={() => onViewProfile(null)} className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 mb-1">
                    <ChevronLeft size={16} /> Back to my profile
                </button>
            )}

            <div className="relative">
                {isOwnProfile && (
                    <>
                        <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={e => { handleImageUpload(e.target.files[0], "backgroundImage"); e.target.value = ""; }} />
                        <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { handleImageUpload(e.target.files[0], "profileImage"); e.target.value = ""; }} />
                    </>
                )}
                <div className={`h-36 rounded-2xl overflow-hidden relative ${!u.backgroundImage ? "bg-gradient-to-br from-sky-400 via-teal-400 to-emerald-400" : ""}`}
                    style={u.backgroundImage ? { backgroundImage: `url(${u.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                    {u.backgroundImage && <div className="absolute inset-0 bg-black/10" />}
                    {isOwnProfile && (
                        <button onClick={() => bgInputRef.current?.click()} className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm z-10" title="Change background photo">
                            <Camera size={16} className="text-slate-600" />
                        </button>
                    )}
                </div>
                <div className="flex items-end gap-3 px-4 -mt-5 relative z-10">
                    <div className="relative group flex-shrink-0">
                        {u.profileImage ? (
                            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white overflow-hidden">
                                <img src={u.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-4xl border-4 border-white">{u.avatar}</div>
                        )}
                        {isOwnProfile && (
                            <button onClick={() => profileInputRef.current?.click()}
                                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-4 border-transparent" title="Change profile photo">
                                <Camera size={20} className="text-white drop-shadow-md" />
                            </button>
                        )}
                    </div>
                    <div className="pb-1">
                        <h2 className="text-lg font-bold text-slate-800">{u.name}</h2>
                        <p className="text-sm text-slate-500">{u.handle}</p>
                    </div>
                </div>
                {isOwnProfile && (
                    <button onClick={startEdit} className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                        <Edit3 size={16} className="text-slate-600" />
                    </button>
                )}
            </div>

            {isOwnProfile && isEditing && (
                <Card className="p-4 border-2 border-sky-200">
                    <h3 className="font-semibold text-slate-700 mb-3">Edit Profile</h3>
                    <div className="space-y-2.5">
                        <div className="flex gap-3 items-center">
                            <div className="relative group flex-shrink-0">
                                {u.profileImage ? (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden"><img src={u.profileImage} alt="Profile" className="w-full h-full object-cover" /></div>
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">{u.avatar}</div>
                                )}
                                <button onClick={() => profileInputRef.current?.click()}
                                    className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Camera size={16} className="text-white drop-shadow-md" />
                                </button>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <button onClick={() => profileInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 text-xs font-medium rounded-xl hover:border-sky-300 hover:text-sky-600 transition-colors flex items-center justify-center gap-1.5">
                                    <Camera size={12} /> Change Profile Photo
                                </button>
                                <button onClick={() => bgInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 text-xs font-medium rounded-xl hover:border-sky-300 hover:text-sky-600 transition-colors flex items-center justify-center gap-1.5">
                                    <Image size={12} /> Change Background Photo
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input value={editForm.avatar} onChange={e => setEditForm({ ...editForm, avatar: e.target.value })} placeholder="Fallback emoji" className="w-20 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-300" />
                            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Display name" className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        </div>
                        <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Bio" rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" />
                        {(u.profileImage || u.backgroundImage) && (
                            <div className="flex gap-2">
                                {u.profileImage && <button onClick={() => onUpdateUser({ profileImage: null })} className="flex-1 py-2 text-xs font-medium text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors">Remove Profile Photo</button>}
                                {u.backgroundImage && <button onClick={() => onUpdateUser({ backgroundImage: null })} className="flex-1 py-2 text-xs font-medium text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors">Remove Background</button>}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={saveEdit} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Save</button>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            {isOwnProfile && showQuiz && (
                <Card className="p-4 border-2 border-violet-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-700">Travel Style Quiz</h3>
                        <span className="text-xs text-slate-400">{quizStep + 1}/{quizQuestions.length}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-violet-400 rounded-full transition-all duration-300" style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }} />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-2">{quizQuestions[quizStep].q}</p>
                    <p className="text-xs text-slate-400 mb-3">Select all that apply</p>
                    <div className="space-y-2">
                        {quizQuestions[quizStep].options.map(([emoji, label]) => (
                            <button key={label} onClick={() => toggleSelection(label)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors text-left ${currentSelections.includes(label) ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300" : "bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700"}`}>
                                <span className="text-lg">{emoji}</span> {label}
                                {currentSelections.includes(label) && <Check size={16} className="ml-auto text-violet-500" />}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleQuizNext} disabled={currentSelections.length === 0}
                        className="w-full mt-3 py-2.5 bg-violet-500 text-white text-sm font-semibold rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-40">
                        {quizStep < quizQuestions.length - 1 ? "Next" : "Finish"}
                    </button>
                    <button onClick={() => { setShowQuiz(false); setQuizStep(0); setQuizAnswers([]); setCurrentSelections([]); }} className="w-full mt-2 py-2 text-slate-400 text-sm hover:text-slate-600">Cancel</button>
                </Card>
            )}

            <div className="pt-2">
                <p className="text-sm text-slate-600 mb-3">{u.bio}</p>
                <div className="flex gap-4 mb-4">
                    <div className="text-center">
                        <p className="text-lg font-bold text-slate-800">{u.countriesVisited}</p>
                        <p className="text-xs text-slate-400">Countries</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-slate-800">{u.tripsPlanned}</p>
                        <p className="text-xs text-slate-400">Trips</p>
                    </div>
                    <button onClick={() => setShowList("followers")} className="text-center hover:bg-slate-50 px-2 py-1 rounded-xl transition-colors">
                        <p className="text-lg font-bold text-slate-800">{followerCount}</p>
                        <p className="text-xs text-sky-500 font-medium">Followers</p>
                    </button>
                    <button onClick={() => setShowList("following")} className="text-center hover:bg-slate-50 px-2 py-1 rounded-xl transition-colors">
                        <p className="text-lg font-bold text-slate-800">{followingCount}</p>
                        <p className="text-xs text-sky-500 font-medium">Following</p>
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {u.travelStyles?.map(s => <Badge key={s} color="sky">{s}</Badge>)}
                    {isOwnProfile && (
                        <button onClick={() => { setShowQuiz(true); setQuizStep(0); setQuizAnswers([]); setCurrentSelections([]); }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border-2 border-dashed border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-colors">
                            <Edit3 size={10} /> {u.travelStyles?.length > 0 ? "Retake Quiz" : "Take Quiz"}
                        </button>
                    )}
                </div>
            </div>

            <Card className="p-4">
                <SectionHeader title="Wishlist" />
                <div className="flex gap-2 flex-wrap">
                    {u.wishlist?.map(w => (
                        <span key={w} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium group">
                            <Heart size={12} fill="currentColor" /> {w}
                            {isOwnProfile && (
                                <button onClick={() => onUpdateUser({ wishlist: (u.wishlist || []).filter(item => item !== w) })}
                                    className="ml-0.5 text-amber-400 hover:text-rose-500 transition-colors">
                                    <X size={12} />
                                </button>
                            )}
                        </span>
                    ))}
                    {isOwnProfile && !showWishlistInput && (
                        <button onClick={() => setShowWishlistInput(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-amber-200 text-amber-400 rounded-full text-sm font-medium hover:border-amber-300 hover:text-amber-500 transition-colors">
                            <Plus size={12} /> Add
                        </button>
                    )}
                    {(!u.wishlist || u.wishlist.length === 0) && !showWishlistInput && !isOwnProfile && <p className="text-sm text-slate-400">No wishlist items yet.</p>}
                </div>
                {isOwnProfile && showWishlistInput && (
                    <div className="flex gap-2 mt-3">
                        <input value={wishlistInput} onChange={e => setWishlistInput(e.target.value)} placeholder="e.g. Bali, Tokyo, Paris..."
                            onKeyDown={e => { if (e.key === "Enter" && wishlistInput.trim()) { onUpdateUser({ wishlist: [...(u.wishlist || []), wishlistInput.trim()] }); setWishlistInput(""); setShowWishlistInput(false); } }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" autoFocus />
                        <button onClick={() => { if (wishlistInput.trim()) { onUpdateUser({ wishlist: [...(u.wishlist || []), wishlistInput.trim()] }); setWishlistInput(""); setShowWishlistInput(false); } }}
                            className="px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600">Add</button>
                        <button onClick={() => { setWishlistInput(""); setShowWishlistInput(false); }}
                            className="px-3 py-2 border border-slate-200 text-slate-500 text-sm rounded-xl hover:bg-slate-50">Cancel</button>
                    </div>
                )}
            </Card>

            <Card className="p-4">
                <SectionHeader title={isOwnProfile ? "My Travels & Recommendations" : `${u.name.split(" ")[0]}'s Travels`} action={isOwnProfile ? "Share All" : undefined} />
                <div className="space-y-2">
                    {u.countries?.map(country => (
                        <div key={country.name}>
                            <button onClick={() => { setExpandedCountry(expandedCountry === country.name ? null : country.name); setExpandedCity(null); }}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{country.flag}</span>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-700">{country.name}</p>
                                        <p className="text-xs text-slate-400">{country.cities.length} cities</p>
                                    </div>
                                </div>
                                {expandedCountry === country.name ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                            </button>
                            {expandedCountry === country.name && (
                                <div className="ml-10 space-y-1 pb-2">
                                    {country.cities.map(city => (
                                        <div key={city}>
                                            <button onClick={() => setExpandedCity(expandedCity === city ? null : city)}
                                                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 text-sm">
                                                <span className="flex items-center gap-2"><MapPin size={14} className="text-sky-500" /><span className="font-medium text-slate-600">{city}</span></span>
                                                {recommendations[city] && (
                                                    <span className="text-xs text-slate-400">{recommendations[city].length} recs</span>
                                                )}
                                            </button>
                                            {expandedCity === city && recommendations[city] && (
                                                <div className="ml-6 space-y-2 pb-2">
                                                    {recommendations[city].map(rec => {
                                                        const Icon = catIcon(rec.cat);
                                                        return (
                                                            <div key={rec.name} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${catColor(rec.cat)}`}>
                                                                    <Icon size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-semibold text-slate-700">{rec.name}</p>
                                                                        <div className="flex gap-0.5">{Array.from({ length: rec.rating }).map((_, i) => <Star key={i} size={10} fill="#f59e0b" className="text-amber-400" />)}</div>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 mt-0.5">{rec.note}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <button className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 ml-2">
                                                        <Link size={12} /> Copy shareable link for {city}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {(!u.countries || u.countries.length === 0) && <p className="text-sm text-slate-400">No travels recorded yet.</p>}
                </div>
            </Card>

            <Card className="p-4">
                <SectionHeader title="Travel Badges" />
                <div className="flex gap-3 flex-wrap">
                    {[["🌎", `${u.countriesVisited} Countries`], ["🍜", "Foodie Explorer"], ["⛰️", "Adventure Seeker"], ["📸", "Top Contributor"]].map(([emoji, label]) => (
                        <div key={label} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                            <span className="text-lg">{emoji}</span>
                            <span className="text-xs font-semibold text-amber-700">{label}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// ─── Groups Tab ──────────────────────────────────────────
const GroupsTab = ({ groups, onSelectGroup, onCreateGroup, onNavigate, proposedTrips, allUsers, onViewProfile }) => {
    const [selectedPublicTrip, setSelectedPublicTrip] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", destination: "", dates: "", visibility: "private" });

    const handleCreate = () => {
        if (!newGroup.name.trim()) return;
        onCreateGroup({
            name: newGroup.name,
            destination: newGroup.destination || "TBD",
            dates: newGroup.dates || "TBD",
            visibility: newGroup.visibility,
        });
        setNewGroup({ name: "", destination: "", dates: "", visibility: "private" });
        setShowCreate(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">My Trips</h2>
                <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> New Trip
                </button>
            </div>

            {showCreate && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Create a New Trip</h3>
                    <div className="space-y-3">
                        <input value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Trip name (e.g., Peru July '26)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <input value={newGroup.destination} onChange={e => setNewGroup({ ...newGroup, destination: e.target.value })} placeholder="Destination (or TBD)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <input value={newGroup.dates} onChange={e => setNewGroup({ ...newGroup, dates: e.target.value })} placeholder="Dates (e.g., Jul 5–15, 2026)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Visibility</p>
                            <div className="flex gap-2">
                                {["private", "friends", "public"].map(v => (
                                    <button key={v} onClick={() => setNewGroup({ ...newGroup, visibility: v })}
                                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${newGroup.visibility === v ? "bg-sky-500 text-white border-sky-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                        {v.charAt(0).toUpperCase() + v.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Create Trip</button>
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            {groups.map(g => {
                const statusColors = { planning: "sky", deciding: "amber", "post-trip": "slate" };
                return (
                    <Card key={g.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectGroup(g)}>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0">{g.img}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-bold text-slate-800 truncate">{g.name}</h3>
                                    <Badge color={statusColors[g.status] || "slate"}>{g.status}</Badge>
                                </div>
                                <p className="text-sm text-slate-500 mb-2">
                                    {g.destination !== "TBD" ? `📍 ${g.destination}` : "📍 Destination TBD"} · 📅 {g.dates}
                                </p>
                                <div className="flex items-center justify-between">
                                    <AvatarStack names={g.members} />
                                    <Badge color={g.visibility === "public" ? "green" : g.visibility === "friends" ? "sky" : "slate"}>
                                        {g.visibility}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}

            {selectedPublicTrip && (() => {
                const t = selectedPublicTrip;
                const organizer = allUsers?.[t.organizerHandle];
                return (
                    <Card className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setSelectedPublicTrip(null)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronLeft size={16} className="text-slate-600" /></button>
                            <h3 className="font-bold text-slate-800">Trip Details</h3>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{t.emoji}</span>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{t.destination}</h3>
                                <p className="text-sm text-slate-500">{t.month ? `${t.month} · ` : ""}{t.days} days</p>
                            </div>
                        </div>
                        {t.budgetRange && <div className="flex items-center gap-2 mb-3 p-3 bg-emerald-50 rounded-xl"><DollarSign size={16} className="text-emerald-600" /><span className="text-sm font-medium text-emerald-700">{t.budgetRange}</span></div>}
                        {t.description && <p className="text-sm text-slate-600 mb-3">{t.description}</p>}
                        {t.highlights?.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">Highlights</p>
                                <div className="flex flex-wrap gap-1.5">{t.highlights.map(h => <Badge key={h} color="teal">{h}</Badge>)}</div>
                            </div>
                        )}
                        {t.tags?.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">Tags</p>
                                <div className="flex flex-wrap gap-1.5">{t.tags.map(tag => <Badge key={tag} color="sky">{tag}</Badge>)}</div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                            <Users size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-500">{t.members?.length || 1}/{t.maxMembers} members</span>
                        </div>
                        {organizer && (
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-xs font-semibold text-slate-500 mb-2">Organizer</p>
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => onViewProfile && onViewProfile(t.organizerHandle)}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm">{organizer.avatar}</div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{organizer.name}</p>
                                            <p className="text-xs text-slate-400">{t.organizerHandle}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })()}

            {!selectedPublicTrip && (
                <Card className="p-4">
                    <SectionHeader title="Discover Public Trips" action="Browse All" onAction={() => onNavigate("explore")} />
                    {proposedTrips && proposedTrips.filter(t => t.visibility === "public").length > 0 ? (
                        <div className="space-y-3">
                            {proposedTrips.filter(t => t.visibility === "public").slice(0, 3).map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{t.emoji}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{t.destination}</p>
                                            <p className="text-xs text-slate-400">{t.members?.length || 1}/{t.maxMembers} members{t.month ? ` · ${t.month}` : ""}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedPublicTrip(t)}
                                        className="px-3 py-1.5 bg-sky-50 text-sky-600 text-xs font-semibold rounded-lg hover:bg-sky-100 transition-colors">
                                        Learn More
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">No public trips yet. Check back later or explore destinations!</p>
                    )}
                </Card>
            )}
        </div>
    );
};

// ─── Destination Decider ─────────────────────────────────
const DestinationDecider = ({ group, proposals, onBack, onAddProposal, onToggleVote, onSubmitFinalVote }) => {
    const [phase, setPhase] = useState("proposals");
    const [voted, setVoted] = useState(null);
    const [showAddProposal, setShowAddProposal] = useState(false);
    const [newProposal, setNewProposal] = useState({ dest: "", emoji: "🌍", budget: "", tags: "" });

    const algorithmResults = [
        { dest: "Colombia", emoji: "🇨🇴", score: 92, popularity: 95, budget: 90, time: 88, breakdown: "3/3 members proposed or ranked highly. Average budget $1,800 fits the $1,500-$2,500 range. Ideal for a 10-day trip in September." },
        { dest: "Vietnam & Cambodia", emoji: "🇻🇳", score: 84, popularity: 80, budget: 95, time: 78, breakdown: "2/3 members interested. Most budget-friendly at $1,500. Ideal duration is 12-14 days which slightly exceeds your 10-day window." },
        { dest: "Croatia & Montenegro", emoji: "🇭🇷", score: 78, popularity: 70, budget: 75, time: 85, breakdown: "2/3 members interested. Budget at $2,100 is within range. Great for September weather and fits 10-day timeframe." },
    ];

    const handleAddProposal = () => {
        if (!newProposal.dest.trim()) return;
        onAddProposal({
            dest: newProposal.dest,
            emoji: newProposal.emoji || "🌍",
            budget: newProposal.budget || "TBD",
            tags: newProposal.tags ? newProposal.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        });
        setNewProposal({ dest: "", emoji: "🌍", budget: "", tags: "" });
        setShowAddProposal(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronLeft size={20} className="text-slate-600" /></button>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Destination Decider</h2>
                    <p className="text-sm text-slate-500">{group.name} · {group.dates}</p>
                </div>
            </div>

            <Card className="p-4">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Settings size={16} className="text-sky-500" /> Trip Parameters</h3>
                <div className="grid grid-cols-3 gap-3">
                    {[["Travel Window", "Sep 2026", Calendar], ["Duration", "10 days", Clock], ["Budget/Person", "$1,500-$2,500", DollarSign]].map(([label, val, Icon]) => (
                        <div key={label} className="p-3 bg-slate-50 rounded-xl text-center">
                            <Icon size={16} className="text-sky-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-400">{label}</p>
                            <p className="text-sm font-bold text-slate-700">{val}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                {[["proposals", "Proposals"], ["results", "Algorithm Results"], ["vote", "Final Vote"]].map(([id, label]) => (
                    <button key={id} onClick={() => setPhase(id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${phase === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {phase === "proposals" && (
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">Each member submits 3-5 destination proposals with priority rankings.</p>

                    {showAddProposal && (
                        <Card className="p-4 border-2 border-sky-200 border-dashed">
                            <h3 className="font-semibold text-slate-700 mb-3">Add Proposal</h3>
                            <div className="space-y-2.5">
                                <input value={newProposal.dest} onChange={e => setNewProposal({ ...newProposal, dest: e.target.value })} placeholder="Destination (e.g., Japan & South Korea)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                <div className="flex gap-2">
                                    <input value={newProposal.emoji} onChange={e => setNewProposal({ ...newProposal, emoji: e.target.value })} placeholder="Flag emoji" className="w-1/4 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                    <input value={newProposal.budget} onChange={e => setNewProposal({ ...newProposal, budget: e.target.value })} placeholder="Budget (e.g., $2,000)" className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                </div>
                                <input value={newProposal.tags} onChange={e => setNewProposal({ ...newProposal, tags: e.target.value })} placeholder="Tags (comma-separated: Culture, Food, Beach)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                <div className="flex gap-2">
                                    <button onClick={handleAddProposal} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Add Proposal</button>
                                    <button onClick={() => setShowAddProposal(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {proposals.map(p => (
                        <Card key={p.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{p.emoji}</span>
                                    <div>
                                        <p className="font-bold text-slate-800">{p.dest}</p>
                                        <p className="text-xs text-slate-400">Proposed by {p.user} · Rank #{p.rank}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-slate-600">{p.budget}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1.5 flex-wrap">
                                    {p.tags.map(t => <Badge key={t} color="teal">{t}</Badge>)}
                                </div>
                                <button onClick={() => onToggleVote(p.id)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${p.votes.includes("Alex") ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                    <ThumbsUp size={12} /> {p.votes.length}
                                </button>
                            </div>
                        </Card>
                    ))}

                    <button onClick={() => setShowAddProposal(true)} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-medium rounded-xl hover:border-sky-300 hover:text-sky-600 transition-colors flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Your Proposal
                    </button>

                    <button onClick={() => setPhase("results")} className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2">
                        <Zap size={18} /> Run Algorithm
                    </button>
                </div>
            )}

            {phase === "results" && (
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">Our algorithm analyzed all proposals against your group's parameters. Here are the top matches:</p>
                    {algorithmResults.map((r, i) => (
                        <Card key={r.dest} className={`p-4 ${i === 0 ? "border-2 border-sky-300" : ""}`}>
                            {i === 0 && <div className="flex items-center gap-1.5 text-sky-600 text-xs font-bold mb-2"><Award size={14} /> TOP RECOMMENDATION</div>}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{r.emoji}</span>
                                    <p className="font-bold text-slate-800 text-lg">{r.dest}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-sky-600">{r.score}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Match Score</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {[["Popularity", r.popularity], ["Budget Fit", r.budget], ["Time Fit", r.time]].map(([label, val]) => (
                                    <div key={label} className="text-center">
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                                            <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${val}%` }} />
                                        </div>
                                        <p className="text-[10px] text-slate-400">{label} {val}%</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg">{r.breakdown}</p>
                        </Card>
                    ))}
                    <button onClick={() => setPhase("vote")} className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                        Proceed to Final Vote
                    </button>
                </div>
            )}

            {phase === "vote" && (
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">Vote for your preferred destination. The group's choice will be locked in.</p>
                    {algorithmResults.map(r => (
                        <Card key={r.dest} onClick={() => setVoted(r.dest)}
                            className={`p-4 cursor-pointer transition-all ${voted === r.dest ? "border-2 border-sky-400 bg-sky-50" : "hover:shadow-md"}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{r.emoji}</span>
                                    <div>
                                        <p className="font-bold text-slate-800">{r.dest}</p>
                                        <p className="text-xs text-slate-400">Score: {r.score}/100</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${voted === r.dest ? "border-sky-500 bg-sky-500" : "border-slate-300"}`}>
                                    {voted === r.dest && <Check size={14} className="text-white" />}
                                </div>
                            </div>
                        </Card>
                    ))}
                    {voted && (
                        <button onClick={() => onSubmitFinalVote(voted)} className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                            <Check size={18} /> Submit Vote for {voted}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Planning Tab ────────────────────────────────────────
const PlanningTab = ({ group, itinerary, onAddItem, onDeleteItem, onUpdateItemStatus, onEditItem }) => {
    const [expandedDay, setExpandedDay] = useState(itinerary[0]?.date || null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newItem, setNewItem] = useState({ name: "", cat: "excursion", date: itinerary[0]?.date || "", link: "", cost: "", owner: "", time: "" });

    const startEdit = (item) => {
        setEditingItem(item.id);
        setEditForm({ name: item.name, cost: item.cost || "", time: item.time || "", owner: item.owner || "", link: item.link || "" });
    };

    const saveEdit = (itemId) => {
        onEditItem(itemId, { name: editForm.name, cost: parseFloat(editForm.cost) || 0, time: editForm.time, owner: editForm.owner || null, link: editForm.link || null });
        setEditingItem(null);
    };

    const catMap = { "Excursion": "excursion", "Accommodation": "accommodation", "Dining": "dining", "Transportation": "transport" };
    const catMapReverse = { excursion: "Excursion", accommodation: "Accommodation", dining: "Dining", transport: "Transportation" };

    const allItems = itinerary.flatMap(d => d.items);
    const bookedCount = allItems.filter(i => i.status === "booked" || i.status === "confirmed").length;
    const needsBookingCount = allItems.filter(i => i.status === "needs_booking").length;
    const unassignedCount = allItems.filter(i => !i.owner).length;

    const handleAdd = () => {
        if (!newItem.name.trim()) return;
        onAddItem({
            name: newItem.name,
            cat: newItem.cat,
            date: newItem.date || itinerary[0]?.date,
            link: newItem.link || null,
            cost: parseFloat(newItem.cost) || 0,
            owner: newItem.owner || null,
            time: newItem.time || "12:00 PM",
            status: "needs_booking",
        });
        setNewItem({ name: "", cat: "excursion", date: itinerary[0]?.date || "", link: "", cost: "", owner: "", time: "" });
        setShowAddItem(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Trip Itinerary</h2>
                    <p className="text-sm text-slate-500">{group.destination} · {group.dates} · {group.members.length} travelers</p>
                </div>
                <button onClick={() => setShowAddItem(!showAddItem)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> Add
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
                {[["Booked", bookedCount, "green"], ["Needs Booking", needsBookingCount, "amber"], ["Unassigned", unassignedCount, "rose"]].map(([label, count, color]) => (
                    <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0 ${color === "green" ? "bg-emerald-50" : color === "amber" ? "bg-amber-50" : "bg-rose-50"}`}>
                        <span className={`text-lg font-bold ${color === "green" ? "text-emerald-600" : color === "amber" ? "text-amber-600" : "text-rose-600"}`}>{count}</span>
                        <span className="text-xs text-slate-600">{label}</span>
                    </div>
                ))}
            </div>

            {showAddItem && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Add Itinerary Item</h3>
                    <div className="space-y-2.5">
                        <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name (e.g., Machu Picchu sunrise tour)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <select value={catMapReverse[newItem.cat] || "Excursion"} onChange={e => setNewItem({ ...newItem, cat: catMap[e.target.value] || "excursion" })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                <option>Excursion</option><option>Accommodation</option><option>Dining</option><option>Transportation</option>
                            </select>
                            <select value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                {itinerary.map(d => <option key={d.date} value={d.date}>{d.date}</option>)}
                            </select>
                        </div>
                        <input value={newItem.time} onChange={e => setNewItem({ ...newItem, time: e.target.value })} placeholder="Time (e.g., 10:00 AM)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <input value={newItem.link} onChange={e => setNewItem({ ...newItem, link: e.target.value })} placeholder="Link (GetYourGuide, Viator, Airbnb, etc.)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <input value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: e.target.value })} placeholder="Est. cost ($)" type="number" className="w-1/3 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                            <select value={newItem.owner} onChange={e => setNewItem({ ...newItem, owner: e.target.value })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                <option value="">Assign to...</option>
                                {group.members.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Add Item</button>
                            <button onClick={() => setShowAddItem(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Zap size={12} className="text-amber-500" /> Affiliate links from supported platforms are automatically tracked for commission.</p>
                </Card>
            )}

            {itinerary.map(day => {
                const isExpanded = expandedDay === day.date;
                const dayBookedCount = day.items.filter(i => i.status === "booked" || i.status === "confirmed").length;
                return (
                    <div key={day.date}>
                        <button onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isExpanded ? "bg-sky-50 border border-sky-200" : "bg-white border border-slate-100 hover:shadow-sm"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isExpanded ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                                    {day.date.split(" ")[1]}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">{day.label}</p>
                                    <p className="text-xs text-slate-400">{day.items.length} items · {dayBookedCount} booked</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {day.items.map((item, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${item.status === "booked" ? "bg-emerald-400" : item.status === "needs_booking" ? "bg-amber-400" : "bg-sky-400"}`} />
                                    ))}
                                </div>
                                {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                            </div>
                        </button>
                        {isExpanded && (
                            <div className="ml-5 border-l-2 border-sky-200 pl-4 mt-2 space-y-3 pb-2">
                                {day.items.map(item => {
                                    const Icon = catIcon(item.cat);
                                    const isEditingThis = editingItem === item.id;
                                    return (
                                        <Card key={item.id} className={`p-3 ${isEditingThis ? "border-2 border-sky-200" : ""}`}>
                                            {isEditingThis ? (
                                                <div className="space-y-2">
                                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                                    <div className="flex gap-2">
                                                        <input value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} placeholder="Time" className="w-1/3 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                                        <input value={editForm.cost} onChange={e => setEditForm({ ...editForm, cost: e.target.value })} placeholder="Cost" type="number" className="w-1/3 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                                        <select value={editForm.owner || ""} onChange={e => setEditForm({ ...editForm, owner: e.target.value })} className="w-1/3 px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                                            <option value="">Unassigned</option>
                                                            {group.members.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <input value={editForm.link || ""} onChange={e => setEditForm({ ...editForm, link: e.target.value })} placeholder="Link (optional)" className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => saveEdit(item.id)} className="flex-1 py-2 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600">Save</button>
                                                        <button onClick={() => setEditingItem(null)} className="px-3 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${catColor(item.cat)}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-semibold text-slate-700 text-sm">{item.name}</p>
                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} /> {item.time}</span>
                                                                    {item.cost > 0 && <span className="text-xs text-slate-400">${item.cost}/pp</span>}
                                                                    {item.owner && <span className="text-xs text-slate-500 flex items-center gap-1"><User size={11} /> {item.owner}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => onUpdateItemStatus(item.id, item.status === "booked" ? "needs_booking" : "booked")} title="Toggle status">
                                                                    <StatusBadge status={item.status} />
                                                                </button>
                                                                <button onClick={() => startEdit(item)} className="text-slate-300 hover:text-sky-500 transition-colors p-1"><Edit3 size={14} /></button>
                                                                <button onClick={() => onDeleteItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14} /></button>
                                                            </div>
                                                        </div>
                                                        {item.link && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-2.5 py-1.5 rounded-lg">
                                                                <ExternalLink size={11} />
                                                                <span className="font-medium">{item.link}</span>
                                                                <Badge color="green">Affiliate</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── During Trip Tab ─────────────────────────────────────
const DuringTripTab = ({ itinerary, onToggleComplete }) => {
    const [selectedDay, setSelectedDay] = useState(0);
    const [filterCat, setFilterCat] = useState("all");
    const days = itinerary;
    const day = days[selectedDay];

    if (!day) return <EmptyState icon={Map} title="No itinerary yet" desc="Add items in the Plan tab first." />;

    const completedCount = day.items.filter(i => i.completed).length;
    const totalCount = day.items.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const filteredItems = filterCat === "all" ? day.items : day.items.filter(i => i.cat === filterCat);
    const dayCats = [...new Set(day.items.map(i => i.cat))];

    const travelEstimate = (fromCat, toCat) => {
        if (fromCat === "accommodation" || toCat === "accommodation") return "~20 min by taxi";
        if (fromCat === "transport" || toCat === "transport") return "~30 min transfer";
        if (fromCat === "dining" && toCat === "excursion") return "~15 min walk";
        if (fromCat === toCat) return "~10 min walk";
        return "~15 min by car";
    };

    // Overall trip progress
    const allItems = itinerary.flatMap(d => d.items);
    const allCompleted = allItems.filter(i => i.completed).length;
    const overallPct = allItems.length > 0 ? Math.round((allCompleted / allItems.length) * 100) : 0;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Today's Plan</h2>

            <Card className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm opacity-80">Day Progress</p>
                    <p className="text-sm font-bold">{completedCount}/{totalCount} done</p>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-xs opacity-80">
                    <span>{progressPct}% of today complete</span>
                    <span>Trip overall: {overallPct}%</span>
                </div>
            </Card>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d, i) => {
                    const dc = d.items.filter(it => it.completed).length;
                    const dt = d.items.length;
                    return (
                        <button key={d.date} onClick={() => { setSelectedDay(i); setFilterCat("all"); }}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedDay === i ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            <span>{d.date}</span>
                            {dt > 0 && <span className="ml-1 opacity-60">({dc}/{dt})</span>}
                        </button>
                    );
                })}
            </div>

            <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-emerald-100 via-sky-100 to-teal-100 relative flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 20h40M20 0v40\" stroke=\"%23000\" stroke-width=\"0.5\" fill=\"none\"/%3E%3C/svg%3E')" }} />
                    {day.items.map((item, i) => (
                        <div key={item.id} className="absolute" style={{ left: `${15 + (i * 20)}%`, top: `${25 + (i % 2 === 0 ? 0 : 30)}%` }}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md text-white text-xs font-bold ${item.completed ? "bg-emerald-400" : item.cat === "accommodation" ? "bg-violet-500" : item.cat === "dining" ? "bg-orange-500" : item.cat === "excursion" ? "bg-emerald-500" : "bg-sky-500"}`}>{i + 1}</div>
                        </div>
                    ))}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                        <p className="text-xs font-medium text-slate-600 flex items-center gap-1"><Map size={12} className="text-sky-500" /> Interactive Map</p>
                    </div>
                </div>
            </Card>

            <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterCat("all")}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === "all" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    All
                </button>
                {dayCats.map(cat => {
                    const CatIcon = catIcon(cat);
                    const catLabel = { accommodation: "Stay", dining: "Food", excursion: "Activity", transport: "Transport" }[cat] || cat;
                    return (
                        <button key={cat} onClick={() => setFilterCat(cat)}
                            className={`flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === cat ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            <CatIcon size={12} /> {catLabel}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-3">
                {filteredItems.map((item, i) => {
                    const globalIdx = day.items.indexOf(item);
                    const nextItem = day.items[globalIdx + 1];
                    return (
                        <div key={item.id}>
                            <Card className={`p-4 ${item.completed ? "opacity-60" : ""}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${item.completed ? "bg-emerald-400" : item.cat === "accommodation" ? "bg-violet-500" : item.cat === "dining" ? "bg-orange-500" : item.cat === "excursion" ? "bg-emerald-500" : "bg-sky-500"}`}>{item.completed ? <Check size={18} /> : globalIdx + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-slate-800 ${item.completed ? "line-through" : ""}`}>{item.name}</p>
                                            {item.completed && <Badge color="green">Done</Badge>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-slate-500 flex items-center gap-1"><Clock size={13} /> {item.time}</span>
                                            {item.cost > 0 && <span className="text-sm text-slate-500">${item.cost}</span>}
                                            {item.owner && <span className="text-xs text-slate-400 flex items-center gap-1"><User size={11} /> {item.owner}</span>}
                                        </div>
                                        <button className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors">
                                            <Navigation size={12} /> Open in Maps
                                        </button>
                                    </div>
                                    <button onClick={() => onToggleComplete(item.id)} className={`transition-colors ${item.completed ? "text-emerald-500" : "text-slate-300 hover:text-emerald-500"}`}><Check size={20} /></button>
                                </div>
                            </Card>
                            {nextItem && filterCat === "all" && (
                                <div className="flex items-center gap-2 ml-5 py-1.5">
                                    <div className="w-0.5 h-4 bg-slate-200" />
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><Navigation size={10} /> {travelEstimate(item.cat, nextItem.cat)}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredItems.length === 0 && <EmptyState icon={Filter} title="No items" desc="No items in this category for this day." />}

            {progressPct === 100 && (
                <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><Award size={24} className="text-white" /></div>
                        <div>
                            <p className="font-bold text-emerald-700">Day Complete!</p>
                            <p className="text-sm text-slate-500">You've completed everything for {day.date}. Time to relax or explore on your own!</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

// ─── Expenses Tab ────────────────────────────────────────
const ExpensesTab = ({ expenses, members, onAddExpense, onDeleteExpense, onEditExpense }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [finalized, setFinalized] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editExpForm, setEditExpForm] = useState({});
    const [newExpense, setNewExpense] = useState({ desc: "", amount: "", paidBy: "", splitMembers: [...members], currency: "USD" });

    const startEditExpense = (exp) => {
        setEditingExpense(exp.id);
        setEditExpForm({ desc: exp.desc, amount: exp.amount, paidBy: exp.paidBy });
    };

    const saveEditExpense = (expId) => {
        onEditExpense(expId, { desc: editExpForm.desc, amount: parseFloat(editExpForm.amount) || 0, paidBy: editExpForm.paidBy });
        setEditingExpense(null);
    };

    const toggleSplitMember = (member) => {
        setNewExpense(prev => ({
            ...prev,
            splitMembers: prev.splitMembers.includes(member)
                ? prev.splitMembers.filter(m => m !== member)
                : [...prev.splitMembers, member]
        }));
    };

    const handleAdd = () => {
        if (!newExpense.desc.trim() || !newExpense.amount || !newExpense.paidBy || newExpense.splitMembers.length === 0) return;
        onAddExpense({
            desc: newExpense.desc,
            amount: parseFloat(newExpense.amount),
            paidBy: newExpense.paidBy,
            split: [...newExpense.splitMembers],
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        });
        setNewExpense({ desc: "", amount: "", paidBy: "", splitMembers: [...members], currency: "USD" });
        setShowAdd(false);
    };

    const totals = {};
    members.forEach(m => { totals[m] = { paid: 0, owes: 0 }; });
    expenses.forEach(exp => {
        if (totals[exp.paidBy]) totals[exp.paidBy].paid += exp.amount;
        const share = exp.amount / exp.split.length;
        exp.split.forEach(m => { if (totals[m]) totals[m].owes += share; });
    });

    const balances = {};
    members.forEach(m => { balances[m] = totals[m].paid - totals[m].owes; });

    const settlements = [];
    const debtors = members.filter(m => balances[m] < -0.01).map(m => ({ name: m, amount: -balances[m] }));
    const creditors = members.filter(m => balances[m] > 0.01).map(m => ({ name: m, amount: balances[m] }));
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    let di = 0, ci = 0;
    const dCopy = [...debtors.map(d => ({ ...d }))];
    const cCopy = [...creditors.map(c => ({ ...c }))];
    while (di < dCopy.length && ci < cCopy.length) {
        const payment = Math.min(dCopy[di].amount, cCopy[ci].amount);
        if (payment > 0.01) settlements.push({ from: dCopy[di].name, to: cCopy[ci].name, amount: payment.toFixed(2) });
        dCopy[di].amount -= payment;
        cCopy[ci].amount -= payment;
        if (dCopy[di].amount < 0.01) di++;
        if (cCopy[ci].amount < 0.01) ci++;
    }

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Expenses</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> Add Expense
                </button>
            </div>

            <Card className="p-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white border-0">
                <p className="text-sm opacity-80 mb-1">Total Trip Spending</p>
                <p className="text-3xl font-black">${totalSpent.toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-1">${members.length > 0 ? (totalSpent / members.length).toFixed(0) : 0} per person average</p>
            </Card>

            {showAdd && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">New Expense</h3>
                    <div className="space-y-2.5">
                        <input value={newExpense.desc} onChange={e => setNewExpense({ ...newExpense, desc: e.target.value })} placeholder="Description (e.g., Dinner at Central)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <input value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="Amount" type="number" className="w-1/3 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                            <select value={newExpense.currency} onChange={e => setNewExpense({ ...newExpense, currency: e.target.value })} className="w-1/3 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                <option>USD</option><option>PEN</option><option>EUR</option>
                            </select>
                            <select value={newExpense.paidBy} onChange={e => setNewExpense({ ...newExpense, paidBy: e.target.value })} className="w-1/3 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                <option value="">Paid by...</option>{members.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Split between:</p>
                            <div className="flex gap-2 flex-wrap">
                                {members.map(m => (
                                    <label key={m} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-sm cursor-pointer hover:bg-slate-100">
                                        <input type="checkbox" checked={newExpense.splitMembers.includes(m)} onChange={() => toggleSplitMember(m)} className="rounded" />
                                        <span>{m}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Add Expense</button>
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="p-4">
                <SectionHeader title="Running Balances" />
                <div className="space-y-2">
                    {members.map(m => {
                        const bal = balances[m];
                        const isPositive = bal > 0.01;
                        const isNeg = bal < -0.01;
                        return (
                            <div key={m} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                    <Avatar name={m} size="sm" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{m}</p>
                                        <p className="text-xs text-slate-400">Paid ${totals[m].paid.toFixed(0)}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold ${isPositive ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-slate-400"}`}>
                                    {isPositive ? `+$${bal.toFixed(2)}` : isNeg ? `-$${(-bal).toFixed(2)}` : "Settled"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card className="p-4">
                <SectionHeader title="All Expenses" />
                <div className="space-y-2">
                    {expenses.map(exp => (
                        <div key={exp.id} className="py-2.5 border-b border-slate-50 last:border-0">
                            {editingExpense === exp.id ? (
                                <div className="space-y-2 p-2 bg-sky-50 rounded-xl">
                                    <input value={editExpForm.desc} onChange={e => setEditExpForm({ ...editExpForm, desc: e.target.value })} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                    <div className="flex gap-2">
                                        <input value={editExpForm.amount} onChange={e => setEditExpForm({ ...editExpForm, amount: e.target.value })} type="number" placeholder="Amount" className="w-1/2 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                        <select value={editExpForm.paidBy} onChange={e => setEditExpForm({ ...editExpForm, paidBy: e.target.value })} className="w-1/2 px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                            {members.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => saveEditExpense(exp.id)} className="flex-1 py-2 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600">Save</button>
                                        <button onClick={() => setEditingExpense(null)} className="px-3 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <CreditCard size={14} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{exp.desc}</p>
                                            <p className="text-xs text-slate-400">Paid by {exp.paidBy} · {exp.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-700">${exp.amount}</p>
                                        <button onClick={() => startEditExpense(exp)} className="text-slate-300 hover:text-sky-500 transition-colors"><Edit3 size={14} /></button>
                                        <button onClick={() => onDeleteExpense(exp.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {expenses.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No expenses yet.</p>}
                </div>
            </Card>

            <Card className={`p-4 ${finalized ? "border-2 border-emerald-300" : ""}`}>
                <SectionHeader title="Settlement Summary" />
                {!finalized ? (
                    <>
                        <p className="text-sm text-slate-500 mb-3">Click "Finalize" when all expenses have been added.</p>
                        <button onClick={() => setFinalized(true)} className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
                            Finalize Expenses
                        </button>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-2"><Check size={16} /> Expenses finalized!</div>
                        {settlements.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Avatar name={s.from} size="sm" />
                                    <ArrowRight size={14} className="text-slate-400" />
                                    <Avatar name={s.to} size="sm" />
                                    <span className="text-sm text-slate-600"><strong>{s.from}</strong> pays <strong>{s.to}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-slate-700">${s.amount}</p>
                                    <button className="px-2.5 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg hover:bg-sky-200 transition-colors">Venmo</button>
                                </div>
                            </div>
                        ))}
                        {settlements.length === 0 && <p className="text-sm text-slate-400">Everyone is settled up!</p>}
                        <button onClick={() => setFinalized(false)} className="w-full py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Re-open Expenses</button>
                    </div>
                )}
            </Card>
        </div>
    );
};

// ─── Post-Trip Tab ───────────────────────────────────────
const PostTripTab = ({ tripRecs, onAddRec, onDeleteRec }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [expandedCat, setExpandedCat] = useState("restaurant");
    const [newRec, setNewRec] = useState({ name: "", cat: "restaurant", city: "", rating: 5, note: "", link: "" });

    const handleAdd = () => {
        if (!newRec.name.trim()) return;
        onAddRec({ ...newRec });
        setNewRec({ name: "", cat: "restaurant", city: "", rating: 5, note: "", link: "" });
        setShowAdd(false);
    };

    const catMapOptions = { "Restaurant": "restaurant", "Hotel": "hotel", "Excursion": "excursion", "Cafe": "cafe", "Bar": "bar", "Store": "store" };

    const catsWithCounts = [
        { id: "restaurant", label: "Restaurants", icon: Utensils },
        { id: "hotel", label: "Hotels", icon: Home },
        { id: "excursion", label: "Excursions", icon: Compass },
        { id: "cafe", label: "Cafes", icon: Coffee },
        { id: "bar", label: "Bars", icon: Music },
        { id: "store", label: "Stores", icon: ShoppingBag },
    ].map(c => ({ ...c, count: tripRecs.filter(r => r.cat === c.id).length }));

    const filteredRecs = tripRecs.filter(r => r.cat === expandedCat);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Recommendations</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> Add
                </button>
            </div>

            <p className="text-sm text-slate-500">Share your favorite spots so other travelers can benefit from your experience!</p>

            {showAdd && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Add Recommendation</h3>
                    <div className="space-y-2.5">
                        <input value={newRec.name} onChange={e => setNewRec({ ...newRec, name: e.target.value })} placeholder="Place name" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <select value={newRec.cat} onChange={e => setNewRec({ ...newRec, cat: e.target.value })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                {Object.entries(catMapOptions).map(([label, val]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                            <input value={newRec.city} onChange={e => setNewRec({ ...newRec, city: e.target.value })} placeholder="City" className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setNewRec({ ...newRec, rating: n })} className="p-1 hover:scale-110 transition-transform">
                                    <Star size={20} fill={n <= newRec.rating ? "#f59e0b" : "none"} className={n <= newRec.rating ? "text-amber-400" : "text-slate-300"} />
                                </button>
                            ))}
                        </div>
                        <textarea value={newRec.note} onChange={e => setNewRec({ ...newRec, note: e.target.value })} placeholder="Your personal review / tips..." rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" />
                        <input value={newRec.link} onChange={e => setNewRec({ ...newRec, link: e.target.value })} placeholder="Link (optional)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Save Recommendation</button>
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
                {catsWithCounts.map(cat => {
                    const Icon = cat.icon;
                    const active = expandedCat === cat.id;
                    return (
                        <button key={cat.id} onClick={() => setExpandedCat(cat.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${active ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            <Icon size={14} /> {cat.label} <span className="opacity-60">({cat.count})</span>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-3">
                {filteredRecs.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No recommendations in this category yet.</p>}
                {filteredRecs.map(rec => (
                    <Card key={rec.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-bold text-slate-800">{rec.name}</p>
                                <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={11} /> {rec.city}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">{Array.from({ length: rec.rating }).map((_, i) => <Star key={i} size={12} fill="#f59e0b" className="text-amber-400" />)}</div>
                                <button onClick={() => onDeleteRec(rec.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{rec.note}</p>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"><Bookmark size={12} /> Save</button>
                            <button className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"><Share2 size={12} /> Share</button>
                            {rec.link && <button className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"><ExternalLink size={12} /> View</button>}
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-4 bg-gradient-to-r from-teal-50 to-sky-50 border-teal-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0"><Link size={18} className="text-white" /></div>
                    <div>
                        <p className="font-semibold text-slate-700">Share your travel guide</p>
                        <p className="text-sm text-slate-500 mb-2">Send your complete recommendations to friends.</p>
                        <button className="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors">Copy Shareable Link</button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ─── Members Tab ────────────────────────────────────────
const MembersTab = ({ group, onAddMember, onRemoveMember }) => {
    const [showInvite, setShowInvite] = useState(false);
    const [inviteName, setInviteName] = useState("");

    const handleInvite = () => {
        if (!inviteName.trim()) return;
        onAddMember(group.id, inviteName.trim());
        setInviteName("");
        setShowInvite(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Members</h2>
                <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> Invite
                </button>
            </div>

            <p className="text-sm text-slate-500">{group.members.length} member{group.members.length !== 1 ? "s" : ""} in this trip group</p>

            {showInvite && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Invite a Member</h3>
                    <div className="space-y-2.5">
                        <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Member name (e.g., Taylor)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                            onKeyDown={e => e.key === "Enter" && handleInvite()} />
                        <div className="flex gap-2">
                            <button onClick={handleInvite} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Add Member</button>
                            <button onClick={() => setShowInvite(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                {group.members.map(member => (
                    <Card key={member} className="p-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar name={member} size="md" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{member}</p>
                                    <p className="text-xs text-slate-400">{member === "Alex" ? "You · Organizer" : "Member"}</p>
                                </div>
                            </div>
                            {member !== "Alex" && (
                                <button onClick={() => onRemoveMember(group.id, member)} className="text-slate-300 hover:text-rose-500 transition-colors p-1" title="Remove member"><X size={16} /></button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-4 bg-gradient-to-r from-sky-50 to-teal-50 border-sky-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0"><Send size={18} className="text-white" /></div>
                    <div>
                        <p className="font-semibold text-slate-700">Share Invite Link</p>
                        <p className="text-sm text-slate-500 mb-2">Send a link so friends can join your trip group directly.</p>
                        <button className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">Copy Invite Link</button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ─── Polls Tab ──────────────────────────────────────────
const PollsTab = ({ polls, onAddPoll, onVotePoll, onClosePoll, onDeletePoll }) => {
    const [showCreate, setShowCreate] = useState(false);
    const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] });
    const [filter, setFilter] = useState("all");

    const handleAddOption = () => {
        setNewPoll(prev => ({ ...prev, options: [...prev.options, ""] }));
    };

    const handleUpdateOption = (index, value) => {
        setNewPoll(prev => ({ ...prev, options: prev.options.map((o, i) => i === index ? value : o) }));
    };

    const handleRemoveOption = (index) => {
        if (newPoll.options.length <= 2) return;
        setNewPoll(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
    };

    const handleCreate = () => {
        if (!newPoll.question.trim()) return;
        const validOptions = newPoll.options.filter(o => o.trim());
        if (validOptions.length < 2) return;
        onAddPoll({ question: newPoll.question, options: validOptions });
        setNewPoll({ question: "", options: ["", ""] });
        setShowCreate(false);
    };

    const filteredPolls = filter === "all" ? polls : polls.filter(p => p.status === filter);
    const openCount = polls.filter(p => p.status === "open").length;
    const closedCount = polls.filter(p => p.status === "closed").length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Group Polls</h2>
                <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> New Poll
                </button>
            </div>

            <p className="text-sm text-slate-500">Quick votes for group decisions. Everyone's opinion counts!</p>

            {showCreate && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Create a Poll</h3>
                    <div className="space-y-2.5">
                        <input value={newPoll.question} onChange={e => setNewPoll({ ...newPoll, question: e.target.value })} placeholder="Your question (e.g., Where to eat tonight?)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <p className="text-xs font-semibold text-slate-500">Options</p>
                        {newPoll.options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                                <input value={opt} onChange={e => handleUpdateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                                {newPoll.options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(i)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><X size={16} /></button>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddOption} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 text-sm font-medium rounded-xl hover:border-sky-300 hover:text-sky-600 transition-colors flex items-center justify-center gap-1">
                            <Plus size={14} /> Add Option
                        </button>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Create Poll</button>
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex gap-2">
                {[["all", `All (${polls.length})`], ["open", `Open (${openCount})`], ["closed", `Closed (${closedCount})`]].map(([id, label]) => (
                    <button key={id} onClick={() => setFilter(id)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${filter === id ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {filteredPolls.map(poll => {
                const totalVotes = poll.options.reduce((s, o) => s + o.voters.length, 0);
                const userVotedOption = poll.options.find(o => o.voters.includes("Alex"));
                const isClosed = poll.status === "closed";
                const winningOption = poll.options.reduce((max, o) => o.voters.length > max.voters.length ? o : max, poll.options[0]);

                return (
                    <Card key={poll.id} className={`p-4 ${isClosed ? "opacity-70" : ""}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-slate-800">{poll.question}</p>
                                    <Badge color={isClosed ? "slate" : "green"}>{isClosed ? "Closed" : "Open"}</Badge>
                                </div>
                                <p className="text-xs text-slate-400">by {poll.creator} · {poll.createdAt} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex gap-1">
                                {!isClosed && poll.creator === "Alex" && (
                                    <button onClick={() => onClosePoll(poll.id)} className="text-slate-300 hover:text-amber-500 transition-colors p-1" title="Close poll"><Check size={14} /></button>
                                )}
                                <button onClick={() => onDeletePoll(poll.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {poll.options.map(opt => {
                                const pct = totalVotes > 0 ? Math.round((opt.voters.length / totalVotes) * 100) : 0;
                                const isMyVote = opt.voters.includes("Alex");
                                const isWinner = isClosed && opt === winningOption;
                                return (
                                    <button key={opt.id} onClick={() => !isClosed && onVotePoll(poll.id, opt.id)}
                                        disabled={isClosed}
                                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${isMyVote ? "border-sky-400 bg-sky-50" : "border-slate-100 hover:border-slate-200"} ${isClosed ? "cursor-default" : "cursor-pointer"} ${isWinner ? "border-emerald-400 bg-emerald-50" : ""}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                                                {isMyVote && <Badge color="sky">Your vote</Badge>}
                                                {isWinner && <Badge color="green">Winner</Badge>}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500">{opt.voters.length} ({pct}%)</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${isWinner ? "bg-emerald-400" : isMyVote ? "bg-sky-400" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        {(isClosed || isMyVote) && opt.voters.length > 0 && (
                                            <div className="flex gap-1 mt-1.5">
                                                {opt.voters.map(v => <Avatar key={v} name={v} size="sm" />)}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                );
            })}

            {filteredPolls.length === 0 && <EmptyState icon={BarChart3} title="No polls yet" desc="Create a poll to get the group's opinion on anything." />}
        </div>
    );
};

// ─── Packing Checklist Tab ───────────────────────────────
const PackingChecklistTab = ({ packingList, members, onAddItem, onDeleteItem, onTogglePacked, onClaimItem, onUnclaimItem }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [filterCat, setFilterCat] = useState("all");
    const [newItem, setNewItem] = useState({ name: "", category: "clothing", shared: false, quantity: 1 });

    const categories = [
        { id: "documents", label: "Documents", icon: CreditCard, color: "text-sky-500 bg-sky-50" },
        { id: "clothing", label: "Clothing", icon: ShoppingBag, color: "text-violet-500 bg-violet-50" },
        { id: "toiletries", label: "Toiletries", icon: Sunrise, color: "text-rose-500 bg-rose-50" },
        { id: "health", label: "Health", icon: Heart, color: "text-emerald-500 bg-emerald-50" },
        { id: "electronics", label: "Electronics", icon: Zap, color: "text-amber-500 bg-amber-50" },
        { id: "gear", label: "Gear", icon: Compass, color: "text-teal-500 bg-teal-50" },
    ];

    const handleAdd = () => {
        if (!newItem.name.trim()) return;
        onAddItem({ ...newItem, quantity: parseInt(newItem.quantity) || 1 });
        setNewItem({ name: "", category: "clothing", shared: false, quantity: 1 });
        setShowAdd(false);
    };

    const filteredItems = filterCat === "all" ? packingList : packingList.filter(i => i.category === filterCat);
    const grouped = {};
    filteredItems.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    const totalItems = packingList.length;
    const packedItems = packingList.filter(i => i.packed).length;
    const unclaimedItems = packingList.filter(i => !i.claimedBy && i.shared).length;
    const progressPct = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Packing Checklist</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus size={16} /> Add Item
                </button>
            </div>

            <Card className="p-4 bg-gradient-to-r from-violet-500 to-sky-500 text-white border-0">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm opacity-80">Packing Progress</p>
                    <p className="text-sm font-bold">{packedItems}/{totalItems} items</p>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex gap-4 text-xs opacity-80">
                    <span>{progressPct}% packed</span>
                    {unclaimedItems > 0 && <span>{unclaimedItems} shared items need claiming</span>}
                </div>
            </Card>

            {showAdd && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Add Packing Item</h3>
                    <div className="space-y-2.5">
                        <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name (e.g., Hiking boots)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <input value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} placeholder="Qty" type="number" min="1" className="w-20 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        </div>
                        <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl cursor-pointer">
                            <input type="checkbox" checked={newItem.shared} onChange={e => setNewItem({ ...newItem, shared: e.target.checked })} className="rounded" />
                            <div>
                                <span className="text-sm font-medium text-slate-700">Shared item</span>
                                <p className="text-xs text-slate-400">Only one person needs to bring this for the group</p>
                            </div>
                        </label>
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Add Item</button>
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterCat("all")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${filterCat === "all" ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    All ({totalItems})
                </button>
                {categories.map(cat => {
                    const count = packingList.filter(i => i.category === cat.id).length;
                    if (count === 0 && filterCat !== cat.id) return null;
                    const CatIcon = cat.icon;
                    return (
                        <button key={cat.id} onClick={() => setFilterCat(cat.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${filterCat === cat.id ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            <CatIcon size={14} /> {cat.label} ({count})
                        </button>
                    );
                })}
            </div>

            {Object.entries(grouped).map(([catId, items]) => {
                const catDef = categories.find(c => c.id === catId) || { label: catId, icon: Package, color: "text-slate-500 bg-slate-50" };
                const CatIcon = catDef.icon;
                const catPacked = items.filter(i => i.packed).length;
                return (
                    <div key={catId}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${catDef.color}`}><CatIcon size={14} /></div>
                                <h3 className="text-sm font-bold text-slate-700">{catDef.label}</h3>
                            </div>
                            <span className="text-xs text-slate-400">{catPacked}/{items.length} packed</span>
                        </div>
                        <div className="space-y-2">
                            {items.map(item => (
                                <Card key={item.id} className={`p-3 transition-all ${item.packed ? "opacity-60 bg-slate-50" : ""}`}>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => onTogglePacked(item.id)}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.packed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}>
                                            {item.packed && <Check size={14} className="text-white" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-medium text-slate-700 ${item.packed ? "line-through" : ""}`}>{item.name}</p>
                                                {item.quantity > 1 && <Badge color="slate">x{item.quantity}</Badge>}
                                                {item.shared && <Badge color="teal">Shared</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {item.claimedBy ? (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <User size={10} /> {item.claimedBy}
                                                        {item.claimedBy === "Alex" && (
                                                            <button onClick={() => onUnclaimItem(item.id)} className="text-rose-400 hover:text-rose-600 ml-1 text-[10px] font-semibold">(drop)</button>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <button onClick={() => onClaimItem(item.id)} className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
                                                        <Plus size={10} /> Claim this
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => onDeleteItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14} /></button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}

            {filteredItems.length === 0 && <EmptyState icon={Package} title="No items yet" desc="Add packing items to get started." />}

            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><CheckSquare size={18} className="text-white" /></div>
                    <div>
                        <p className="font-semibold text-slate-700">Collaborative Packing</p>
                        <p className="text-sm text-slate-500 mb-1">Shared items only need one person to bring them. Claim items to let others know you've got it covered!</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ─── Journal Tab ────────────────────────────────────────
const JournalTab = ({ journal, onAddEntry, onDeleteEntry, onToggleReaction }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newEntry, setNewEntry] = useState({ text: "", location: "", mood: "happy" });

    const moods = [
        { id: "excited", emoji: "🤩", label: "Excited" },
        { id: "happy", emoji: "😊", label: "Happy" },
        { id: "amazed", emoji: "🤯", label: "Amazed" },
        { id: "relaxed", emoji: "😌", label: "Relaxed" },
        { id: "nervous", emoji: "😰", label: "Nervous" },
        { id: "tired", emoji: "😴", label: "Tired" },
    ];

    const handleAdd = () => {
        if (!newEntry.text.trim()) return;
        onAddEntry({ text: newEntry.text, location: newEntry.location, mood: newEntry.mood });
        setNewEntry({ text: "", location: "", mood: "happy" });
        setShowAdd(false);
    };

    const moodEmoji = (m) => moods.find(x => x.id === m)?.emoji || "😊";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Trip Journal</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Edit3 size={16} /> Write
                </button>
            </div>

            <p className="text-sm text-slate-500">Capture moments, thoughts, and memories from your trip. Your group journal lives forever!</p>

            {showAdd && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">New Journal Entry</h3>
                    <div className="space-y-2.5">
                        <textarea value={newEntry.text} onChange={e => setNewEntry({ ...newEntry, text: e.target.value })} placeholder="What's happening? How are you feeling? Capture this moment..." rows={4} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" />
                        <input value={newEntry.location} onChange={e => setNewEntry({ ...newEntry, location: e.target.value })} placeholder="Location (e.g., Plaza de Armas, Cusco)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Mood</p>
                            <div className="flex gap-2 flex-wrap">
                                {moods.map(m => (
                                    <button key={m.id} onClick={() => setNewEntry({ ...newEntry, mood: m.id })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${newEntry.mood === m.id ? "bg-sky-100 text-sky-700 ring-2 ring-sky-300" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                                        <span>{m.emoji}</span> {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Post Entry</button>
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-4">
                {journal.map((entry, idx) => {
                    const isFirst = idx === 0 || journal[idx - 1].date !== entry.date;
                    return (
                        <div key={entry.id}>
                            {isFirst && (
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.date}</span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>
                            )}
                            <Card className="p-4">
                                <div className="flex items-start gap-3">
                                    <Avatar name={entry.author} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-700">{entry.author}</span>
                                                <span>{moodEmoji(entry.mood)}</span>
                                                <span className="text-xs text-slate-400">{entry.time}</span>
                                            </div>
                                            {entry.author === "Alex" && (
                                                <button onClick={() => onDeleteEntry(entry.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                        {entry.location && (
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mb-1.5"><MapPin size={10} /> {entry.location}</p>
                                        )}
                                        <p className="text-sm text-slate-600 leading-relaxed">{entry.text}</p>
                                        <div className="flex gap-2 mt-2.5">
                                            {Object.entries(entry.reactions).map(([emoji, voters]) => (
                                                <button key={emoji} onClick={() => onToggleReaction(entry.id, emoji)}
                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${voters.includes("Alex") ? "bg-sky-100 text-sky-700 ring-1 ring-sky-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                                                    <span>{emoji}</span> {voters.length > 0 && voters.length}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
                {journal.length === 0 && <EmptyState icon={BookOpen} title="No entries yet" desc="Start your trip journal by writing your first entry!" />}
            </div>
        </div>
    );
};

// ─── Document Vault Tab ─────────────────────────────────
const DocumentVaultTab = ({ documents, onAddDocument, onDeleteDocument }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [filterCat, setFilterCat] = useState("all");
    const [newDoc, setNewDoc] = useState({ name: "", category: "flights", fileType: "pdf", notes: "" });

    const categories = [
        { id: "flights", label: "Flights", icon: Plane, color: "text-sky-500 bg-sky-50" },
        { id: "hotels", label: "Hotels", icon: Home, color: "text-violet-500 bg-violet-50" },
        { id: "insurance", label: "Insurance", icon: Shield, color: "text-emerald-500 bg-emerald-50" },
        { id: "visas", label: "Visas", icon: FileText, color: "text-amber-500 bg-amber-50" },
        { id: "activities", label: "Activities", icon: Compass, color: "text-orange-500 bg-orange-50" },
        { id: "photos", label: "Photos", icon: Image, color: "text-rose-500 bg-rose-50" },
    ];

    const handleAdd = () => {
        if (!newDoc.name.trim()) return;
        onAddDocument({ ...newDoc });
        setNewDoc({ name: "", category: "flights", fileType: "pdf", notes: "" });
        setShowAdd(false);
    };

    const filteredDocs = filterCat === "all" ? documents : documents.filter(d => d.category === filterCat);

    const fileTypeIcon = (ft) => {
        if (ft === "pdf") return "📄";
        if (ft === "image") return "🖼️";
        if (ft === "link") return "🔗";
        return "📎";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Document Vault</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">
                    <Upload size={16} /> Upload
                </button>
            </div>

            <p className="text-sm text-slate-500">Keep all your travel documents in one place. Accessible by all group members.</p>

            {showAdd && (
                <Card className="p-4 border-2 border-sky-200 border-dashed">
                    <h3 className="font-semibold text-slate-700 mb-3">Add Document</h3>
                    <div className="space-y-2.5">
                        <input value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="Document name (e.g., Flight Confirmation)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        <div className="flex gap-2">
                            <select value={newDoc.category} onChange={e => setNewDoc({ ...newDoc, category: e.target.value })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <select value={newDoc.fileType} onChange={e => setNewDoc({ ...newDoc, fileType: e.target.value })} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                                <option value="pdf">PDF</option>
                                <option value="image">Image</option>
                                <option value="link">Link</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <textarea value={newDoc.notes} onChange={e => setNewDoc({ ...newDoc, notes: e.target.value })} placeholder="Notes / confirmation numbers / details..." rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" />
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600">Add Document</button>
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterCat("all")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${filterCat === "all" ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    All ({documents.length})
                </button>
                {categories.map(cat => {
                    const count = documents.filter(d => d.category === cat.id).length;
                    if (count === 0 && filterCat !== cat.id) return null;
                    const CatIcon = cat.icon;
                    return (
                        <button key={cat.id} onClick={() => setFilterCat(cat.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${filterCat === cat.id ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            <CatIcon size={14} /> {cat.label} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2">
                {filteredDocs.map(doc => {
                    const catDef = categories.find(c => c.id === doc.category) || { icon: FileText, color: "text-slate-500 bg-slate-50" };
                    const CatIcon = catDef.icon;
                    return (
                        <Card key={doc.id} className="p-3.5">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catDef.color}`}>
                                    <CatIcon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400">{fileTypeIcon(doc.fileType)} {doc.fileType.toUpperCase()}</span>
                                                <span className="text-xs text-slate-400">by {doc.uploadedBy}</span>
                                                <span className="text-xs text-slate-400">{doc.date}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => onDeleteDocument(doc.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14} /></button>
                                    </div>
                                    {doc.notes && <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 p-2 rounded-lg">{doc.notes}</p>}
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {filteredDocs.length === 0 && <EmptyState icon={FileText} title="No documents" desc="Upload travel documents to share with your group." />}
            </div>

            <Card className="p-4 bg-gradient-to-r from-sky-50 to-violet-50 border-sky-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0"><Shield size={18} className="text-white" /></div>
                    <div>
                        <p className="font-semibold text-slate-700">Secure Storage</p>
                        <p className="text-sm text-slate-500">All documents are accessible only to group members. Sensitive info like passport numbers are redacted in previews.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ─── Explore Tab ─────────────────────────────────────────
const POPULAR_DESTINATIONS = [
    { name: "Japan", emoji: "🇯🇵", continent: "Asia" }, { name: "Italy", emoji: "🇮🇹", continent: "Europe" },
    { name: "Peru", emoji: "🇵🇪", continent: "South America" }, { name: "Thailand", emoji: "🇹🇭", continent: "Asia" },
    { name: "Morocco", emoji: "🇲🇦", continent: "Africa" }, { name: "Iceland", emoji: "🇮🇸", continent: "Europe" },
    { name: "New Zealand", emoji: "🇳🇿", continent: "Oceania" }, { name: "Colombia", emoji: "🇨🇴", continent: "South America" },
    { name: "Greece", emoji: "🇬🇷", continent: "Europe" }, { name: "Costa Rica", emoji: "🇨🇷", continent: "Central America" },
    { name: "Bali, Indonesia", emoji: "🇮🇩", continent: "Asia" }, { name: "Portugal", emoji: "🇵🇹", continent: "Europe" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CONTINENTS = ["Asia", "Europe", "South America", "Africa", "Oceania", "North America", "Central America"];
const ACTIVITY_FILTERS = ["Adventure", "Relaxing", "Water Activities", "Hiking"];
const ACTIVITY_TAG_MAP = { "Adventure": ["Adventure"], "Relaxing": ["Relaxation", "Beach", "Solo"], "Water Activities": ["Beach", "Water Activities"], "Hiking": ["Hiking", "Nature"] };

const ExploreTab = ({ user, allUsers, proposedTrips, joinRequests, onProposeTrip, onRequestJoin, onRespondToJoinRequest, onViewProfile }) => {
    const [view, setView] = useState("feed");
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [joinNote, setJoinNote] = useState("");
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [previousView, setPreviousView] = useState("feed");
    const [filters, setFilters] = useState({ month: null, continent: null, tags: [] });
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardData, setWizardData] = useState({ visibility: null, destination: "", emoji: "🌍", continent: "", month: null, days: 7 });

    const friends = (user.followingHandles || []).filter(h => (user.followerHandles || []).includes(h));

    const friendTrips = proposedTrips.filter(t => friends.includes(t.organizerHandle));

    const getStyleOverlap = (handle) => {
        const theirs = allUsers[handle]?.travelStyles || [];
        return (user.travelStyles || []).filter(s => theirs.includes(s)).length;
    };

    const discoveryTrips = proposedTrips
        .filter(t => t.organizerHandle !== user.handle && t.visibility === "public")
        .sort((a, b) => getStyleOverlap(b.organizerHandle) - getStyleOverlap(a.organizerHandle));

    const filteredDiscoveryTrips = discoveryTrips.filter(t => {
        if (filters.month && t.month !== filters.month) return false;
        if (filters.continent && t.continent !== filters.continent) return false;
        if (filters.tags.length > 0) {
            const expandedTags = filters.tags.flatMap(tag => ACTIVITY_TAG_MAP[tag] || [tag]);
            if (!expandedTags.some(et => t.tags.includes(et))) return false;
        }
        return true;
    });

    const hasRequested = (tripId) => joinRequests.some(r => r.tripId === tripId && r.fromHandle === user.handle && r.status === "pending");
    const isAccepted = (tripId) => joinRequests.some(r => r.tripId === tripId && r.fromHandle === user.handle && r.status === "accepted");

    const openTripDetail = (trip, fromView) => {
        setSelectedTrip(trip);
        setPreviousView(fromView);
        setShowJoinInput(false);
        setJoinNote("");
        setView("trip-detail");
    };

    const TripCard = ({ trip, showSimilarity, fromView }) => {
        const org = allUsers[trip.organizerHandle] || {};
        const spotsLeft = trip.maxMembers - trip.members.length;
        const overlap = getStyleOverlap(trip.organizerHandle);
        return (
            <Card className="p-4" onClick={() => openTripDetail(trip, fromView)}>
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0">{trip.emoji}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-slate-800 truncate">{trip.destination}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-1.5">by {org.name || "Unknown"} · {trip.createdAt}</p>
                        <p className="text-xs text-slate-500 mb-2"><Calendar size={12} className="inline mr-1" />{trip.month} · {trip.days} days {trip.budgetRange && `· ${trip.budgetRange}`}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {trip.tags.slice(0, 3).map(tag => <Badge key={tag} color={tag === "Adventure" ? "orange" : tag === "Cultural" ? "violet" : tag === "Foodie" ? "amber" : tag === "Beach" || tag === "Water Activities" ? "sky" : tag === "Nature" || tag === "Hiking" ? "green" : tag === "Nightlife" ? "rose" : "slate"}>{tag}</Badge>)}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AvatarStack names={trip.members} max={3} />
                                {spotsLeft > 0 && <span className="text-xs text-slate-400">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>}
                            </div>
                            <Badge color={trip.visibility === "public" ? "green" : trip.visibility === "friends" ? "sky" : "slate"}>{trip.visibility}</Badge>
                        </div>
                        {showSimilarity && overlap > 0 && <p className="text-xs text-teal-600 font-medium mt-2"><Zap size={12} className="inline mr-1" />{overlap} travel style{overlap !== 1 ? "s" : ""} in common</p>}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 mt-1 flex-shrink-0" />
                </div>
            </Card>
        );
    };

    // ── Feed View ──
    if (view === "feed") return (
        <div className="space-y-4">
            <div className="flex items-center justify-between relative">
                <h2 className="text-xl font-bold text-slate-800">Explore</h2>
                <button onClick={() => setShowPlusMenu(!showPlusMenu)} className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md hover:bg-sky-600 transition-colors">
                    <Plus size={20} />
                </button>
                {showPlusMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPlusMenu(false)} />
                        <div className="absolute top-12 right-0 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 w-56">
                            <button onClick={() => { setView("join"); setShowPlusMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center"><Search size={16} className="text-sky-600" /></div>
                                <div><p className="text-sm font-semibold text-slate-700">Join Existing Trips</p><p className="text-xs text-slate-400">Find trips to join</p></div>
                            </button>
                            <button onClick={() => { setView("propose"); setWizardStep(0); setWizardData({ visibility: null, destination: "", emoji: "🌍", continent: "", month: null, days: 7 }); setShowPlusMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center"><Plus size={16} className="text-emerald-600" /></div>
                                <div><p className="text-sm font-semibold text-slate-700">Propose a New Trip</p><p className="text-xs text-slate-400">Create your trip</p></div>
                            </button>
                        </div>
                    </>
                )}
            </div>
            <SectionHeader title="Friends' Upcoming Trips" />
            {friendTrips.length === 0 && <EmptyState icon={Globe} title="No trips yet" desc="Your friends haven't proposed any trips. Be the first to propose one!" />}
            {friendTrips.map(trip => <TripCard key={trip.id} trip={trip} fromView="feed" />)}
            {discoveryTrips.filter(t => !friends.includes(t.organizerHandle)).length > 0 && (
                <>
                    <SectionHeader title="Public Trips" />
                    {discoveryTrips.filter(t => !friends.includes(t.organizerHandle)).map(trip => <TripCard key={trip.id} trip={trip} showSimilarity fromView="feed" />)}
                </>
            )}
        </div>
    );

    // ── Trip Detail View ──
    if (view === "trip-detail" && selectedTrip) {
        const trip = proposedTrips.find(t => t.id === selectedTrip.id) || selectedTrip;
        const org = allUsers[trip.organizerHandle] || {};
        const isOrganizer = trip.organizerHandle === user.handle;
        const alreadyMember = trip.members.includes("Alex");
        const alreadyRequested = hasRequested(trip.id);
        const accepted = isAccepted(trip.id);
        const spotsLeft = trip.maxMembers - trip.members.length;
        const tripJoinRequests = joinRequests.filter(r => r.tripId === trip.id && r.status === "pending");

        return (
            <div className="space-y-4">
                <button onClick={() => { setView(previousView); setSelectedTrip(null); }} className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700">
                    <ChevronLeft size={16} /> Back
                </button>
                <div className="text-center">
                    <div className="text-5xl mb-2">{trip.emoji}</div>
                    <h2 className="text-xl font-bold text-slate-800">{trip.destination}</h2>
                    <p className="text-sm text-slate-500">{trip.month} · {trip.days} days</p>
                </div>
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewProfile(trip.organizerHandle)}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center text-lg">{org.avatar || "👤"}</div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800">{org.name || "Unknown"}</p>
                            <p className="text-xs text-slate-400">{org.handle || ""}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </div>
                    {org.travelStyles && <div className="flex flex-wrap gap-1">{org.travelStyles.map(s => <Badge key={s} color="violet">{s}</Badge>)}</div>}
                </Card>
                <Card className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-slate-400 text-xs mb-0.5">Budget</p><p className="font-semibold text-slate-700">{trip.budgetRange || "TBD"}</p></div>
                        <div><p className="text-slate-400 text-xs mb-0.5">Continent</p><p className="font-semibold text-slate-700">{trip.continent}</p></div>
                        <div><p className="text-slate-400 text-xs mb-0.5">Visibility</p><Badge color={trip.visibility === "public" ? "green" : trip.visibility === "friends" ? "sky" : "slate"}>{trip.visibility}</Badge></div>
                        <div><p className="text-slate-400 text-xs mb-0.5">Spots Left</p><p className="font-semibold text-slate-700">{spotsLeft > 0 ? spotsLeft : "Full"}</p></div>
                    </div>
                </Card>
                {trip.description && <Card className="p-4"><p className="text-sm text-slate-600 leading-relaxed">{trip.description}</p></Card>}
                {trip.highlights.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-700 mb-2">Highlights</h3>
                        <div className="space-y-1.5">
                            {trip.highlights.map((h, i) => <div key={i} className="flex items-center gap-2 text-sm text-slate-600"><MapPin size={14} className="text-sky-500 flex-shrink-0" />{h}</div>)}
                        </div>
                    </Card>
                )}
                <Card className="p-4">
                    <h3 className="font-semibold text-slate-700 mb-2">Travelers ({trip.members.length}/{trip.maxMembers})</h3>
                    <AvatarStack names={trip.members} max={6} />
                </Card>
                <div className="flex flex-wrap gap-1">{trip.tags.map(tag => <Badge key={tag} color="sky">{tag}</Badge>)}</div>

                {!isOrganizer && !alreadyMember && !alreadyRequested && !accepted && spotsLeft > 0 && (
                    <div>
                        {!showJoinInput ? (
                            <button onClick={() => setShowJoinInput(true)} className="w-full py-3 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors">Request to Join</button>
                        ) : (
                            <Card className="p-4 space-y-3 border-2 border-sky-200">
                                <p className="text-sm font-semibold text-slate-700">Add a note to your request</p>
                                <textarea value={joinNote} onChange={e => setJoinNote(e.target.value)} placeholder="Tell them why you'd be a great travel buddy..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" rows={3} />
                                <div className="flex gap-2">
                                    <button onClick={() => { onRequestJoin(trip.id, joinNote); setShowJoinInput(false); setJoinNote(""); }} className="flex-1 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 flex items-center justify-center gap-2"><Send size={14} /> Send Request</button>
                                    <button onClick={() => { setShowJoinInput(false); setJoinNote(""); }} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">Cancel</button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
                {alreadyRequested && <div className="text-center py-3"><Badge color="amber">Request Pending</Badge><p className="text-xs text-slate-400 mt-1">Waiting for the organizer to respond</p></div>}
                {accepted && <div className="text-center py-3"><Badge color="green">Request Accepted</Badge><p className="text-xs text-slate-400 mt-1">You're in! The organizer accepted your request.</p></div>}
                {!isOrganizer && alreadyMember && !accepted && <div className="text-center py-3"><Badge color="green">You're in this trip</Badge></div>}
                {spotsLeft <= 0 && !alreadyMember && !isOrganizer && <div className="text-center py-3"><Badge color="slate">Trip Full</Badge></div>}
                {isOrganizer && <div className="text-center py-3"><Badge color="sky">You're organizing this trip</Badge></div>}

                {isOrganizer && tripJoinRequests.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-700 mb-3">Pending Requests ({tripJoinRequests.length})</h3>
                        <div className="space-y-3">
                            {tripJoinRequests.map(req => {
                                const requester = allUsers[req.fromHandle] || {};
                                return (
                                    <div key={req.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center text-lg flex-shrink-0">{requester.avatar || "👤"}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700">{requester.name || "Unknown"}</p>
                                            {req.note && <p className="text-xs text-slate-500 mt-0.5">"{req.note}"</p>}
                                            {requester.travelStyles && <div className="flex flex-wrap gap-1 mt-1">{requester.travelStyles.slice(0, 3).map(s => <Badge key={s} color="violet">{s}</Badge>)}</div>}
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            <button onClick={() => onRespondToJoinRequest(req.id, true)} className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200"><Check size={14} /></button>
                                            <button onClick={() => onRespondToJoinRequest(req.id, false)} className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200"><X size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    // ── Join Existing Trips View ──
    if (view === "join") {
        const anyFilter = filters.month || filters.continent || filters.tags.length > 0;
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setView("feed")} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronLeft size={16} className="text-slate-600" /></button>
                    <h2 className="text-xl font-bold text-slate-800">Discover Trips</h2>
                </div>

                <div className="space-y-2">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">Month</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                            {MONTHS.map(m => (
                                <button key={m} onClick={() => setFilters(f => ({ ...f, month: f.month === m ? null : m }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filters.month === m ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {m.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">Continent</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                            {CONTINENTS.map(c => (
                                <button key={c} onClick={() => setFilters(f => ({ ...f, continent: f.continent === c ? null : c }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filters.continent === c ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">Activity</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                            {ACTIVITY_FILTERS.map(a => (
                                <button key={a} onClick={() => setFilters(f => ({ ...f, tags: f.tags.includes(a) ? f.tags.filter(t => t !== a) : [...f.tags, a] }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filters.tags.includes(a) ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                    {anyFilter && <button onClick={() => setFilters({ month: null, continent: null, tags: [] })} className="text-xs font-medium text-sky-600 hover:text-sky-700">Clear all filters</button>}
                </div>

                {filteredDiscoveryTrips.length === 0 && <EmptyState icon={Search} title="No trips found" desc="No trips match your filters. Try adjusting them or propose your own!" />}
                {filteredDiscoveryTrips.map(trip => <TripCard key={trip.id} trip={trip} showSimilarity fromView="join" />)}
            </div>
        );
    }

    // ── Propose a New Trip Wizard ──
    if (view === "propose") {
        const progress = ((wizardStep + 1) / 3) * 100;
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => { if (wizardStep > 0) setWizardStep(wizardStep - 1); else setView("feed"); }} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronLeft size={16} className="text-slate-600" /></button>
                    <h2 className="text-xl font-bold text-slate-800">Propose a Trip</h2>
                    <span className="text-xs text-slate-400 ml-auto">Step {wizardStep + 1} of 3</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-sky-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>

                {wizardStep === 0 && (
                    <Card className="p-5 border-2 border-sky-100">
                        <h3 className="font-bold text-slate-800 mb-1">Who can see this trip?</h3>
                        <p className="text-sm text-slate-400 mb-4">Choose who can discover and join your trip.</p>
                        <div className="space-y-3">
                            {[
                                { value: "public", icon: "🌍", label: "Public", desc: "Open to anyone on Wayfare" },
                                { value: "friends", icon: "👥", label: "Friends Only", desc: "Only mutual follows can see this" },
                                { value: "invite", icon: "🔒", label: "Invite Only", desc: "For established groups" },
                            ].map(opt => (
                                <button key={opt.value} onClick={() => { setWizardData(d => ({ ...d, visibility: opt.value })); setWizardStep(1); }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-sky-300 hover:bg-sky-50 ${wizardData.visibility === opt.value ? "border-sky-500 bg-sky-50" : "border-slate-100"}`}>
                                    <span className="text-2xl">{opt.icon}</span>
                                    <div><p className="font-semibold text-slate-700">{opt.label}</p><p className="text-xs text-slate-400">{opt.desc}</p></div>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}

                {wizardStep === 1 && (
                    <Card className="p-5 border-2 border-sky-100">
                        <h3 className="font-bold text-slate-800 mb-1">Where are you headed?</h3>
                        <p className="text-sm text-slate-400 mb-4">Type a destination or pick one below.</p>
                        <input value={wizardData.destination} onChange={e => setWizardData(d => ({ ...d, destination: e.target.value }))} placeholder="e.g., Japan, Costa Rica, Italy..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4" />
                        <p className="text-xs font-semibold text-slate-500 mb-2">Popular Destinations</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {POPULAR_DESTINATIONS.map(d => (
                                <button key={d.name} onClick={() => setWizardData(prev => ({ ...prev, destination: d.name, emoji: d.emoji, continent: d.continent }))}
                                    className={`p-2.5 rounded-xl border text-center transition-all text-sm ${wizardData.destination === d.name ? "border-sky-500 bg-sky-50" : "border-slate-100 hover:border-sky-200 hover:bg-slate-50"}`}>
                                    <div className="text-lg mb-0.5">{d.emoji}</div>
                                    <p className="text-xs font-medium text-slate-600 leading-tight">{d.name}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { if (wizardData.destination.trim()) setWizardStep(2); }}
                            disabled={!wizardData.destination.trim()}
                            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${wizardData.destination.trim() ? "bg-sky-500 text-white hover:bg-sky-600" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                            Next
                        </button>
                    </Card>
                )}

                {wizardStep === 2 && (
                    <Card className="p-5 border-2 border-sky-100">
                        <h3 className="font-bold text-slate-800 mb-1">When and how long?</h3>
                        <p className="text-sm text-slate-400 mb-4">Pick a month and trip duration.</p>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Month</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 mb-4">
                            {MONTHS.map(m => (
                                <button key={m} onClick={() => setWizardData(d => ({ ...d, month: m }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${wizardData.month === m ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {m.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Number of Days</p>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button onClick={() => setWizardData(d => ({ ...d, days: Math.max(3, d.days - 1) }))} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 font-bold text-lg">-</button>
                            <span className="text-3xl font-bold text-slate-800 w-16 text-center">{wizardData.days}</span>
                            <button onClick={() => setWizardData(d => ({ ...d, days: Math.min(30, d.days + 1) }))} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 font-bold text-lg">+</button>
                        </div>
                        <button onClick={() => { if (wizardData.month) { onProposeTrip(wizardData); setView("feed"); } }}
                            disabled={!wizardData.month}
                            className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${wizardData.month ? "bg-sky-500 text-white hover:bg-sky-600" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                            Propose Trip
                        </button>
                    </Card>
                )}

                <button onClick={() => setView("feed")} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2">Cancel</button>
            </div>
        );
    }

    return null;
};

// ─── Notifications Tab ───────────────────────────────────
const NotificationsTab = ({ notifications, onDismiss, onMarkRead }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
                {notifications.some(n => !n.read) && (
                    <button onClick={() => notifications.forEach(n => onMarkRead(n.id))} className="text-sm font-medium text-sky-600 hover:text-sky-700">Mark all read</button>
                )}
            </div>
            {notifications.length === 0 && <EmptyState icon={Bell} title="All caught up" desc="No new notifications." />}
            {notifications.map(n => {
                const IconComp = ICON_MAP[n.icon] || Bell;
                return (
                    <Card key={n.id} className={`p-3.5 hover:shadow-sm transition-shadow ${n.read ? "opacity-60" : ""}`}>
                        <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color === "sky" ? "bg-sky-100 text-sky-600" : n.color === "emerald" ? "bg-emerald-100 text-emerald-600" : n.color === "amber" ? "bg-amber-100 text-amber-600" : n.color === "rose" ? "bg-rose-100 text-rose-600" : "bg-violet-100 text-violet-600"}`}>
                                <IconComp size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-700">{n.text}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {!n.read && <button onClick={() => onMarkRead(n.id)} className="text-slate-300 hover:text-sky-500 transition-colors p-1"><Check size={14} /></button>}
                                <button onClick={() => onDismiss(n.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><X size={14} /></button>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

// ─── Main App ────────────────────────────────────────────
export default function App() {
    const { user: authUser, profile, loading: authLoading, signOut, updateProfile } = useAuth();

    // ── App-level state ──
    const [activeTab, setActiveTab] = useState("explore");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupView, setGroupView] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null);

    // ── Data state (loaded from Supabase) ──
    const [allUsers, setAllUsers] = useState({});
    const [groups, setGroups] = useState([]);
    const [itinerary, setItinerary] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [tripRecs, setTripRecs] = useState([]);
    const [packingList, setPackingList] = useState([]);
    const [polls, setPolls] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [journal, setJournal] = useState([]);
    const [proposedTrips, setProposedTrips] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [recommendations, setRecommendations] = useState({});
    const [dataLoading, setDataLoading] = useState(true);
    const [groupLoading, setGroupLoading] = useState(false);

    // ── Build currentUser object from profile to match child component expectations ──
    const currentUser = profile ? {
        name: profile.name || "",
        handle: profile.handle || "",
        avatar: profile.avatar || "👤",
        profileImage: profile.profile_image_url || null,
        backgroundImage: profile.background_image_url || null,
        bio: profile.bio || "",
        countriesVisited: profile.countries_visited || 0,
        tripsPlanned: profile.trips_planned || 0,
        followerHandles: profile.follower_handles || [],
        followingHandles: profile.following_handles || [],
        travelStyles: profile.travel_styles || [],
        wishlist: profile.wishlist || [],
        countries: profile.countries || [],
    } : null;

    // ── Format relative time ──
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return "";
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // ── Load initial data on auth ──
    const loadInitialData = useCallback(async () => {
        if (!authUser) return;
        setDataLoading(true);

        try {
        // Load profiles → build allUsers map
        const { data: profiles } = await supabase.from("profiles").select("*");
        if (profiles) {
            const usersMap = {};
            profiles.forEach(p => {
                usersMap[p.handle] = {
                    name: p.name || "", handle: p.handle || "", avatar: p.avatar || "👤",
                    profileImage: p.profile_image_url || null, backgroundImage: p.background_image_url || null,
                    bio: p.bio || "", countriesVisited: p.countries_visited || 0, tripsPlanned: p.trips_planned || 0,
                    followerHandles: p.follower_handles || [], followingHandles: p.following_handles || [],
                    travelStyles: p.travel_styles || [], wishlist: p.wishlist || [], countries: p.countries || [],
                };
            });
            setAllUsers(usersMap);
        }

        // Load groups user belongs to
        const { data: memberRows } = await supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", authUser.id);
        const groupIds = memberRows?.map(r => r.group_id) || [];

        if (groupIds.length > 0) {
            const { data: groupsData } = await supabase
                .from("groups")
                .select("*, group_members(user_id, profiles(name))")
                .in("id", groupIds);
            if (groupsData) {
                setGroups(groupsData.map(g => ({
                    id: g.id, name: g.name, destination: g.destination, dates: g.dates,
                    members: g.group_members?.map(m => m.profiles?.name).filter(Boolean) || [],
                    status: g.status, visibility: g.visibility, img: g.img || "🌍",
                })));
            }
        }

        // Load notifications
        const { data: notifs } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(50);
        if (notifs) {
            setNotifications(notifs.map(n => ({
                id: n.id, icon: n.icon || "Bell", color: n.color || "sky",
                text: n.text, time: formatRelativeTime(n.created_at), read: n.read,
            })));
        }

        // Load proposed trips (explore page)
        const { data: proposed } = await supabase
            .from("proposed_trips")
            .select("*, proposed_trip_members(user_id, profiles(name)), join_requests(from_handle)")
            .order("created_at", { ascending: false });
        if (proposed) {
            setProposedTrips(proposed.map(t => ({
                id: t.id, organizerHandle: t.organizer_handle, destination: t.destination,
                emoji: t.emoji || "🌍", continent: t.continent || "", month: t.month || "",
                days: t.days || 0, description: t.description || "", tags: t.tags || [],
                visibility: t.visibility || "public", maxMembers: t.max_members || 8,
                members: t.proposed_trip_members?.map(m => m.profiles?.name).filter(Boolean) || [],
                pendingRequests: t.join_requests?.map(r => r.from_handle).filter(Boolean) || [],
                createdAt: formatRelativeTime(t.created_at),
                budgetRange: t.budget_range || "", highlights: t.highlights || [],
            })));
        }

        // Load join requests
        const { data: jrs } = await supabase
            .from("join_requests")
            .select("*")
            .order("created_at", { ascending: false });
        if (jrs) {
            setJoinRequests(jrs.map(r => ({
                id: r.id, tripId: r.trip_id, fromHandle: r.from_handle,
                note: r.note || "", status: r.status, createdAt: formatRelativeTime(r.created_at),
            })));
        }

        // Load recommendations
        const { data: recs } = await supabase
            .from("profile_recommendations")
            .select("*")
            .eq("user_id", authUser.id);
        if (recs && recs.length > 0) {
            const recsMap = {};
            recs.forEach(r => {
                if (!recsMap[r.city]) recsMap[r.city] = [];
                recsMap[r.city].push({ name: r.name, cat: r.category, rating: r.rating, note: r.note });
            });
            setRecommendations(recsMap);
        }

        } catch (err) {
            console.error("Error loading data:", err);
        }
        setDataLoading(false);
    }, [authUser, profile?.handle]);

    useEffect(() => {
        if (authUser && profile) loadInitialData();
    }, [authUser, profile, loadInitialData]);

    // ── Load group-specific data when a group is selected ──
    const loadGroupData = useCallback(async (groupId) => {
        setGroupLoading(true);

        const [itinRes, expRes, propRes, packRes, pollRes, docRes, journalRes, recRes] = await Promise.all([
            supabase.from("itinerary_days").select("*, itinerary_items(*)").eq("group_id", groupId).order("date"),
            supabase.from("expenses").select("*, expense_splits(member_name)").eq("group_id", groupId).order("created_at", { ascending: false }),
            supabase.from("proposals").select("*, proposal_votes(voter_name)").eq("group_id", groupId).order("rank"),
            supabase.from("packing_items").select("*").eq("group_id", groupId).order("created_at"),
            supabase.from("polls").select("*, poll_options(*, poll_votes(voter_name))").eq("group_id", groupId).order("created_at", { ascending: false }),
            supabase.from("documents").select("*").eq("group_id", groupId).order("created_at", { ascending: false }),
            supabase.from("journal_entries").select("*, journal_reactions(emoji, reactor_name)").eq("group_id", groupId).order("created_at", { ascending: false }),
            supabase.from("trip_recs").select("*").eq("group_id", groupId).order("created_at", { ascending: false }),
        ]);

        if (itinRes.data) {
            setItinerary(itinRes.data.map(day => ({
                date: day.date, label: day.label,
                items: (day.itinerary_items || []).map(i => ({
                    id: i.id, name: i.name, cat: i.category, status: i.status,
                    owner: i.owner, cost: i.cost, time: i.time, link: i.link, completed: i.completed,
                })),
            })));
        }

        if (expRes.data) {
            setExpenses(expRes.data.map(e => ({
                id: e.id, desc: e.description, amount: e.amount, paidBy: e.paid_by,
                cat: e.category, date: e.date, split: e.expense_splits?.map(s => s.member_name) || [],
            })));
        }

        if (propRes.data) {
            setProposals(propRes.data.map(p => ({
                id: p.id, dest: p.destination, user: p.proposer_name, emoji: p.emoji,
                budget: p.budget, tags: p.tags || [], rank: p.rank,
                votes: p.proposal_votes?.map(v => v.voter_name) || [],
            })));
        }

        if (packRes.data) {
            setPackingList(packRes.data.map(i => ({
                id: i.id, name: i.name, category: i.category,
                claimedBy: i.claimed_by, packed: i.packed, shared: i.shared, quantity: i.quantity,
            })));
        }

        if (pollRes.data) {
            setPolls(pollRes.data.map(p => ({
                id: p.id, question: p.question, creator: p.creator_name, status: p.status,
                createdAt: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                options: (p.poll_options || []).map(o => ({
                    id: o.id, text: o.text, voters: o.poll_votes?.map(v => v.voter_name) || [],
                })),
            })));
        }

        if (docRes.data) {
            setDocuments(docRes.data.map(d => ({
                id: d.id, name: d.name, type: d.type, size: d.size, url: d.url,
                uploadedBy: d.uploaded_by, date: new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                access: d.access,
            })));
        }

        if (journalRes.data) {
            setJournal(journalRes.data.map(e => {
                const reactions = { "❤️": [], "😂": [], "🔥": [] };
                (e.journal_reactions || []).forEach(r => {
                    if (reactions[r.emoji]) reactions[r.emoji].push(r.reactor_name);
                });
                return {
                    id: e.id, author: e.author_name,
                    date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    time: new Date(e.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                    location: e.location, mood: e.mood, text: e.text, reactions,
                };
            }));
        }

        if (recRes.data) {
            setTripRecs(recRes.data.map(r => ({
                id: r.id, place: r.place, cat: r.category, rating: r.rating, note: r.note, addedBy: r.added_by,
            })));
        }

        setGroupLoading(false);
    }, []);

    // ── Realtime subscriptions ──
    useEffect(() => {
        if (!authUser) return;

        const notifChannel = supabase
            .channel("notifications")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${authUser.id}` },
                (payload) => {
                    const n = payload.new;
                    setNotifications(prev => [{ id: n.id, icon: n.icon || "Bell", color: n.color || "sky", text: n.text, time: "Just now", read: false }, ...prev]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(notifChannel); };
    }, [authUser]);

    // ── Group actions ──
    const handleCreateGroup = async (data) => {
        const emojis = ["🌍", "🏔️", "🌴", "🏖️", "🗼", "🌸", "🎭", "🚀"];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const groupName = data.name;
        const destination = data.destination || "TBD";
        const dates = data.dates || "TBD";
        const visibility = data.visibility || "private";

        // Insert without .select() to avoid RLS SELECT blocking before member is added
        const { data: inserted, error } = await supabase
            .from("groups")
            .insert({ name: groupName, destination, dates, status: "planning", visibility, img: emoji, created_by: authUser.id })
            .select("id")
            .single();

        // If select fails due to RLS, try fetching by created_by as fallback
        let groupId = inserted?.id;
        if (!groupId) {
            const { data: fallback } = await supabase
                .from("groups")
                .select("id")
                .eq("created_by", authUser.id)
                .eq("name", groupName)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            groupId = fallback?.id;
        }
        if (!groupId) { console.error("Failed to create group:", error); return; }

        await supabase.from("group_members").insert({ group_id: groupId, user_id: authUser.id });

        setGroups(prev => [...prev, {
            id: groupId, name: groupName, destination,
            dates, members: [profile.name], status: "planning",
            visibility, img: emoji,
        }]);

        await supabase.from("notifications").insert({
            user_id: authUser.id, icon: "Users", color: "sky",
            text: `You created trip "${groupName}"`,
        });
    };

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        if (group.status === "deciding") setGroupView("decide");
        else if (group.status === "planning") setGroupView("plan");
        else if (group.status === "post-trip") setGroupView("post");
        else setGroupView("plan");
        setActiveTab("group-detail");
        loadGroupData(group.id);
    };

    const handleAddMember = async (groupId, memberName) => {
        // Find the user by name
        const { data: memberProfile } = await supabase
            .from("profiles")
            .select("id, name")
            .eq("name", memberName)
            .single();
        if (!memberProfile) return;

        const { error } = await supabase
            .from("group_members")
            .insert({ group_id: groupId, user_id: memberProfile.id });
        if (error) return;

        setGroups(prev => prev.map(g => {
            if (g.id !== groupId || g.members.includes(memberName)) return g;
            return { ...g, members: [...g.members, memberName] };
        }));
        setSelectedGroup(prev => prev && prev.id === groupId && !prev.members.includes(memberName) ? { ...prev, members: [...prev.members, memberName] } : prev);
    };

    const handleRemoveMember = async (groupId, memberName) => {
        if (memberName === profile?.name) return;
        const { data: memberProfile } = await supabase.from("profiles").select("id").eq("name", memberName).single();
        if (!memberProfile) return;

        await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberProfile.id);
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m !== memberName) } : g));
        setSelectedGroup(prev => prev && prev.id === groupId ? { ...prev, members: prev.members.filter(m => m !== memberName) } : prev);
    };

    // ── Itinerary actions ──
    const handleAddItineraryItem = async (data) => {
        // Find or create the day
        let { data: day } = await supabase
            .from("itinerary_days")
            .select("id")
            .eq("group_id", selectedGroup.id)
            .eq("date", data.date)
            .single();

        if (!day) {
            const { data: newDay } = await supabase
                .from("itinerary_days")
                .insert({ group_id: selectedGroup.id, date: data.date, label: data.date })
                .select()
                .single();
            day = newDay;
        }
        if (!day) return;

        const { data: item } = await supabase
            .from("itinerary_items")
            .insert({
                day_id: day.id, group_id: selectedGroup.id, name: data.name, category: data.cat, status: data.status,
                owner: data.owner, cost: data.cost, time: data.time, link: data.link,
            })
            .select()
            .single();
        if (!item) return;

        setItinerary(prev => {
            const exists = prev.find(d => d.date === data.date);
            if (exists) {
                return prev.map(d => d.date === data.date
                    ? { ...d, items: [...d.items, { id: item.id, name: item.name, cat: item.category, status: item.status, owner: item.owner, cost: item.cost, time: item.time, link: item.link }] }
                    : d
                );
            }
            return [...prev, { date: data.date, label: data.date, items: [{ id: item.id, name: item.name, cat: item.category, status: item.status, owner: item.owner, cost: item.cost, time: item.time, link: item.link }] }];
        });
    };

    const handleDeleteItineraryItem = async (itemId) => {
        await supabase.from("itinerary_items").delete().eq("id", itemId);
        setItinerary(prev => prev.map(day => ({ ...day, items: day.items.filter(i => i.id !== itemId) })));
    };

    const handleUpdateItemStatus = async (itemId, newStatus) => {
        await supabase.from("itinerary_items").update({ status: newStatus }).eq("id", itemId);
        setItinerary(prev => prev.map(day => ({ ...day, items: day.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i) })));
    };

    const handleEditItineraryItem = async (itemId, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.cat !== undefined) dbUpdates.category = updates.cat;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;
        if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
        if (updates.time !== undefined) dbUpdates.time = updates.time;
        if (updates.link !== undefined) dbUpdates.link = updates.link;
        await supabase.from("itinerary_items").update(dbUpdates).eq("id", itemId);
        setItinerary(prev => prev.map(day => ({ ...day, items: day.items.map(i => i.id === itemId ? { ...i, ...updates } : i) })));
    };

    const handleToggleComplete = async (itemId) => {
        const item = itinerary.flatMap(d => d.items).find(i => i.id === itemId);
        if (!item) return;
        await supabase.from("itinerary_items").update({ completed: !item.completed }).eq("id", itemId);
        setItinerary(prev => prev.map(day => ({ ...day, items: day.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) })));
    };

    // ── Expense actions ──
    const handleAddExpense = async (data) => {
        const { data: exp } = await supabase
            .from("expenses")
            .insert({
                group_id: selectedGroup.id, description: data.desc, amount: data.amount,
                paid_by: data.paidBy, category: data.cat, date: data.date,
            })
            .select()
            .single();
        if (!exp) return;

        if (data.split && data.split.length > 0) {
            await supabase.from("expense_splits").insert(data.split.map(name => ({ expense_id: exp.id, member_name: name })));
        }

        setExpenses(prev => [...prev, { id: exp.id, ...data }]);
    };

    const handleDeleteExpense = async (expenseId) => {
        await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
        await supabase.from("expenses").delete().eq("id", expenseId);
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };

    const handleEditExpense = async (expenseId, updates) => {
        const dbUpdates = {};
        if (updates.desc !== undefined) dbUpdates.description = updates.desc;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.paidBy !== undefined) dbUpdates.paid_by = updates.paidBy;
        if (updates.cat !== undefined) dbUpdates.category = updates.cat;
        if (updates.date !== undefined) dbUpdates.date = updates.date;
        await supabase.from("expenses").update(dbUpdates).eq("id", expenseId);
        setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...updates } : e));
    };

    // ── Proposal actions ──
    const handleAddProposal = async (data) => {
        const { data: prop } = await supabase
            .from("proposals")
            .insert({
                group_id: selectedGroup.id, destination: data.dest, proposer_name: profile.name,
                emoji: data.emoji, budget: data.budget, tags: data.tags, rank: proposals.length + 1,
            })
            .select()
            .single();
        if (!prop) return;

        await supabase.from("proposal_votes").insert({ proposal_id: prop.id, voter_name: profile.name });

        setProposals(prev => [...prev, {
            id: prop.id, dest: data.dest, user: profile.name, emoji: data.emoji,
            budget: data.budget, tags: data.tags || [], votes: [profile.name], rank: prev.length + 1,
        }]);
    };

    const handleToggleVote = async (proposalId) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;
        const hasVoted = proposal.votes.includes(profile.name);

        if (hasVoted) {
            await supabase.from("proposal_votes").delete().eq("proposal_id", proposalId).eq("voter_name", profile.name);
        } else {
            await supabase.from("proposal_votes").insert({ proposal_id: proposalId, voter_name: profile.name });
        }

        setProposals(prev => prev.map(p => {
            if (p.id !== proposalId) return p;
            return { ...p, votes: hasVoted ? p.votes.filter(v => v !== profile.name) : [...p.votes, profile.name] };
        }));
    };

    const handleSubmitFinalVote = async (dest) => {
        if (selectedGroup) {
            await supabase.from("groups").update({ destination: dest, status: "planning" }).eq("id", selectedGroup.id);
            setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, destination: dest, status: "planning" } : g));
            setSelectedGroup(prev => prev ? { ...prev, destination: dest, status: "planning" } : prev);
            setGroupView("plan");
        }
        await supabase.from("notifications").insert({
            user_id: authUser.id, icon: "Star", color: "emerald",
            text: `Your group voted for ${dest}! Trip planning has begun.`,
        });
    };

    // ── Notification actions ──
    const handleDismissNotification = async (id) => {
        await supabase.from("notifications").delete().eq("id", id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleMarkRead = async (id) => {
        await supabase.from("notifications").update({ read: true }).eq("id", id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // ── Trip Recs actions ──
    const handleAddTripRec = async (data) => {
        const { data: rec } = await supabase
            .from("trip_recs")
            .insert({ group_id: selectedGroup.id, place: data.place, category: data.cat, rating: data.rating, note: data.note, added_by: profile.name })
            .select()
            .single();
        if (!rec) return;
        setTripRecs(prev => [...prev, { id: rec.id, ...data }]);
    };

    const handleDeleteTripRec = async (id) => {
        await supabase.from("trip_recs").delete().eq("id", id);
        setTripRecs(prev => prev.filter(r => r.id !== id));
    };

    // ── Packing list actions ──
    const handleAddPackingItem = async (data) => {
        const { data: item } = await supabase
            .from("packing_items")
            .insert({ group_id: selectedGroup.id, name: data.name, category: data.category, shared: data.shared, quantity: data.quantity })
            .select()
            .single();
        if (!item) return;
        setPackingList(prev => [...prev, { id: item.id, name: data.name, category: data.category, claimedBy: null, packed: false, shared: data.shared, quantity: data.quantity }]);
    };

    const handleDeletePackingItem = async (itemId) => {
        await supabase.from("packing_items").delete().eq("id", itemId);
        setPackingList(prev => prev.filter(i => i.id !== itemId));
    };

    const handleTogglePacked = async (itemId) => {
        const item = packingList.find(i => i.id === itemId);
        if (!item) return;
        await supabase.from("packing_items").update({ packed: !item.packed }).eq("id", itemId);
        setPackingList(prev => prev.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i));
    };

    const handleClaimPackingItem = async (itemId) => {
        await supabase.from("packing_items").update({ claimed_by: profile.name }).eq("id", itemId);
        setPackingList(prev => prev.map(i => i.id === itemId ? { ...i, claimedBy: profile.name } : i));
    };

    const handleUnclaimPackingItem = async (itemId) => {
        const item = packingList.find(i => i.id === itemId);
        if (!item || item.claimedBy !== profile.name) return;
        await supabase.from("packing_items").update({ claimed_by: null }).eq("id", itemId);
        setPackingList(prev => prev.map(i => i.id === itemId ? { ...i, claimedBy: null } : i));
    };

    // ── Poll actions ──
    const handleAddPoll = async (data) => {
        const { data: poll } = await supabase
            .from("polls")
            .insert({ group_id: selectedGroup.id, question: data.question, creator_name: profile.name, status: "open" })
            .select()
            .single();
        if (!poll) return;

        const optionInserts = data.options.map((text) => ({ poll_id: poll.id, text }));
        const { data: options } = await supabase.from("poll_options").insert(optionInserts).select();

        setPolls(prev => [{
            id: poll.id, question: data.question, creator: profile.name, status: "open",
            createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            options: (options || []).map(o => ({ id: o.id, text: o.text, voters: [] })),
        }, ...prev]);
    };

    const handleVotePoll = async (pollId, optionId) => {
        const poll = polls.find(p => p.id === pollId);
        if (!poll || poll.status === "closed") return;

        // Remove existing vote from all options of this poll
        for (const opt of poll.options) {
            if (opt.voters.includes(profile.name)) {
                await supabase.from("poll_votes").delete().eq("option_id", opt.id).eq("voter_name", profile.name);
            }
        }

        // Add vote to selected option
        const selectedOpt = poll.options.find(o => o.id === optionId);
        if (selectedOpt && !selectedOpt.voters.includes(profile.name)) {
            await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, voter_name: profile.name });
        }

        setPolls(prev => prev.map(p => {
            if (p.id !== pollId || p.status === "closed") return p;
            return {
                ...p,
                options: p.options.map(opt => {
                    const hasVoted = opt.voters.includes(profile.name);
                    if (opt.id === optionId) {
                        return { ...opt, voters: hasVoted ? opt.voters.filter(v => v !== profile.name) : [...opt.voters, profile.name] };
                    }
                    return { ...opt, voters: opt.voters.filter(v => v !== profile.name) };
                }),
            };
        }));
    };

    const handleClosePoll = async (pollId) => {
        await supabase.from("polls").update({ status: "closed" }).eq("id", pollId);
        setPolls(prev => prev.map(p => p.id === pollId ? { ...p, status: "closed" } : p));
    };

    const handleDeletePoll = async (pollId) => {
        // Delete votes, options, then poll
        const poll = polls.find(p => p.id === pollId);
        if (poll) {
            for (const opt of poll.options) {
                await supabase.from("poll_votes").delete().eq("option_id", opt.id);
            }
            await supabase.from("poll_options").delete().eq("poll_id", pollId);
        }
        await supabase.from("polls").delete().eq("id", pollId);
        setPolls(prev => prev.filter(p => p.id !== pollId));
    };

    // ── Document actions ──
    const handleAddDocument = async (data) => {
        const { data: doc } = await supabase
            .from("documents")
            .insert({
                group_id: selectedGroup.id, name: data.name, type: data.type, size: data.size,
                url: data.url, uploaded_by: profile.name, access: data.access || "everyone",
            })
            .select()
            .single();
        if (!doc) return;
        setDocuments(prev => [{
            id: doc.id, ...data, uploadedBy: profile.name,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }, ...prev]);
    };

    const handleDeleteDocument = async (docId) => {
        await supabase.from("documents").delete().eq("id", docId);
        setDocuments(prev => prev.filter(d => d.id !== docId));
    };

    // ── Journal actions ──
    const handleAddJournalEntry = async (data) => {
        const { data: entry } = await supabase
            .from("journal_entries")
            .insert({
                group_id: selectedGroup.id, author_name: profile.name,
                location: data.location, mood: data.mood, text: data.text,
            })
            .select()
            .single();
        if (!entry) return;
        const now = new Date(entry.created_at);
        setJournal(prev => [{
            id: entry.id, author: profile.name,
            date: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            location: data.location, mood: data.mood, text: data.text,
            reactions: { "❤️": [], "😂": [], "🔥": [] },
        }, ...prev]);
    };

    const handleDeleteJournalEntry = async (entryId) => {
        await supabase.from("journal_reactions").delete().eq("entry_id", entryId);
        await supabase.from("journal_entries").delete().eq("id", entryId);
        setJournal(prev => prev.filter(e => e.id !== entryId));
    };

    const handleToggleReaction = async (entryId, emoji) => {
        const entry = journal.find(e => e.id === entryId);
        if (!entry) return;
        const voters = entry.reactions[emoji] || [];
        const hasReacted = voters.includes(profile.name);

        if (hasReacted) {
            await supabase.from("journal_reactions").delete().eq("entry_id", entryId).eq("emoji", emoji).eq("reactor_name", profile.name);
        } else {
            await supabase.from("journal_reactions").insert({ entry_id: entryId, emoji, reactor_name: profile.name });
        }

        setJournal(prev => prev.map(e => {
            if (e.id !== entryId) return e;
            const v = e.reactions[emoji] || [];
            return { ...e, reactions: { ...e.reactions, [emoji]: hasReacted ? v.filter(n => n !== profile.name) : [...v, profile.name] } };
        }));
    };

    // ── Explore / Proposed Trip actions ──
    const handleProposeTrip = async (data) => {
        const emoji = data.emoji || ["🌍", "🏔️", "🌴", "🏖️", "🗼", "🌸", "🎭", "🚀"][Math.floor(Math.random() * 8)];

        try {
        const { data: trip, error: tripErr } = await supabase
            .from("proposed_trips")
            .insert({
                organizer_handle: profile.handle, destination: data.destination, emoji,
                continent: data.continent || "", month: data.month || "", days: data.days || 7,
                description: "", tags: [], visibility: data.visibility || "public", max_members: 8,
                budget_range: "", highlights: [],
            })
            .select()
            .single();
        if (tripErr || !trip) { console.error("proposed_trips insert error:", tripErr); return; }

        await supabase.from("proposed_trip_members").insert({ trip_id: trip.id, user_id: authUser.id });

        setProposedTrips(prev => [{
            id: trip.id, organizerHandle: profile.handle, destination: data.destination,
            emoji, continent: data.continent || "", month: data.month || "", days: data.days || 0,
            description: "", tags: [], visibility: data.visibility || "public", maxMembers: 8,
            members: [profile.name], pendingRequests: [], createdAt: "Just now",
            budgetRange: "", highlights: [],
        }, ...prev]);

        // Also create a group for this trip
        const groupName = `${data.destination}${data.month ? " " + data.month.slice(0, 3) : ""} '26`;
        const groupDates = data.month ? `${data.month} · ${data.days} days` : "TBD";
        const groupVis = data.visibility || "private";

        const { data: newGroup } = await supabase
            .from("groups")
            .insert({
                name: groupName, destination: data.destination, dates: groupDates,
                status: "planning", visibility: groupVis, img: emoji, created_by: authUser.id,
            })
            .select("id")
            .single();

        let gId = newGroup?.id;
        if (!gId) {
            const { data: fallback } = await supabase
                .from("groups")
                .select("id")
                .eq("created_by", authUser.id)
                .eq("name", groupName)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            gId = fallback?.id;
        }
        if (gId) {
            await supabase.from("group_members").insert({ group_id: gId, user_id: authUser.id });
            setGroups(prev => [...prev, {
                id: gId, name: groupName, destination: data.destination,
                dates: groupDates, members: [profile.name], status: "planning",
                visibility: groupVis, img: emoji,
            }]);
        }

        await supabase.from("notifications").insert({
            user_id: authUser.id, icon: "Star", color: "emerald",
            text: `You proposed a trip to ${data.destination}!`,
        });
        } catch (err) { console.error("handleProposeTrip error:", err); }
    };

    const handleRequestJoinTrip = async (tripId, note) => {
        const { data: req } = await supabase
            .from("join_requests")
            .insert({ trip_id: tripId, from_handle: profile.handle, note: note || "", status: "pending" })
            .select()
            .single();
        if (!req) return;

        setJoinRequests(prev => [...prev, { id: req.id, tripId, fromHandle: profile.handle, note: note || "", status: "pending", createdAt: "Just now" }]);
        setProposedTrips(prev => prev.map(t => t.id === tripId ? { ...t, pendingRequests: [...t.pendingRequests, profile.handle] } : t));

        const trip = proposedTrips.find(t => t.id === tripId);
        await supabase.from("notifications").insert({
            user_id: authUser.id, icon: "Heart", color: "sky",
            text: `You requested to join the trip to ${trip?.destination || "a destination"}!`,
        });
    };

    const handleRespondToJoinRequest = async (requestId, accept) => {
        const req = joinRequests.find(r => r.id === requestId);
        await supabase.from("join_requests").update({ status: accept ? "accepted" : "rejected" }).eq("id", requestId);
        setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: accept ? "accepted" : "rejected" } : r));

        if (accept && req) {
            const requester = allUsers[req.fromHandle];
            const firstName = requester?.name?.split(" ")[0] || "Someone";
            // Add member to proposed trip
            const { data: requesterProfile } = await supabase.from("profiles").select("id").eq("handle", req.fromHandle).single();
            if (requesterProfile) {
                await supabase.from("proposed_trip_members").insert({ trip_id: req.tripId, user_id: requesterProfile.id });
            }
            setProposedTrips(prev => prev.map(t => t.id === req.tripId ? { ...t, members: [...t.members, firstName], pendingRequests: t.pendingRequests.filter(h => h !== req.fromHandle) } : t));
        }
    };

    // ── User update handler ──
    const handleUpdateUser = async (updates) => {
        const dbUpdates = {};
        // Only map fields that exist in the profiles table
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
        if (updates.profileImage !== undefined) dbUpdates.profile_image_url = updates.profileImage;
        if (updates.backgroundImage !== undefined) dbUpdates.background_image_url = updates.backgroundImage;
        if (updates.travelStyles !== undefined) dbUpdates.travel_styles = updates.travelStyles;
        if (updates.wishlist !== undefined) dbUpdates.wishlist = updates.wishlist;
        if (updates.countriesVisited !== undefined) dbUpdates.countries_visited = updates.countriesVisited;
        if (updates.tripsPlanned !== undefined) dbUpdates.trips_planned = updates.tripsPlanned;

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await updateProfile(dbUpdates);
            if (error) { console.error("Profile update error:", error); return; }
        }

        // Update allUsers map too
        if (profile?.handle) {
            setAllUsers(prev => ({
                ...prev,
                [profile.handle]: { ...prev[profile.handle], ...updates },
            }));
        }
    };

    // ── Auth gates ──
    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-sky-500" />
            </div>
        );
    }

    if (!authUser) return <Auth />;

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-sky-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Setting up your profile...</p>
                </div>
            </div>
        );
    }

    if (dataLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-sky-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading your trips...</p>
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    const navItems = [
        { id: "explore", icon: Globe, label: "Explore" },
        { id: "groups", icon: Users, label: "Trips" },
        { id: "notifs", icon: Bell, label: "Alerts", badge: unreadCount },
        { id: "profile", icon: User, label: "Profile" },
    ];

    const groupTabs = [
        { id: "decide", icon: Compass, label: "Decide" },
        { id: "members", icon: Users, label: "Members" },
        { id: "plan", icon: Calendar, label: "Plan" },
        { id: "packing", icon: CheckSquare, label: "Pack" },
        { id: "polls", icon: BarChart3, label: "Polls" },
        { id: "during", icon: Map, label: "Trip" },
        { id: "journal", icon: BookOpen, label: "Journal" },
        { id: "expenses", icon: DollarSign, label: "Expenses" },
        { id: "docs", icon: FileText, label: "Docs" },
        { id: "post", icon: Star, label: "Recs" },
    ];

    const currentMembers = selectedGroup?.members || [profile.name];

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center">
                                <Plane size={16} className="text-white" />
                            </div>
                            <span className="text-lg font-extrabold bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">Wayfare</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"><Search size={18} className="text-slate-500" /></button>
                            <button onClick={signOut} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors" title="Sign out"><LogOut size={18} className="text-slate-500" /></button>
                        </div>
                    </div>

                    {activeTab === "group-detail" && selectedGroup && (
                        <div className="px-2 pb-2">
                            <div className="flex items-center gap-2 px-2 mb-2">
                                <button onClick={() => { setActiveTab("groups"); setSelectedGroup(null); }}
                                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                    <ChevronLeft size={16} className="text-slate-600" />
                                </button>
                                <span className="text-sm font-bold text-slate-700 truncate">{selectedGroup.name}</span>
                                <AvatarStack names={selectedGroup.members} max={3} />
                            </div>
                            <div className="flex gap-1 px-1">
                                {groupTabs.map(t => (
                                    <button key={t.id} onClick={() => setGroupView(t.id)}
                                        className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${groupView === t.id ? "bg-sky-50 text-sky-600" : "text-slate-400 hover:text-slate-600"}`}>
                                        <t.icon size={16} strokeWidth={groupView === t.id ? 2.2 : 1.8} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
                    {groupLoading && activeTab === "group-detail" ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={28} className="animate-spin text-sky-500" />
                        </div>
                    ) : (
                        <>
                            {activeTab === "profile" && <ProfileTab user={currentUser} authUserId={authUser.id} recommendations={recommendations} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} allUsers={allUsers} viewingProfile={viewingProfile} onViewProfile={setViewingProfile} />}
                            {activeTab === "groups" && <GroupsTab groups={groups} onSelectGroup={handleSelectGroup} onCreateGroup={handleCreateGroup} onNavigate={setActiveTab} proposedTrips={proposedTrips} allUsers={allUsers} onViewProfile={(handle) => { setViewingProfile(handle === profile.handle ? null : handle); setActiveTab("profile"); }} />}
                            {activeTab === "explore" && <ExploreTab user={currentUser} allUsers={allUsers} proposedTrips={proposedTrips} joinRequests={joinRequests} onProposeTrip={handleProposeTrip} onRequestJoin={handleRequestJoinTrip} onRespondToJoinRequest={handleRespondToJoinRequest} onViewProfile={(handle) => { setViewingProfile(handle === profile.handle ? null : handle); setActiveTab("profile"); }} />}
                            {activeTab === "notifs" && <NotificationsTab notifications={notifications} onDismiss={handleDismissNotification} onMarkRead={handleMarkRead} />}
                            {activeTab === "group-detail" && selectedGroup && (
                                <>
                                    {groupView === "decide" && <DestinationDecider group={selectedGroup} proposals={proposals} onBack={() => { setActiveTab("groups"); setSelectedGroup(null); }} onAddProposal={handleAddProposal} onToggleVote={handleToggleVote} onSubmitFinalVote={handleSubmitFinalVote} />}
                                    {groupView === "members" && <MembersTab group={selectedGroup} onAddMember={handleAddMember} onRemoveMember={handleRemoveMember} />}
                                    {groupView === "plan" && <PlanningTab group={selectedGroup} itinerary={itinerary} onAddItem={handleAddItineraryItem} onDeleteItem={handleDeleteItineraryItem} onUpdateItemStatus={handleUpdateItemStatus} onEditItem={handleEditItineraryItem} />}
                                    {groupView === "packing" && <PackingChecklistTab packingList={packingList} members={currentMembers} onAddItem={handleAddPackingItem} onDeleteItem={handleDeletePackingItem} onTogglePacked={handleTogglePacked} onClaimItem={handleClaimPackingItem} onUnclaimItem={handleUnclaimPackingItem} />}
                                    {groupView === "polls" && <PollsTab polls={polls} onAddPoll={handleAddPoll} onVotePoll={handleVotePoll} onClosePoll={handleClosePoll} onDeletePoll={handleDeletePoll} />}
                                    {groupView === "during" && <DuringTripTab itinerary={itinerary} onToggleComplete={handleToggleComplete} />}
                                    {groupView === "journal" && <JournalTab journal={journal} onAddEntry={handleAddJournalEntry} onDeleteEntry={handleDeleteJournalEntry} onToggleReaction={handleToggleReaction} />}
                                    {groupView === "expenses" && <ExpensesTab expenses={expenses} members={currentMembers} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} onEditExpense={handleEditExpense} />}
                                    {groupView === "docs" && <DocumentVaultTab documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />}
                                    {groupView === "post" && <PostTripTab tripRecs={tripRecs} onAddRec={handleAddTripRec} onDeleteRec={handleDeleteTripRec} />}
                                </>
                            )}
                        </>
                    )}
                </div>

                {activeTab !== "group-detail" && (
                    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-2 z-30">
                        <div className="flex justify-around">
                            {navItems.map(n => (
                                <IconBtn key={n.id} icon={n.icon} label={n.label} active={activeTab === n.id} badge={n.badge} onClick={() => setActiveTab(n.id)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
