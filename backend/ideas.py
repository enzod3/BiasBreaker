import httpx
from openai import OpenAI
from dotenv import load_dotenv
import os


def get_idea(client, passage):
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

    else:
        return "No claim"

load_dotenv()

proxy_url = os.environ.get("OPENAI_PROXY_URL")

client = OpenAI()
#  if proxy_url is None or proxy_url == "" else OpenAI(http_client=httpx.Client(proxy=proxy_url))

passage = """
By the way, if any Trump voters took a wrong turn off the turnpike and have landed here reading me, howdy, and thanks for stopping by. This is information you want to take note of for 2028, whoever your next candidate is. It might save you grief, too.
"""

print(get_idea(client, passage))

passage = """
Kamala Harris has spent the better part of two decades in public life notching up a long list of things she was the first to achieve: the first Black woman to be elected district attorney in California history, first woman to be California’s attorney general, first Indian American senator, and now, the first Black woman and first Asian American to be picked as a vice presidential running mate on a major-party ticket.
"""

print(get_idea(client, passage))