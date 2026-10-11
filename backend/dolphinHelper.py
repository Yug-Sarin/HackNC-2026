from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from XP import Profile

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

user_message = input("You: ")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    config=types.GenerateContentConfig(
        system_instruction=""
    ),
    contents=user_message
)

print("Delphi:", response.text)