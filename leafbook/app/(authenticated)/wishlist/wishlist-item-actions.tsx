"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFromWishlist, convertWishlistToPlant } from "./actions";

interface WishlistItemActionsProps {
  wishlistItemId: string;
  plantTypeId: string | null;
  plantTypeName: string;
}

export function WishlistItemActions({ 
  wishlistItemId, 
  plantTypeId, 
  plantTypeName 
}: WishlistItemActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConvert() {
    startTransition(async () => {
      const result = await convertWishlistToPlant(wishlistItemId, plantTypeId, plantTypeName);
      if (result.success) {
        router.push("/plants");
      }
    });
  }

  async function handleRemove() {
    setIsDeleting(true);
    startTransition(async () => {
      await removeFromWishlist(wishlistItemId);
      setIsDeleting(false);
    });
  }

  return (
    <>
      <Button 
        size="sm" 
        onClick={handleConvert}
        disabled={isPending}
        className="flex-1 gap-1"
      >
        <Leaf className="h-4 w-4" />
        {isPending && !isDeleting ? "Adding..." : "I got it!"}
      </Button>
      <Button 
        size="sm" 
        variant="ghost"
        onClick={handleRemove}
        disabled={isPending}
        title="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </>
  );
}
