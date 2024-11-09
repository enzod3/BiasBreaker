import httpx
from openai import OpenAI
from dotenv import load_dotenv
import os


async def get_relevancy_score(client, passage: str, article_title: str) -> float:
    """
    Calculates a relevancy score between a passage and an article title using GPT-4.
    
    Args:
        client: The OpenAI client instance
        passage (str): The original passage to compare
        article_title (str): The article title to compare against
        
    Returns:
        float: A score between 0.00 and 1.00 indicating relevancy
    """
    system_prompt = """
    You are a relevancy scoring system. Compare the given passage with the article title 
    and determine how relevant they are to each other. Consider:
    - Semantic similarity
    - Key topics and concepts
    - Main claims or statements
    
    Respond with only a number between 0.00 and 1.00, where:
    0.00 = Completely unrelated
    1.00 = Perfectly relevant/matching
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Passage: '{passage}'\nArticle Title: '{article_title}'\n\nScore:"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0,  # Use low temperature for consistency
            max_tokens=10   # We only need a short numerical response
        )
        
        # Extract the numerical score from the response
        result = response.choices[0].message.content.strip()
        # Convert to float and ensure it's between 0 and 1
        score = float(result)
        return max(0.0, min(1.0, score))
        
    except Exception as e:
        print(f"Error during relevancy scoring: {str(e)}")
        raise

async def is_claim(client, text: str) -> bool:
    """
    Analyzes text to determine if it's a claim (True) or opinion (False) using GPT-4.
    
    Args:
        text (str): The text to analyze
        client: The OpenAI client instance
    
    Returns:
        bool: True if the text is a claim, False if it's an opinion
    """
    # Create the system prompt that defines the task
    system_prompt = """
    You are a claim detection system. Analyze the given text and determine if it's a claim or an opinion.
    A claim is a statement that can be proven true or false with evidence.
    A claim can also be in the form of "I never..." or "I will...", "He said ...", "She said..."
    An opinion is a personal view, belief, or judgment.
    Respond with only 'true' for claims or 'false' for opinions.
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Is this a claim? Text: '{text}'"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0,  # Use low temperature for more consistent results
            max_tokens=5    # We only need a short response
        )
        
        result = response.choices[0].message.content.strip().lower()
        
        # Convert the string response to boolean
        return result == 'true'
        
    except Exception as e:
        print(f"Error during API call: {str(e)}")
        raise
    
async def get_idea(client, passage: str) -> str:
    conversation = [
        {"role": "system",
        "content": "You are a news analyst, skilled in succinctly summarizing passages."},
        {"role": "user", "content": "Consider this passage. \n\n" + passage + "\n\n If the passage makes some claim that can be verified or refuted, respond with \"Yes\". Otherwise, respond \"No\""}
    ]
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=conversation
    )

    response = completion.choices[0].message

    if "yes" in response.content.lower():
        conversation.append(response)
        conversation.append({"role": "user", "content": "Choose one key claim the author makes in this passage, and summarize it in a short, verifiable headline (max 10 words)."})
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=conversation
        )
        
        return completion.choices[0].message.content

    return ""