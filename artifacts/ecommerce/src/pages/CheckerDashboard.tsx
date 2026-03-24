import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ClipboardCheck, CheckCircle2, XCircle, Eye, AlertTriangle, Package, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { entityId } from "@/lib/entity-id";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CHECKLISTS: Record<string, { key: string; label: string }[]> = {
  electronics: [
    { key: "serial_visible", label: "Serial number is visible and matches order" },
    { key: "screen_intact", label: "Screen/display is intact with no cracks" },
    { key: "battery_present", label: "Battery is present and functional" },
    { key: "all_accessories", label: "All original accessories included (cables, charger, etc.)" },
    { key: "no_water_damage", label: "No water damage indicators (sticker intact)" },
    { key: "powers_on", label: "Device powers on successfully" },
    { key: "ports_working", label: "All ports / buttons are functional" },
    { key: "original_packaging", label: "Original packaging / box included" },
  ],
  fashion: [
    { key: "size_matches", label: "Size label matches order (size/colour)" },
    { key: "tags_attached", label: "Original tags are still attached" },
    { key: "no_stains", label: "No stains, odours or visible damage" },
    { key: "unworn", label: "Item appears unworn / unused" },
    { key: "original_packaging", label: "Returned in original bag/packaging" },
  ],
  sports: [
    { key: "item_matches", label: "Item matches the product description" },
    { key: "unused_condition", label: "Item appears unused / minimal wear" },
    { key: "no_damage", label: "No physical damage to materials" },
    { key: "accessories_included", label: "All included accessories returned" },
    { key: "original_packaging", label: "Original packaging returned" },
  ],
  default: [
    { key: "item_matches_desc", label: "Item matches product description" },
    { key: "original_packaging", label: "Original packaging intact" },
    { key: "no_visible_damage", label: "No visible damage beyond stated reason" },
    { key: "all_parts_present", label: "All parts / components present" },
    { key: "correct_product", label: "Confirmed correct product (not a substitute)" },
  ],
};

function getCategoryChecklist(category: string | null | undefined) {
  if (!category) return CHECKLISTS.default;
  const slug = category.toLowerCase().replace(/[^a-z]/g, "");
  if (slug.includes("electronic") || slug.includes("tech") || slug.includes("gadget")) return CHECKLISTS.electronics;
  if (slug.includes("fashion") || slug.includes("cloth") || slug.includes("apparel")) return CHECKLISTS.fashion;
  if (slug.includes("sport") || slug.includes("fitness") || slug.includes("gym")) return CHECKLISTS.sports;
  return CHECKLISTS.default;
}

function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

async function fetchCheckerReturns() {
  const r = await fetch(`${BASE}/api/checker/returns`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json();
}

async function submitInspection(returnId: string, payload: object) {
  const r = await fetch(`${BASE}/api/checker/returns/${returnId}/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error ?? "Submission failed");
  }
  return r.json();
}

type ReturnItem = any;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    checker_review: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    manual_review: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function InspectionPanel({ ret, onDone }: { ret: ReturnItem; onDone: () => void }) {
  const { toast } = useToast();
  const categoryName = ret.category?.name ?? null;
  const checklist = getCategoryChecklist(categoryName);
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(checklist.map(c => [c.key, false]))
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allChecked = Object.values(checks).every(Boolean);
  const someChecked = Object.values(checks).some(Boolean);
  const decision = allChecked ? "approved" : "rejected";

  const categorySlug = categoryName?.toLowerCase().replace(/[^a-z]/g, "") ?? "default";

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitInspection(entityId(ret), {
        decision,
        notes: notes.trim() || undefined,
        checklist: checks,
        category: categoryName ?? "General",
      });
      toast({ title: `Return ${decision}`, description: `Inspection submitted successfully.` });
      onDone();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const product = ret.product;
  const primaryImage = ret.productImages?.[0]?.url;

  return (
    <div className="space-y-6">
      {/* Product info */}
      <div className="flex gap-4 bg-slate-50 rounded-2xl p-4">
        {primaryImage && (
          <img src={primaryImage} alt={product?.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
        )}
        <div>
          <div className="font-bold text-lg">{product?.name}</div>
          <div className="text-sm text-muted-foreground">{categoryName ?? "Uncategorized"}</div>
          <div className="text-sm text-muted-foreground mt-1">Return reason: <em>{ret.reason}</em></div>
          {ret.verificationResult && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">AI Score:</span>
              <span className="font-mono font-bold text-sm">{(ret.verificationResult.similarityScore * 100).toFixed(1)}%</span>
              <span className={`text-xs font-semibold ${ret.verificationResult.verdict === "PASS" ? "text-emerald-600" : ret.verificationResult.verdict === "FAIL" ? "text-red-600" : "text-amber-600"}`}>
                {ret.verificationResult.verdict}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Return images */}
      {ret.images?.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Buyer's return photos</p>
          <div className="flex gap-3 flex-wrap">
            {ret.images.map((img: any) => (
              <a key={img.id ?? img.url} href={img.url} target="_blank" rel="noreferrer">
                <img src={img.url} alt="Return" className="w-24 h-24 object-cover rounded-xl border hover:opacity-80 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Physical inspection checklist
          {categoryName && <span className="ml-2 text-primary normal-case font-normal">({categoryName})</span>}
        </p>
        <div className="space-y-2">
          {checklist.map(item => (
            <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checks[item.key] ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
              <input
                type="checkbox"
                checked={checks[item.key] ?? false}
                onChange={e => setChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                className="w-4 h-4 accent-emerald-600 flex-shrink-0"
              />
              <span className={`text-sm ${checks[item.key] ? "text-emerald-800 font-medium" : "text-foreground"}`}>
                {item.label}
              </span>
              {checks[item.key] && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />}
            </label>
          ))}
        </div>

        {/* Live verdict */}
        <div className={`mt-4 rounded-xl p-3 flex items-center gap-2 ${allChecked ? "bg-emerald-50 border border-emerald-200" : someChecked ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"}`}>
          {allChecked
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : someChecked
            ? <XCircle className="w-5 h-5 text-red-500" />
            : <AlertTriangle className="w-5 h-5 text-slate-400" />}
          <span className={`font-semibold text-sm ${allChecked ? "text-emerald-700" : someChecked ? "text-red-600" : "text-slate-500"}`}>
            {allChecked
              ? "All checks passed — return will be APPROVED"
              : someChecked
              ? `${Object.values(checks).filter(Boolean).length}/${checklist.length} checks passed — return will be REJECTED`
              : "Tick each item as you inspect the product"}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Checker notes (optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add any observations or notes about this return..."
          className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!someChecked || submitting}
          className={`flex-1 ${allChecked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            : allChecked
            ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve Return</>
            : <><XCircle className="w-4 h-4 mr-2" /> Reject Return</>}
        </Button>
      </div>
    </div>
  );
}

export default function CheckerDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReturnItem | null>(null);
  const prevAiAcceptedCountRef = useRef(0);

  useEffect(() => {
    if (!user || (user.role !== "checker" && user.role !== "admin")) {
      setLocation("/");
    }
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchCheckerReturns();
      setReturns(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pending = returns.filter(r => r.status === "checker_review");
  const aiAcceptedPending = pending.filter((r) => r.aiVerdict === "PASS");
  const done = returns.filter(r => r.status !== "checker_review");

  useEffect(() => {
    if (loading) return;
    const currentCount = aiAcceptedPending.length;
    if (currentCount > prevAiAcceptedCountRef.current) {
      const diff = currentCount - prevAiAcceptedCountRef.current;
      toast({
        title: "New return notification",
        description: `${diff} AI-accepted return${diff > 1 ? "s" : ""} waiting for checker pickup and inspection.`,
      });
    }
    prevAiAcceptedCountRef.current = currentCount;
  }, [aiAcceptedPending.length, loading, toast]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <ClipboardCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Checker Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Physically inspect returned products before final decision</p>
          </div>
          <div className="ml-auto flex gap-3">
            {pending.length > 0 && (
              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-sm font-semibold px-3 py-1.5 rounded-full">
                {pending.length} awaiting inspection
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Return list */}
          <div className="space-y-4">
            {aiAcceptedPending.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Checker Notification</p>
                <p className="text-sm text-amber-700 mt-1">
                  {aiAcceptedPending.length} return{aiAcceptedPending.length > 1 ? "s are" : " is"} AI-accepted and waiting for pickup.
                  Please collect and physically inspect the item at the return location.
                </p>
              </div>
            )}

            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)
            ) : returns.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No returns to inspect</p>
              </div>
            ) : (
              <>
                {pending.length > 0 && (
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Awaiting inspection</p>
                )}
                {pending.map(ret => (
                  <button
                    key={entityId(ret)}
                    onClick={() => setSelected(ret)}
                    className={`w-full text-left bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${entityId(selected) === entityId(ret) ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-slate-200"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">Return #{entityId(ret)}</span>
                          <StatusBadge status={ret.status} />
                        </div>
                        <p className="text-sm font-medium text-foreground">{ret.product?.name ?? "Unknown product"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ret.category?.name ?? "Uncategorized"} · {format(new Date(ret.createdAt), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{ret.reason}"</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                    </div>
                    {ret.verificationResult && (
                      <div className="mt-3 flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">AI: {(ret.verificationResult.similarityScore * 100).toFixed(0)}% similarity · {ret.verificationResult.verdict}</span>
                      </div>
                    )}
                  </button>
                ))}

                {done.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-2">Completed</p>
                    {done.map(ret => (
                      <div key={entityId(ret)} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 opacity-70">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold">Return #{entityId(ret)}</span>
                              <StatusBadge status={ret.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">{ret.product?.name}</p>
                          </div>
                          {ret.status === "approved"
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />}
                        </div>
                        {ret.inspection && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Checker: {ret.checkerDecision} · {format(new Date(ret.inspection.createdAt), "MMM d, h:mm a")}
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Right: Inspection panel */}
          <div className="lg:sticky lg:top-24">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-bold text-lg">Inspecting Return #{entityId(selected)}</h2>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
                </div>
                {selected.status !== "checker_review" ? (
                  <div className={`rounded-2xl p-5 text-center ${selected.status === "approved" ? "bg-emerald-50" : "bg-red-50"}`}>
                    {selected.status === "approved"
                      ? <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      : <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />}
                    <p className="font-bold capitalize">{selected.status}</p>
                    {selected.checkerNotes && <p className="text-sm text-muted-foreground mt-1">{selected.checkerNotes}</p>}
                  </div>
                ) : (
                  <InspectionPanel ret={selected} onDone={() => { setSelected(null); load(); }} />
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center">
                <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">Select a return from the list to begin physical inspection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
