import asyncio
from bs4 import BeautifulSoup
import noble_tls
from noble_tls import Client

async def search_politifact(search_query: str):
    # Format search query for URL
    formatted_query = search_query.replace(' ', '+')
    url = f'https://www.politifact.com/search/?q={formatted_query}'
    
    # Headers to mimic browser request
    headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
    }

    try:
        # Make request using noble_tls
        await noble_tls.update_if_necessary()
        session = noble_tls.Session(
            client=Client.CHROME_111,
            random_tls_extension_order=True
        )
        response = await session.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the main content article
        content = soup.find('article', class_='o-platform__content')
        print(content)
        results = []
        if content:
            # Find all items in the list
            items = content.find_all('div', class_='o-listease__item')
            
            for item in items:
                # Extract title element
                title_elem = item.find('div', class_='c-textgroup__title')
                if title_elem:
                    title_link = title_elem.find('a')
                    if title_link:
                        # Extract image thumbnail
                        img_elem = item.find('img', class_='c-image__thumb')
                        
                        article_data = {
                            'title': title_link.text.strip(),
                            'url': f"https://www.politifact.com{title_link['href']}" if title_link.get('href') else None,
                            'thumbnail_url': img_elem['src'] if img_elem else None
                        }
                        results.append(article_data)
        
        return results

    except Exception as e:
        print(f"Error occurred: {e}")
        return []

# Example usage
async def main():
    search_term = "kamala fakes phone call"
    results = await search_politifact(search_term)
    
    for result in results:
        print("\nArticle Found:")
        print(f"Title: {result['title']}")
        print(f"URL: {result['url']}")
        print(f"Thumbnail: {result['thumbnail_url']}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())
