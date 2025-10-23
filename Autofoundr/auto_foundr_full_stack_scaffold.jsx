// AutoFoundr - Full-stack scaffold
// This single-file canvas contains a compact full-stack scaffold: a React (Next.js) frontend
// component and a FastAPI backend prototype. Use this as a starting point to build the
// Automated Micro-Business Builder (AutoFoundr).

---

# README

AutoFoundr - Full-stack scaffold

What this repo contains (single-file overview):

1. Frontend (Next.js / React + Tailwind) — pages/index.jsx and components/Builder.jsx
2. Backend (FastAPI) — backend/main.py (mock endpoints that simulate product & brand generation)
3. .env.example and setup instructions

Goal: provide a working local prototype where a user can upload a photo or type a product idea,
then the backend returns generated brand name, logo link (placeholder), product title/description,
and suggested ad copy. The frontend shows the generated store preview and a "Publish" button
(which in a full product would call Shopify API).

---

## Quick start (local)

Prereqs:
- Node.js 18+
- Python 3.10+
- pip (or pipx)
- Optional: ngrok for public webhook testing

Steps:
1. Frontend
   - cd frontend
   - npm install
   - npm run dev

2. Backend
   - cd backend
   - python -m venv venv
   - source venv/bin/activate (mac/linux) or venv\Scripts\activate (windows)
   - pip install -r requirements.txt
   - uvicorn main:app --reload --port 8000

This scaffold uses a mock AI generator. Replace the mock logic in `backend/main.py`
with real calls to GPT-4/5 and image generation APIs (DALL·E / Midjourney / etc.)

---

// =========================
// frontend/pages/index.jsx
// =========================

import Head from 'next/head'
import Builder from '../components/Builder'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
      <Head>
        <title>AutoFoundr — Build a Business in Minutes</title>
      </Head>

      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6">AutoFoundr</h1>
        <p className="mb-6 text-gray-600">Upload a photo or type a product idea — get a full store scaffold instantly.</p>

        <div className="bg-white rounded-2xl shadow p-6">
          <Builder />
        </div>

        <footer className="mt-8 text-sm text-gray-500">Prototype • Not for production use</footer>
      </main>
    </div>
  )
}


// =============================
// frontend/components/Builder.jsx
// =============================

import { useState } from 'react'

export default function Builder() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      })
      const data = await resp.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      alert('Failed to generate — check backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleGenerate} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Product idea or upload</span>
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g., eco-friendly phone case"
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2"
          />
        </label>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Generating...' : 'Generate Store'}
          </button>
          <button type="button" onClick={() => { setIdea(''); setResult(null) }} className="px-4 py-2 border rounded">
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold">Brand</h3>
            <p className="text-sm text-gray-700">{result.brand.name}</p>
            <img src={result.brand.logo} alt="logo" className="mt-3 w-32 h-32 object-cover bg-gray-100" />
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold">Product</h3>
            <p className="text-sm text-gray-700">{result.product.title}</p>
            <p className="mt-2 text-sm">{result.product.description}</p>
            <p className="mt-3 font-medium">Price: {result.product.price}</p>

            <div className="mt-4">
              <h4 className="font-semibold">Ad Ideas</h4>
              <ul className="list-disc ml-5 mt-2 text-sm">
                {result.ads.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-green-600 text-white rounded">Publish (mock)</button>
              <button className="px-3 py-2 border rounded">Export JSON</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// =================================
// frontend/pages/api/generate.js (Next.js API route - proxy to backend)
// =================================

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const body = req.body

  // In dev, proxy to backend running on port 8000
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000/generate'

  try {
    const r = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await r.json()
    res.status(200).json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'backend proxy failed' })
  }
}


// =========================
// backend/requirements.txt
// =========================

fastapi
uvicorn
pydantic
python-multipart


// =========================
// backend/main.py
// =========================

from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import random

app = FastAPI()

class GenerateRequest(BaseModel):
    idea: Optional[str] = None

class Brand(BaseModel):
    name: str
    logo: str

class Product(BaseModel):
    title: str
    description: str
    price: str

class GenerateResponse(BaseModel):
    brand: Brand
    product: Product
    ads: List[str]

# Mock generator — replace with GPT and image-gen calls
@app.post('/generate', response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    base = req.idea or 'cool product'
    brand = {
        'name': mock_brand_name(base),
        'logo': mock_logo_url(base)
    }
    product = {
        'title': mock_title(base),
        'description': mock_description(base),
        'price': mock_price()
    }
    ads = mock_ads(base)

    return { 'brand': brand, 'product': product, 'ads': ads }

# ------- Mock helpers -------

def mock_brand_name(base: str) -> str:
    parts = ['Co', 'Lab', 'Works', 'Craft', 'Studio', 'Goods', 'Peak', 'Root']
    return (base.split()[0].capitalize() + random.choice(parts))[:30]


def mock_logo_url(base: str) -> str:
    # Placeholder: in production, call an image API
    text = base.replace(' ', '+')
    return f'https://via.placeholder.com/256x256.png?text={text}'


def mock_title(base: str) -> str:
    return f'{base.capitalize()} — Premium Edition'


def mock_description(base: str) -> str:
    return f'The {base} designed for people who want quality and sustainability. Handcrafted and tested.'


def mock_price() -> str:
    p = random.choice([19.99, 24.99, 29.99, 49.99])
    return f'${p:.2f}'


def mock_ads(base: str) -> List[str]:
    return [
        f'Try our {base} — limited launch offer!',
        f'Why our {base} is better: sustainable, durable, stylish.',
        f'See how our {base} fits your life in 15 seconds.'
    ]


if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)


// =========================
// .env.example
// =========================

# BACKEND_URL=http://localhost:8000/generate
# OPENAI_API_KEY=sk-xxxx (for replacing mocks)


// =========================
// Next steps (development roadmap)
// =========================

1. Replace backend mock helpers with calls to OpenAI/GPT-4/5 for brand, title, description and ads.
2. Add image generation: call DALL·E or an image API to produce logos, or integrate with a design template engine.
3. Add file upload handling: accept a product image, run vision model to extract attributes.
4. Implement user accounts, billing (Stripe), and saved projects.
5. Integrate Shopify / custom storefront creation using Shopify Admin API.
6. Add automated ad creation and optional campaign launch via Meta / TikTok Ads API.
7. Add analytics + logging + A/B testing for copy and images.

---

// End of scaffold file
