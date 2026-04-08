import { forwardRef, memo, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/data/store-data";
import { useCartStore, useWishlistStore } from "@/stores/useStore";
import { useFraudBlockedStore } from "@/stores/useFraudBlockedStore";

interface ProductCardProps {
  product: Product;
}

const ProductCardBase = forwardRef<HTMLDivElement, ProductCardProps>(({ product }, ref) => {
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => !!s.items.find((i) => i.id === product.id));
  const isDeviceBlocked = useFraudBlockedStore((s) => s.isDeviceBlocked);

  const hasVariations = (product.variations && product.variations.length > 0) ||
    (product.colors && product.colors.length > 0) ||
    (product.sizes && product.sizes.length > 0) ||
    (product.weights && product.weights.length > 0);

  const handleAddToCart = useCallback(() => {
    if (hasVariations) {
      navigate(`/product/${product.slug}`);
    } else {
      addToCart(product);
      openCart();
    }
  }, [hasVariations, product, navigate, addToCart, openCart]);

  const handleOrder = useCallback(() => {
    if (hasVariations) {
      navigate(`/product/${product.slug}`);
    } else {
      addToCart(product);
      navigate('/checkout');
    }
  }, [hasVariations, product, navigate, addToCart]);

  const handleToggleWishlist = useCallback(() => {
    toggleWishlist(product);
  }, [toggleWishlist, product]);

  const imgSrc = product.featuredImage || product.images[0];

  return (
    <div
      ref={ref}
      className="group bg-card rounded-[5px] border border-black/30 shadow-sm hover:shadow-[0_2px_8px_rgba(0,80,10,0.35)] hover:-translate-y-[3px] transition-all duration-300 overflow-visible"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-[5px]">
        <Link to={`/product/${product.slug}`}>
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={300}
            height={300}
          />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 bg-primary/30 backdrop-blur-sm hover:bg-primary rounded-full h-8 w-8 text-primary-foreground hover:text-primary-foreground"
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-primary-foreground text-primary-foreground" : ""}`} />
        </Button>
      </div>

      <div className="p-[7px]">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-[15px] font-medium line-clamp-2 hover:text-primary transition-colors leading-tight mb-2 text-black dark:text-white">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[18px] font-bold text-red-600">৳{product.price}</span>
          {product.originalPrice && (
            <span className="text-[18px] font-bold text-foreground line-through decoration-2 decoration-foreground">৳{product.originalPrice}</span>
          )}
        </div>

        <div className="flex items-center gap-[4px]">
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0 rounded-[5px] bg-primary text-primary-foreground hover:bg-foreground hover:text-background"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button
              className="flex-1 h-9 text-[16px] rounded-[5px] hover:bg-foreground hover:text-background"
              onClick={handleOrder}
            >
              অর্ডার করুন
            </Button>
          </div>
      </div>
    </div>
  );
});

ProductCardBase.displayName = "ProductCard";

const ProductCard = memo(ProductCardBase);
ProductCard.displayName = "ProductCard";

export default ProductCard;
