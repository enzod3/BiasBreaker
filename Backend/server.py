from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from politifact import *
from ideas import *
from openai import OpenAI
from dotenv import load_dotenv
import json

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

    results = await get_best_article(request.passage)
    if not results["success"]:
        print("No results found, summarizing text...")
        if (not await is_claim(client, request.passage)):
            print("Not a claim")
            results = []
        else:
            headline = await get_idea(client, request.passage)
            results = await get_best_article(headline)
    
    if not results["success"]:
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


