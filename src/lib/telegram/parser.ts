// src/lib/telegram/parser.ts
import * as cheerio from "cheerio";
import type { CheerioAPI, Cheerio } from "cheerio";
import type { Element } from "domhandler"; // Correct type for DOM elements in cheerio
import type { TelegramPost, MediaFile, LinkPreview, Reply } from "@/types";
import dayjs from './dayjs-setup';
function parseImages(item: Cheerio<Element>, $: CheerioAPI): MediaFile[] {
  return item.find(".tgme_widget_message_photo_wrap").map((_, photo) => {
    const url = $(photo).attr("style")?.match(/url\(["'](.*?)["']/)?.[1];
    return url ? { type: 'image', url } : null;
  }).get().filter(Boolean) as MediaFile[];
}

function parseVideos(item: Cheerio<Element>, $: CheerioAPI): MediaFile[] {
  const videos: MediaFile[] = [];
  item.find(".tgme_widget_message_video_wrap video").each((_, video) => {
    const url = $(video).attr("src");
    if (url) {
      videos.push({
        type: 'video',
        url,
        thumbnail: $(video).attr("poster") || undefined,
      });
    }
  });
  // 可以按需添加对 roundVideo 的支持
  return videos;
}

function parseLinkPreview(item: Cheerio<Element>, $: CheerioAPI): LinkPreview | undefined {
  const link = item.find(".tgme_widget_message_link_preview");
  const url = link.attr("href");
  if (!url) return undefined;

  const title = link.find(".link_preview_title").text() || link.find(".link_preview_site_name").text();
  const description = link.find(".link_preview_description").text();
  const imageSrc = link.find(".link_preview_image")?.attr("style")?.match(/url\(["'](.*?)["']/i)?.[1];
  
  try {
    const hostname = new URL(url).hostname;
    return { url, title, description, image: imageSrc, hostname };
  } catch {
    return undefined;
  }
}

function parseReply(item: Cheerio<Element>, $: CheerioAPI, channel: string): Reply | undefined {
    const reply = item.find(".tgme_widget_message_reply");
    if (reply.length === 0) return undefined;

    const href = reply.attr('href');
    if (!href) return undefined;

    const id = href.split('/').pop() || '';
    const author = reply.find('.tgme_widget_message_author_name').text() || '未知用户';
    
    const fullText = reply.text();
    let text = fullText.replace(author, '').trim();

    if (!text) {
        if (reply.find('.tgme_widget_message_photo').length > 0) {
            text = '[图片]';
        } else if (reply.find('.tgme_widget_message_sticker').length > 0) {
            text = '[贴纸]';
        } else if (reply.find('.tgme_widget_message_video').length > 0) {
            text = '[视频]';
        } else {
            text = '...'; 
        }
    }

    return {
        url: `/post/${id}`,
        author,
        text, 
    };
}


export function parsePost(element: Element, $: CheerioAPI, channel: string): TelegramPost {
  // 现在我们直接接收 .tgme_widget_message 元素
  const item = $(element); 
  const id = item.attr("data-post")?.replace(`${channel}/`, "") || '0';
  
  const datetime = item.find(".tgme_widget_message_date time")?.attr("datetime") || '';
  const formattedDate = datetime ? dayjs(datetime).tz('Asia/Shanghai').fromNow() : '未知时间';

  const textElement = item.find(".tgme_widget_message_text").clone(); // 克隆以防修改影响其他解析
  
  // 处理内容中的链接、标签等
  textElement.find('a').each((_, el) => {
    const link = $(el);
    if (link.text().startsWith('#')) {
      link.addClass('hashtag');
    } else {
      link.addClass('link link-primary');
    }
  });

  // 移除媒体元素，避免在 htmlContent 中重复
  textElement.find('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_wrap').remove();

  return {
    id,
    datetime,
    formattedDate,
    text: item.find(".tgme_widget_message_text").text() || '', // 从原始元素获取纯文本
    htmlContent: textElement.html() || '',
    views: item.find(".tgme_widget_message_views").text() || "0",
    media: [...parseImages(item, $), ...parseVideos(item, $)],
    linkPreview: parseLinkPreview(item, $),
    reply: parseReply(item, $, channel),
  };
}