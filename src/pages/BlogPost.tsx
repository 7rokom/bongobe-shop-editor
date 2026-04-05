import { useParams, Link } from "react-router-dom";
import { useBlogStore } from "@/stores/useBlogStore";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import SEOHead, { DOMAIN } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogContentWithAds from "@/components/BlogContentWithAds";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { posts, fetchPostBySlug } = useBlogStore();
  const post = posts.find((b) => b.slug === slug);
  const [slugFetchDone, setSlugFetchDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    if (post) { setSlugFetchDone(true); return; }
    fetchPostBySlug(slug, 'post').then(() => setSlugFetchDone(true));
  }, [slug]);

  const articleJsonLd = useMemo(() => post ? ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.image,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'BongoBe' },
    mainEntityOfPage: `${DOMAIN}/blog/${post.slug}`,
  }) : undefined, [post]);

  if (!post) {
    if (!slugFetchDone) {
      return (
        <div className="container-box py-20 text-center flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">একটু অপেক্ষা করুন...🙏</h1>
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="container-box py-20 text-center">
        <h1 className="text-2xl font-bold">পোস্ট পাওয়া যায়নি</h1>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title={`${post.title} — BongoBe ব্লগ`}
        description={post.metaDescription || post.excerpt}
        canonical={`${DOMAIN}/blog/${post.slug}`}
        ogImage={post.image}
        ogType="article"
        jsonLd={articleJsonLd!}
      />
      <div className="container-box py-8 max-w-3xl">
        <Breadcrumbs items={[{ label: 'ব্লগ', href: '/blog' }, { label: post.title }]} />
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" />
          সকল ব্লগ
        </Link>

        <article>
          {post.image && (
            <div className="aspect-video rounded-2xl overflow-hidden mb-6">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>{post.category}</span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString("bn-BD")}</span>
            <span>•</span>
            <span>{post.author}</span>
          </div>

          <h1 className="text-3xl font-bold mb-6">{post.title}</h1>

          <BlogContentWithAds content={post.content} />
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
