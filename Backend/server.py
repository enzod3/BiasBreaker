from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from politifact import *
from ideas import *
from openai import OpenAI
from dotenv import load_dotenv
import json
import asyncio

app = FastAPI()
load_dotenv()




# Define a data model for the request body
class IdeaRequest(BaseModel):
    passage: str

# Dependency function to provide `client`
async def get_client():
    return OpenAI()

# returns True if something is bad
@app.post("/check-passage/")
async def check_passage(request: IdeaRequest):
    client = await get_client()
    if not request.passage:
        raise HTTPException(status_code=400, detail="Passage cannot be empty")

    # Run get_best_article and get_idea concurrently
    results1, headline = await asyncio.gather(
        get_best_article(request.passage),
        get_idea(client, request.passage)
    )
    
    # Get second article based on headline
    results2 = await get_best_article(headline)

    # Get relevancy scores concurrently
    score1, score2 = await asyncio.gather(
        get_relevancy_score(client, request.passage, results1["title"]) if results1["success"] else asyncio.sleep(0, result=0),
        get_relevancy_score(client, request.passage, results2["title"]) if results2["success"] else asyncio.sleep(0, result=0)
    )

    print(score1, score2)
    results = results1 if score1 >= score2 else results2
    best_score = max(score1, score2)

    # Return empty result if relevancy score is too low
    if best_score < 0.5:
        return {
            "result": "false",
            "title": "",
            "url": "",
            "verdict": "",
        }

    return {
        "result": "true",
        "title": results["title"],
        "url": results["url"],
        "verdict": results["verdict"]
    }


