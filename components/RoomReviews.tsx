"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { Star, MessageSquarePlus, Calendar } from "lucide-react";

interface ReviewUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
}

interface Review {
  id: number;
  rating: number | null;
  comment: string | null;
  created_at: Date;
  users: ReviewUser | null;
}

interface RoomReviewsProps {
  roomId: number;
  initialReviews: Review[];
  canReview: boolean;
}

export default function RoomReviews({ roomId, initialReviews, canReview }: RoomReviewsProps) {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        setComment("");
        setRating(5);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-2xl font-serif font-bold text-slate-950">
        Guest Reviews ({initialReviews.length})
      </h3>

      {/* Review list */}
      <div className="flex flex-col gap-6">
        {initialReviews.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No reviews yet for this room. Be the first to share your experience!</p>
        ) : (
          initialReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {rev.users?.first_name} {rev.users?.last_name || "Anonymous Guest"}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (rev.rating || 0) ? "fill-primary text-primary" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Review Form */}
      {isAuthenticated ? (
        canReview ? (
          <form
            onSubmit={handleSubmit}
            className="bg-stone-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              <h4 className="font-serif font-bold text-slate-950 text-base">Write a Review</h4>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        star <= rating ? "fill-primary text-primary" : "text-slate-300 hover:text-primary/70"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Experience</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell other guests about the bed comfort, service, views, or room amenities..."
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
              />
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="self-start px-6 py-2.5 bg-primary text-slate-950 hover:bg-amber-400 font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-md hover:shadow-lg"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <div className="p-6 bg-amber-500/10 text-center rounded-2xl border border-amber-500/20 text-amber-800">
            <p className="text-sm font-medium">
              You must complete a confirmed stay in this room before you can leave a review.
            </p>
          </div>
        )
      ) : (
        <div className="p-6 bg-stone-100 text-center rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">
            Please <a href="/login" className="text-primary font-bold hover:underline">sign in</a> to leave a review.
          </p>
        </div>
      )}
    </div>
  );
}
