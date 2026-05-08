type TrustProduct = {
  revenue_verified?: boolean | null;
  github_verified?: boolean | null;
};

type TrustReview = {
  rating: number;
  is_approved?: boolean | null;
  created_at?: Date | string | null;
};

export type TrustScoreBreakdown = {
  rating_score: number;
  volume_score: number;
  recency_score: number;
  verification_score: number;
};

export function calculateTrustBreakdown(
  product: TrustProduct,
  reviews: TrustReview[],
): TrustScoreBreakdown {
  const approved = reviews.filter((review) => review.is_approved);

  if (approved.length === 0) {
    return {
      rating_score: 0,
      volume_score: 0,
      recency_score: 0,
      verification_score: 0,
    };
  }

  const avgRating =
    approved.reduce((sum, review) => sum + review.rating, 0) / approved.length;
  const ratingScore = ((avgRating - 1) / 4) * 100;
  const volumeScore = Math.min((approved.length / 200) * 100, 100);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCount = approved.filter((review) => {
    if (!review.created_at) return false;
    return new Date(review.created_at) > thirtyDaysAgo;
  }).length;
  const recencyScore = Math.min((recentCount / 10) * 100, 100);

  let verificationScore = 0;
  if (product.revenue_verified) verificationScore += 60;
  if (product.github_verified) verificationScore += 40;

  return {
    rating_score: Math.round(ratingScore),
    volume_score: Math.round(volumeScore),
    recency_score: Math.round(recencyScore),
    verification_score: verificationScore,
  };
}

export function calculateTrustScore(
  product: TrustProduct,
  reviews: TrustReview[],
): number {
  const breakdown = calculateTrustBreakdown(product, reviews);

  return Math.round(
    breakdown.rating_score * 0.35 +
      breakdown.volume_score * 0.25 +
      breakdown.recency_score * 0.2 +
      breakdown.verification_score * 0.2,
  );
}

export function getTrustGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}
