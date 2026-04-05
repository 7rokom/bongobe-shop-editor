import { Link } from "react-router-dom";
import { useBlogStore } from "@/stores/useBlogStore";
import SEOHead, { DOMAIN } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

const Blog = () => {
  const { posts } = useBlogStore();
  const publishedPosts = posts.filter(p => p.status === 'published' && p.type === 'post');

  return (
    <div className="bg-white min-h-screen">
      <SEOHead title="ব্লগ — BongoBe" description="BongoBe ব্লগ — সেরা প্রোডাক্ট রিভিউ, টিপস এবং ট্রেন্ড।" canonical={`${DOMAIN}/blog`} />
      <div className="container-box py-8">
        <Breadcrumbs items={[{ label: 'ব্লগ' }]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedPosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.category}</span>
                  <span>•</span>
                  <span>{new Date(post.date).toLocaleDateString("bn-BD")}</span>
                </div>
                <h2 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
