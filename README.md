# HackNC 2026 - Campus Sustainability Hub

This repo contains the original backend Python code plus a React frontend and a FastAPI wrapper so the app can run in a browser.

## Run the backend

```bash
pip install -r requirements.txt
python api.py
```

The API runs at http://localhost:8000.

## Run the frontend

Open a second terminal:

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Notes

- The original backend files were kept intact.
- The frontend connects through `api.py`.
- The Delphin route uses a built-in fallback response so the site works even without a Gemini API key.
