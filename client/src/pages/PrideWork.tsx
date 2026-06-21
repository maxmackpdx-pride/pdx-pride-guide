import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Search, Plus, X, ChevronDown } from "lucide-react";

const gigSchema = z.object({
  postType: z.enum(["LOOKING_FOR_WORK", "POSTING_GIG"]),
  name: z.string().min(2, "Name required"),
  contactEmail: z.string().email("Valid email required"),
  title: z.string().min(3, "Title required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  skills: z.string().optional(),
  compensation: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
});

type GigFormData = z.infer<typeof gigSchema>;

interface GigPost {
  id: number;
  postType: "LOOKING_FOR_WORK" | "POSTING_GIG";
  name: string;
  title: string;
  description: string;
  skills: string | null;
  compensation: string | null;
  location: string | null;
  isRemote: boolean | null;
  status: string;
  createdAt: string;
  userId?: number | null;
}

const TYPE_COLORS: Record<string, string> = {
  LOOKING_FOR_WORK: "#00FFFF",
  POSTING_GIG: "#CCFF00",
};

const TYPE_LABELS: Record<string, string> = {
  LOOKING_FOR_WORK: "LOOKING FOR WORK",
  POSTING_GIG: "POSTING A GIG",
};

export default function PrideWork() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "LOOKING_FOR_WORK" | "POSTING_GIG">("ALL");

  const { data: gigs = [], isLoading } = useQuery<GigPost[]>({
    queryKey: ["/api/gigs"],
  });

  const form = useForm<GigFormData>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      postType: "POSTING_GIG",
      name: "",
      contactEmail: "",
      title: "",
      description: "",
      skills: "",
      compensation: "",
      location: "",
      isRemote: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: GigFormData) => apiRequest("POST", "/api/gigs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({ title: "Post submitted", description: "Your post is pending admin review." });
      form.reset();
      setShowForm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit post.", variant: "destructive" });
    },
  });

  const handlePostClick = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowForm(!showForm);
  };

  const filteredGigs = gigs.filter(g =>
    filterType === "ALL" ? true : g.postType === filterType
  );

  return (
    <div className="min-h-screen zine-page pride-work-page" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div className="zine-section-head pride-work-hero border-b-2 border-white/10 px-4 py-8 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Briefcase size={20} style={{ color: "#CCFF00" }} />
                <span className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>
                  Pride Work
                </span>
              </div>
              <h1 className="display text-5xl md:text-7xl text-white">
                QUEER<br />
                <span style={{ color: "#CCFF00" }}>GIG BOARD</span>
              </h1>
              <p className="mt-3 text-white/60 max-w-lg">
                Community-powered job board for Pride weekend and beyond. 
                Queer workers, queer employers, queer gigs.
              </p>
              <button
                data-testid="button-post-gig"
                onClick={handlePostClick}
                className="display text-lg px-6 py-3 border-2 transition-all mt-6"
                style={{
                  background: showForm ? "#CCFF00" : "transparent",
                  borderColor: "#CCFF00",
                  color: showForm ? "#000" : "#CCFF00",
                }}
              >
                {showForm ? <X size={16} className="inline mr-2" /> : <Plus size={16} className="inline mr-2" />}
                {showForm ? "CANCEL" : "POST HERE"}
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {(["ALL", "POSTING_GIG", "LOOKING_FOR_WORK"] as const).map(type => (
              <button
                key={type}
                data-testid={`filter-${type}`}
                onClick={() => setFilterType(type)}
                className="sticker transition-all"
                style={{
                  color: filterType === type ? "#000" : (type === "ALL" ? "#fff" : TYPE_COLORS[type]),
                  borderColor: type === "ALL" ? "#fff" : TYPE_COLORS[type],
                  background: filterType === type ? (type === "ALL" ? "#fff" : TYPE_COLORS[type]) : "transparent",
                }}
              >
                {type === "ALL" ? "ALL POSTS" : TYPE_LABELS[type]}
              </button>
            ))}
            <span className="sticker ml-2" style={{ borderColor: "transparent", color: "#666" }}>
              {filteredGigs.length} post{filteredGigs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
        {/* Post Form */}
        {showForm && (
          <div
            data-testid="form-pride-work"
            className="mb-10 p-6 md:p-8 border-2"
            style={{ background: "#111", borderColor: "#CCFF00" }}
          >
            <h2 className="display text-3xl text-white mb-6">
              POST TO THE GIG BOARD
            </h2>
            <p className="text-white/50 text-sm mb-8">
              All posts require admin approval before going live. Posts must be related to Pride events, queer spaces, or the community.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5">
                {/* Post type */}
                <FormField
                  control={form.control}
                  name="postType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>POST TYPE *</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {(["POSTING_GIG", "LOOKING_FOR_WORK"] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            data-testid={`select-posttype-${type}`}
                            onClick={() => field.onChange(type)}
                            className="py-3 px-4 border-2 display text-sm transition-all text-left"
                            style={{
                              borderColor: TYPE_COLORS[type],
                              background: field.value === type ? TYPE_COLORS[type] : "transparent",
                              color: field.value === type ? "#000" : TYPE_COLORS[type],
                            }}
                          >
                            {TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>YOUR NAME *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-name"
                            placeholder="Name or handle"
                            className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>CONTACT EMAIL *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-email"
                            type="email"
                            placeholder="your@email.com"
                            className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>
                        {form.watch("postType") === "POSTING_GIG" ? "GIG TITLE *" : "ROLE / WHAT YOU DO *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-title"
                          placeholder={form.watch("postType") === "POSTING_GIG" ? "e.g. Stage Manager for Pride Stage" : "e.g. Event Photographer"}
                          className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>DESCRIPTION *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="input-description"
                          rows={4}
                          placeholder={form.watch("postType") === "POSTING_GIG"
                            ? "Describe the gig, responsibilities, dates, what you need..."
                            : "Tell the community what you offer, your experience, availability..."}
                          className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>SKILLS / TAGS</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-skills"
                            placeholder="e.g. Sound, Lighting, Photography"
                            className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="compensation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>COMPENSATION</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-compensation"
                            placeholder="e.g. $25/hr, Volunteer, Negotiable"
                            className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="display text-sm" style={{ color: "#CCFF00" }}>LOCATION</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-location"
                          placeholder="e.g. Portland, OR / Remote / Washington Park"
                          className="border-white/20 bg-black/40 text-white placeholder:text-white/30 focus:border-yellow-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    data-testid="button-submit-gig"
                    disabled={mutation.isPending}
                    className="display text-lg px-8 py-3 border-2 transition-all disabled:opacity-50"
                    style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}
                  >
                    {mutation.isPending ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
                  </button>
                  <p className="text-white/30 text-xs">Reviewed by admins before going live</p>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Gig listings */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={40} className="mx-auto mb-4 text-white/20" />
            <p className="display text-2xl text-white/30">NO POSTS YET</p>
            <p className="text-white/30 text-sm mt-2">Be the first to post a gig or offer your skills.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 display text-base px-6 py-2 border-2 transition-all"
              style={{ borderColor: "#CCFF00", color: "#CCFF00" }}
            >
              POST HERE
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

function GigCard({ gig }: { gig: GigPost }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const color = TYPE_COLORS[gig.postType] || "#fff";
  const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];

  const messageMutation = useMutation({
    mutationFn: () => fetch(`/api/gigs/${gig.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: messageBody }),
    }).then(r => {
      if (!r.ok) throw new Error("Could not send message");
      return r.json();
    }),
    onSuccess: () => {
      setMessageBody("");
      setShowMessage(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  return (
    <div
      data-testid={`card-gig-${gig.id}`}
      className="poster-card gig-card border-2 transition-all"
      style={{ background: "#111", borderColor: expanded ? color : "#222" }}
    >
      <button
        className="w-full text-left p-5 md:p-6"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="sticker text-xs"
                style={{ color, borderColor: color }}
              >
                {TYPE_LABELS[gig.postType]}
              </span>
              {gig.isRemote && (
                <span className="sticker text-xs" style={{ color: "#8800FF", borderColor: "#8800FF" }}>
                  REMOTE
                </span>
              )}
            </div>
            <h3 className="display text-xl md:text-2xl text-white">{gig.title}</h3>
            <p className="text-white/50 text-sm mt-1">{gig.name}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {gig.compensation && (
                <span className="text-sm" style={{ color }}>
                  {gig.compensation}
                </span>
              )}
              {gig.location && (
                <span className="text-white/40 text-sm">{gig.location}</span>
              )}
            </div>
          </div>
          <ChevronDown
            size={20}
            className="text-white/40 flex-shrink-0 mt-1 transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "none" }}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-white/10 pt-4">
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line mb-4">
            {gig.description}
          </p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map(skill => (
                <span
                  key={skill}
                  className="sticker text-xs"
                  style={{ color: "#fff", borderColor: "#333" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-white/10">
            <p className="text-white/30 text-xs">
              Posted {new Date(gig.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            {gig.userId !== user?.id && (
              <button
                type="button"
                onClick={() => user ? setShowMessage(!showMessage) : setShowAuth(true)}
                className="mt-4 display text-sm px-4 py-2 border-2"
                style={{ color, borderColor: color }}
              >
                Reply to Post
              </button>
            )}
            {showMessage && (
              <div className="mt-4 p-4 border border-white/10 bg-black/40">
                <textarea
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  placeholder={`Write a private reply about "${gig.title}"...`}
                  className="w-full min-h-24 p-3 bg-black border border-white/20 text-white resize-y"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => messageMutation.mutate()}
                    disabled={!messageBody.trim() || messageMutation.isPending}
                    className="display text-sm px-4 py-2"
                    style={{ background: color, color: "#000", opacity: !messageBody.trim() || messageMutation.isPending ? 0.55 : 1 }}
                  >
                    {messageMutation.isPending ? "SENDING..." : "SEND"}
                  </button>
                  <button onClick={() => setShowMessage(false)} className="text-white/40 text-sm px-3 py-2 border border-white/10">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
