import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as cheerio from 'cheerio';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // ডায়নামিক Base URL বের করা
    const baseUrl = new URL(targetUrl).origin; 

    let browser;
    if (process.env.NODE_ENV === 'development') {
      const localExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      browser = await puppeteer.launch({
        args: [],
        executablePath: localExecutablePath, 
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true, // <-- ঠিক এই জায়গাটিতে আপডেট করা হয়েছে
      });
    }
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);
    const products: any[] = [];

    const productSelector = $('.product, .grid-product, .product-item, .product-card, li.item');

    productSelector.each((i, el) => {
      const title = $(el).find('h2, h3, .product-title, .title').text().trim();
      const price = $(el).find('.price, .amount, .product-price').text().trim();
      
      // ডায়নামিক ইমেজ সোর্স লজিক
      let imageSrc = $(el).find('img').attr('src') || '';
      if (imageSrc) {
        if (imageSrc.startsWith('//')) {
          imageSrc = 'https:' + imageSrc;
        } else if (imageSrc.startsWith('/')) {
          imageSrc = baseUrl + imageSrc; 
        } else if (!imageSrc.startsWith('http')) {
          imageSrc = baseUrl + '/' + imageSrc; 
        }
      }

      let category = $(el).find('.category, .product-category, .posted_in').text().trim() || 'General';
      let tags = $(el).find('.tag, .product-tags, .tagged_as').text().trim() || 'Product';

      if (title) {
        products.push({
          Handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          Title: title,
          'Body (HTML)': `<p>${title}</p>`,
          Vendor: baseUrl.replace(/^https?:\/\/(www\.)?/, ''), 
          Type: category,
          Tags: tags,
          'Variant Price': price,
          'Image Src': imageSrc,
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Found ${products.length} products.`,
      data: products 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}