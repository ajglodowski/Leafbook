"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToWishlist, removeFromWishlist } from "./actions";

interface WishlistButtonProps {
  plantTypeId: string;
  isInWishlist: boolean;
  wishlistItemId?: string;
}

export function WishlistButton({ plantTypeId, isInWishlist, wishlistItemId }: WishlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticInWishlist, setOptimisticInWishlist] = useState(isInWishlist);

  async function handleToggle() {
    setOptimisticInWishlist(!optimisticInWishlist);
    
    startTransition(async () => {
      if (isInWishlist && wishlistItemId) {
        const result = await removeFromWishlist(wishlistItemId, plantTypeId);
        if (!result.success) {
          setOptimisticInWishlist(true); // Revert on error
        }
      } else {
        const result = await addToWishlist(plantTypeId);
        if (!result.success) {
          setOptimisticInWishlist(false); // Revert on error
        }
      }
    });
  }

  return (
    <Button
      variant={optimisticInWishlist ? "secondary" : "outline"}
      onClick={handleToggle}
      disabled={isPending}
      className="gap-2"
    >
      <Heart
        className={`h-4 w-4 ${optimisticInWishlist ? "fill-current text-red-500" : ""}`}
      />
      {optimisticInWishlist ? "In wishlist" : "Add to wishlist"}
    </Button>
  );
}
