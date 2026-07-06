export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  text: string;
}

export interface ModerateReviewInput {
  status: 'approved' | 'rejected';
}

export interface AggregateRating {
  averageRating: number;
  reviewCount: number;
}
