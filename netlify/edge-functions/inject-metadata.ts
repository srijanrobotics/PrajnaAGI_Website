// @ts-nocheck
import type { Context } from "https://edge.netlify.com";
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // More permissive path matching
  if (!url.pathname.includes("article")) {
    return;
  }

  const articleId = url.searchParams.get("id") || url.searchParams.get("title") || url.searchParams.get("slug");
  if (!articleId) {
    return;
  }

  try {
    const baseUrl = url.origin;
    
    // Check if Deno has HTMLRewriter
    const hasRewriter = typeof HTMLRewriter !== 'undefined' ? 'yes' : 'no';
    
    // Use a cache-busting param to ensure we get fresh JSON
    const articlesResponse = await fetch(`${baseUrl}/content/articles.json?v=${Date.now()}`);
    
    if (!articlesResponse.ok) {
      console.error("Failed to fetch articles.json:", articlesResponse.status);
      const res = await context.next();
      res.headers.set("x-prajna-edge", `fetch-failed-${articlesResponse.status}`);
      res.headers.set("x-prajna-rewriter", hasRewriter);
      return res;
    }
    
    const data = await articlesResponse.json();
    const article = data.articles.find((a: any) => 
      (a.slug === articleId || a.title === articleId || a.slug === decodeURIComponent(articleId))
    );

    if (!article) {
      console.log("Article not found for ID:", articleId);
      return;
    }

    const response = await context.next();
    const pageTitle = `${article.title} — PrajnaAGI`;
    const pageDesc = article.summary || article.meta_desc || "विज्ञान, अंतरिक्ष और तकनीक की ताज़ा खबरें";
    
    // Optimize Unsplash images for social media (1200x630 is the gold standard)
    let pageImage = article.image || article.social_image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200";
    if (pageImage.includes("unsplash.com")) {
        // Ensure perfect aspect ratio for social cards
        pageImage = pageImage.split('?')[0] + "?auto=format&fit=crop&q=80&w=1200&h=630";
    }

    // Ensure image is absolute and properly URL-encoded (CDNs sometimes decode %20)
    const rawAbsoluteImage = pageImage.startsWith('http') ? pageImage : `${baseUrl}${pageImage.startsWith('/') ? '' : '/'}${pageImage}`;
    const absoluteImage = encodeURI(decodeURIComponent(rawAbsoluteImage));

    const rewrittenResponse = new HTMLRewriter()
      .on("title", {
        element(element) {
          element.setInnerContent(pageTitle);
        },
      })
      .on('meta[name="description"]', {
        element(element) {
          element.setAttribute("content", pageDesc);
        },
      })
      .on('meta[property="og:title"]', {
        element(element) {
          element.setAttribute("content", pageTitle);
        },
      })
      .on('meta[property="og:description"]', {
        element(element) {
          element.setAttribute("content", pageDesc);
        },
      })
      .on('meta[property="og:image"]', {
        element(element) {
          element.setAttribute("content", absoluteImage);
        },
      })
      .on('meta[property="og:url"]', {
        element(element) {
          element.setAttribute("content", request.url);
        },
      })
      .on('meta[name="twitter:card"]', {
        element(element) {
          element.setAttribute("content", "summary_large_image");
        },
      })
      .on('meta[name="twitter:title"]', {
        element(element) {
          element.setAttribute("content", pageTitle);
        },
      })
      .on('meta[name="twitter:description"]', {
        element(element) {
          element.setAttribute("content", pageDesc);
        },
      })
      .on('meta[name="twitter:image"]', {
        element(element) {
          element.setAttribute("content", absoluteImage);
        },
      })
      .on('meta[name="twitter:image:src"]', {
        element(element) {
          element.setAttribute("content", absoluteImage);
        },
      })
      .transform(response);

    // Add a debug header so we can verify the function ran
    rewrittenResponse.headers.set("x-prajna-edge", "active");
    return rewrittenResponse;

  } catch (error) {
    console.error("Edge Function Exception:", error);
    try {
      const res = await context.next();
      res.headers.set("x-prajna-edge", `exception-${error.message || error}`);
      return res;
    } catch (_) {
      return new Response("Edge Function Error", { status: 500 });
    }
  }
};
