import { useMemo, useEffect, useRef } from 'react';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

interface Props {
  content: string;
}

const BlogContentWithAds = ({ content }: Props) => {
  const { adsenseCode } = useSiteSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Split content into paragraphs and inject ad placeholders
  const htmlWithAds = useMemo(() => {
    if (!adsenseCode || !content) return content;

    // Split by closing </p> tags to find paragraph boundaries
    const parts = content.split(/<\/p>/i);
    if (parts.length <= 1) return content;

    const result: string[] = [];
    const adPlaceholder = `<div class="adsense-slot my-4">${adsenseCode}</div>`;

    // Add ad at the beginning
    result.push(adPlaceholder);

    parts.forEach((part, i) => {
      if (i < parts.length - 1) {
        result.push(part + '</p>');
        // Every 4 paragraphs, inject an ad
        if ((i + 1) % 4 === 0) {
          result.push(adPlaceholder);
        }
      } else if (part.trim()) {
        result.push(part);
      }
    });

    // Add ad at the end
    result.push(adPlaceholder);

    return result.join('');
  }, [content, adsenseCode]);

  // Execute ad scripts after render
  useEffect(() => {
    if (!containerRef.current || !adsenseCode) return;
    const slots = containerRef.current.querySelectorAll('.adsense-slot');
    slots.forEach((slot) => {
      const scripts = slot.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    });
  }, [htmlWithAds, adsenseCode]);

  return (
    <div
      ref={containerRef}
      className="prose prose-sm max-w-none text-foreground text-[14px] overflow-x-auto [&_p]:mb-4 [&_p]:leading-relaxed [&_br]:block [&_br]:content-[''] [&_br]:mb-2 [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:mb-4 [&_.ql-indent-1]:ml-8 [&_.ql-indent-2]:ml-16 [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_span]:break-words [&_*]:max-w-full"
      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      dangerouslySetInnerHTML={{ __html: htmlWithAds }}
    />
  );
};

export default BlogContentWithAds;
