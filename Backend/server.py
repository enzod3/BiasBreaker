from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from politifact import *

from openai import OpenAI
from dotenv import load_dotenv
import json

app = FastAPI()
load_dotenv()

# Assuming `get_idea` is defined elsewhere in your code
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

# Define a data model for the request body
class IdeaRequest(BaseModel):
    passage: str

# Dependency function to provide `client`
async def get_client():
    return OpenAI()

# returns True if something is bad
# @app.post("/check-passage/")
async def check_passage(client, passage):
    if not passage:
        raise HTTPException(status_code=400, detail="Passage cannot be empty")

    # Call the get_idea function and return the result
    headline = await get_idea(client, passage)

    results = await get_best_article(headline)
    if not results.success:
        return json.dumps({
            "result": "false",
         "title": "",
            "url": "",
            "verdict": "",
        })
    
    return json.dumps({
        "result": "true",
        "title": results.title,
        "url": results.url,
        "verdict": results.verdict
    })



async def main():
    client = await get_client()
    passage = """
Lyin’ Kamala is giving a News Conference now, saying that I want to end the Affordable Care Act. I never mentioned doing that, never even thought about such a thing. She also said I want to end Social Security. Likewise, never mentioned it, or thought of it. She is the one that wants to end Social Security and, she will do it, by putting the millions of Migrants coming into our Country into it. Kamala is a LIAR! Everything that comes out of her mouth is a LIE. It’s MADE UP FICTION, and she’s doing it because she’s losing, and losing BIG!
"""
    res = await check_passage(client, passage)
    print(res)

if __name__ == "__main__":
    asyncio.run(main)

