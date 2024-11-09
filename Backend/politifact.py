import asyncio
from bs4 import BeautifulSoup
import noble_tls
from noble_tls import Client
import re
import urllib.parse

async def search_politifact(search_query: str):
    # Format search query for URL
    # formatted_query = search_query.replace(' ', '+')
    # URL encode the search query
    search_query = urllib.parse.quote_plus(search_query);

    url = f'https://www.politifact.com/search/?q={search_query}'
    
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
        
        # Find all content articles
        content_sections = soup.find_all('article', class_='o-platform__content')
        
        results = []
        for content in content_sections:
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


def parse_verdict(thumbnail_url):
    term = re.search(r'rulings/([^/]+)/', thumbnail_url).group(1)

    verdict_map = {
        'meter-true': 'true',
        'meter-mostly-true': 'mostly true', 
        'meter-half-true': 'half hrue',
        'meter-mostly-false': 'mostly false',
        'meter-false': 'false',
        'tom_ruling_pof': 'very false'
    }
    
    return verdict_map.get(term, 'True')


async def get_best_article(search_term):
    results =await search_politifact(search_term)
    if len(results) > 0:
        return {
            "success":True,
            "title": results[0]['title'],
            "url": results[0]['url'],
            "verdict": parse_verdict(results[0]['thumbnail_url'])
                } 
    else:
        return{
            "success":False,
            "title": None,
            "url": None, 
            "verdict": None,
                }
        
async def main():
    search_term = input()#"kamala fakes phone call"
    result = await get_best_article(search_term)


    print(result)
    

if __name__ == "__main__":
    asyncio.run(main())
