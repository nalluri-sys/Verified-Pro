import { Layout } from "@/components/Layout";
import { useGetReturn, useVerifyReturn, useUpdateReturnDecision, getGetReturnQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck, Activity, CheckCircle, XCircle, Clock3, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { motion } from "framer-motion";
import { entityId } from "@/lib/entity-id";
import { useEffect, useRef, useState } from "react";

function toPercentScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  // Support both fraction scores (0..1) and already-percent scores (0..100).
  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, normalized));
}

export default function ReturnDetail() {
  const [, params] = useRoute("/returns/:id");
  const id = params?.id || "";
  const { data: ret, isLoading, refetch } = useGetReturn(id as any, { query: { enabled: Boolean(id) } });
  
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const verifyStartRef = useRef<number | null>(null);
  const autoVerifyStartedRef = useRef(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { mutate: verify, isPending: isVerifying } = useVerifyReturn({
    mutation: {
      onMutate: () => {
        verifyStartRef.current = Date.now();
        setElapsedSeconds(0);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetReturnQueryKey(id) }),
      onSettled: () => {
        verifyStartRef.current = null;
        setElapsedSeconds(0);
      },
    }
  });

  const { mutate: decide } = useUpdateReturnDecision({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetReturnQueryKey(id) }) }
  });

  const shouldAutoVerify = Boolean(ret && !ret.aiVerdict && ret.status === "pending");
  const isAiProcessing = isVerifying || ret?.status === "verifying" || shouldAutoVerify;
  const confidencePercent = toPercentScore(ret?.verificationResult?.similarityScore);

  useEffect(() => {
    if (!id || !shouldAutoVerify || isVerifying || autoVerifyStartedRef.current) {
      return;
    }
    autoVerifyStartedRef.current = true;
    verify({ id: id as any });
  }, [id, shouldAutoVerify, isVerifying, verify]);

  useEffect(() => {
    if (!isAiProcessing) {
      return;
    }

    if (!verifyStartRef.current) {
      verifyStartRef.current = Date.now();
    }

    const tick = () => {
      if (!verifyStartRef.current) return;
      const elapsed = Math.floor((Date.now() - verifyStartRef.current) / 1000);
      setElapsedSeconds(elapsed);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isAiProcessing]);

  useEffect(() => {
    if (ret?.status !== "verifying" || isVerifying) {
      return;
    }
    const poll = window.setInterval(() => {
      void refetch();
    }, 2000);
    return () => window.clearInterval(poll);
  }, [ret?.status, isVerifying, refetch]);

  if (isLoading) return <Layout><div className="p-20 text-center animate-pulse">Loading...</div></Layout>;
  if (!ret) return <Layout><div className="p-20 text-center">Return not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">Return #{entityId(ret as any)}</h1>
          <Badge className="text-lg px-4 py-1 uppercase">{ret.status}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Return Details</h3>
              <p className="text-muted-foreground mb-4"><strong>Reason:</strong> {ret.reason}</p>
              {ret.images && ret.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Customer Evidence</h4>
                  <img src={ret.images[0].url} className="rounded-xl border border-slate-200 w-full max-h-80 object-cover" />
                </div>
              )}
            </div>
            
            {user?.role === 'admin' && ret.status !== 'approved' && ret.status !== 'rejected' && (
              <div className="flex gap-4">
                <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => decide({ id: id as any, data: { status: 'approved', adminNotes: 'Manual override' }})}>Approve Manually</Button>
                <Button className="flex-1" variant="destructive" onClick={() => decide({ id: id as any, data: { status: 'rejected', adminNotes: 'Manual override' }})}>Reject Manually</Button>
              </div>
            )}
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900 text-white p-8">
            <div className="absolute inset-0 z-0 opacity-20">
              <img src={`${import.meta.env.BASE_URL}images/ai-fraud-bg.png`} className="w-full h-full object-cover" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Activity className="text-blue-400 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-blue-50">Verified pro AI Engine</h2>
                  <p className="text-blue-200/60 text-sm">Automated Fraud Detection</p>
                </div>
              </div>

              {!ret.aiVerdict ? (
                <div className="text-center py-10">
                  {isAiProcessing ? (
                    <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-6 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="w-6 h-6 text-blue-300 animate-spin" />
                        <div>
                          <p className="font-semibold text-blue-100">AI Agent is analyzing product images...</p>
                          <p className="text-xs text-blue-200/70">Do not close this page while the verification is running.</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="w-4 h-4" /> Time elapsed
                        </span>
                        <span className="font-mono font-bold">
                          {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-blue-950/60 overflow-hidden">
                        <div className="h-full w-1/3 bg-blue-400 animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <ShieldAlert className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                      <p className="text-blue-100 mb-6">Verification pending analysis.</p>
                      {(user?.role === 'admin' || user?.role === 'seller' || user?.role === 'buyer') && (
                        <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0" isLoading={isVerifying} onClick={() => verify({ id: id as any })}>
                          Run AI Scan Now
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">AI Verdict</span>
                    <Badge variant={ret.aiVerdict === 'PASS' ? 'success' : ret.aiVerdict === 'FAIL' ? 'destructive' : 'warning'} className="text-lg py-1 px-4">
                      {ret.aiVerdict}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2 text-blue-200">
                      <span>Match Confidence</span>
                      <span className="font-bold">{confidencePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${ret.aiVerdict === 'PASS' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${confidencePercent}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 mt-6 border border-white/5">
                    {Object.entries(ret.verificationResult?.checks || {}).filter(([k]) => k !== 'fraudRisk').map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        {v ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
