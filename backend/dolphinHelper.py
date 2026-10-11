from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

user_message = input("You: ")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    config=types.GenerateContentConfig(
        system_instruction="You are Delphi, a cheerful dolphin companion on a campus sustainability app. You encourage students to complete quests, celebrate their wins, and gently nudge them when they haven't done anything in a while. Keep responses short and fun."
    ),
    contents=user_message
)

print("Delphi:", response.text)