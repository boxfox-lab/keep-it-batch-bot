import axios from 'axios';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  html: string | null;
}

export class OGFetchService {
  private decodeHtmlEntities(text: string | null): string | null {
    if (!text) return null;

    const entities = {
      '&quot;': '"',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
    };

    return text.replace(
      /&[^;]+;/g,
      (match) => entities[match as keyof typeof entities] || match,
    );
  }

  private parseHtml(url: string, html: string): OGData {
    try {
      // Parse the HTML using regex to extract meta tags
      const getMetaContent = (name: string): string | null => {
        const match = html.match(
          new RegExp(
            `<meta\\s+(?:property|name)=["']${name}["']\\s+content=["']([^"']+)["']|<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${name}["']`,
            'i',
          ),
        );
        return match ? this.decodeHtmlEntities(match[1] || match[2]) : null;
      };

      // Extract title from various sources
      const title =
        getMetaContent('og:title') ||
        getMetaContent('twitter:title') ||
        this.decodeHtmlEntities(
          html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1],
        ) ||
        null;

      // Extract description
      const description =
        getMetaContent('og:description') ||
        getMetaContent('twitter:description') ||
        getMetaContent('description') ||
        null;

      // Extract image
      const image =
        getMetaContent('og:image') || getMetaContent('twitter:image') || null;

      // Extract site name
      const siteName =
        getMetaContent('og:site_name') ||
        new URL(url).hostname.replace(/^www\./i, '') ||
        null;

      // Extract text content from body
      const bodyText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
        .replace(/<[^>]+>/g, ' ') // Replace HTML tags with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/&[^;]+;/g, (match) => {
          // Decode HTML entities in body text
          const entities: { [key: string]: string } = {
            '&quot;': '"',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#39;': "'",
            '&apos;': "'",
            '&nbsp;': ' ',
          };
          return entities[match] || match;
        })
        .trim(); // Trim whitespace

      return {
        title,
        description,
        image,
        siteName,
        html: bodyText,
      };
    } catch (error) {
      GlobalErrorHandler.handleError(
        error as Error,
        'OGFetchService.parseHtml',
        { url },
      );
      return {
        title: null,
        description: null,
        image: null,
        siteName: null,
        html: null,
      };
    }
  }

  async fetchOGData(url: string): Promise<OGData | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'Mozilla/5.0 (compatible; KeepItBot/1.0)',
        },
        timeout: 10000, // 10초 타임아웃
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = response.data;
      return this.parseHtml(url, html);
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'OGFetchService.fetchOGData',
        { url },
      );
      return null;
    }
  }
}
