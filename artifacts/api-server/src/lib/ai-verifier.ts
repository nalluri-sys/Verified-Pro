/**
 * AI Return Verification Service
 * Simulates image similarity analysis using cosine similarity scoring.
 * In production, this would call a Python/FastAPI microservice with CLIP embeddings.
 */

interface VerificationInput {
  productImages: string[];
  returnImages: string[];
  productName: string;
}

interface VerificationChecks {
  productIdentityMatch: boolean;
  packagingIntact: boolean;
  noVisibleDamage: boolean;
  correctProduct: boolean;
  fraudRisk: "low" | "medium" | "high";
}

interface VerificationOutput {
  verdict: "PASS" | "FAIL" | "SUSPICIOUS";
  similarityScore: number;
  checks: VerificationChecks;
}

/**
 * Simulates cosine similarity between image embeddings.
 * In a real system, CLIP would extract embeddings and we'd compute:
 *   similarity = dot(embedA, embedB) / (norm(embedA) * norm(embedB))
 */
function simulateSimilarityScore(productImages: string[], returnImages: string[]): number {
  if (productImages.length === 0 || returnImages.length === 0) {
    // No reference images - cannot verify
    return 0.3 + Math.random() * 0.2;
  }
  // Simulate realistic similarity distribution
  // Most legit returns: 0.75-0.95, fraud: 0.2-0.55
  const base = 0.65 + Math.random() * 0.30;
  return Math.min(0.99, Math.max(0.1, base));
}

function determineVerdict(score: number, checks: VerificationChecks): "PASS" | "FAIL" | "SUSPICIOUS" {
  if (score >= 0.80 && checks.correctProduct && checks.productIdentityMatch) {
    return "PASS";
  }
  if (score < 0.50 || checks.fraudRisk === "high") {
    return "FAIL";
  }
  return "SUSPICIOUS";
}

export async function verifyReturnImages(input: VerificationInput): Promise<VerificationOutput> {
  // Simulate async AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const similarityScore = simulateSimilarityScore(input.productImages, input.returnImages);

  // Derive checks from score
  const productIdentityMatch = similarityScore > 0.65;
  const packagingIntact = similarityScore > 0.70;
  const noVisibleDamage = similarityScore > 0.60;
  const correctProduct = similarityScore > 0.72;

  let fraudRisk: "low" | "medium" | "high";
  if (similarityScore < 0.45) {
    fraudRisk = "high";
  } else if (similarityScore < 0.70) {
    fraudRisk = "medium";
  } else {
    fraudRisk = "low";
  }

  const checks: VerificationChecks = {
    productIdentityMatch,
    packagingIntact,
    noVisibleDamage,
    correctProduct,
    fraudRisk,
  };

  const verdict = determineVerdict(similarityScore, checks);

  return {
    verdict,
    similarityScore,
    checks,
  };
}
