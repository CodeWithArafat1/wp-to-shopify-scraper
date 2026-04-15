import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Viewport boro kore nichi jate shob dekha jay
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating to URL...");
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // DEBUGGING: Page er screenshot neya
    console.log("Taking screenshot...");
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

    // DEBUGGING: Page er ashol title ki asche sheta dekha
    const pageTitle = await page.title();
    console.log("Page Title:", pageTitle);

    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);
    const products: any[] = [];

    // Eikhane amra sadharon kichu common class check korbo
    const productSelector = $('.product, .grid-product, .product-item, .product-card, li.item');

    productSelector.each((i, el) => {
      const title = $(el).find('h2, h3, .product-title, .title').text().trim();
      const price = $(el).find('.price, .amount, .product-price').text().trim();
      
      // Image URL fix (Shopify needs absolute URLs with https)
      let imageSrc = $(el).find('img').attr('src') || '';
      if (imageSrc.startsWith('//')) {
        imageSrc = 'https:' + imageSrc;
      } else if (imageSrc.startsWith('/')) {
        imageSrc = 'https://www.natuliquecalifornia.com' + imageSrc;
      }

      // Category and Tags scrape korar logic
      let category = $(el).find('.category, .product-category, .posted_in').text().trim();
      let tags = $(el).find('.tag, .product-tags, .tagged_as').text().trim();

      // Jodi shop page e category/tags na thake, tahole default value set kora
      if (!category) {
        category = 'Hair Care'; // eita apnar dorkar moto change kore niben
      }
      if (!tags) {
        tags = 'Natulique, Organic'; // eita apnar dorkar moto change kore niben
      }

      if (title) {
        products.push({
          Handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          Title: title,
          'Body (HTML)': `<p>${title}</p>`,
          Vendor: 'Natulique',
          Type: category,     // Shopify CSV te Type = Category
          Tags: tags,         // Shopify CSV te Tags
          'Variant Price': price,
          'Image Src': imageSrc,
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Found ${products.length} products. Page title was: ${pageTitle}`,
      data: products 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}