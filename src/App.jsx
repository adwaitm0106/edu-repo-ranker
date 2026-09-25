import { useEffect, useRef, useState } from 'react'
import './App.css'

const WEBHOOK_URL = 'https://adwa-m-1301.app.n8n.cloud/webhook/edu-scorer'
const SUGGESTIONS = ['systems design', 'react hooks', 'rust concurrency', 'machine learning']

const STATUS_STEPS = [
  { at: 0, text: 'Scoring repos for educational depth...', sub: 'This can take up to a minute under hackathon load.' },
  { at: 15000, text: 'Still working, the shared K2 endpoint is busy near deadline crunch.', sub: 'This can take up to a minute under hackathon load.' },
  { at: 40000, text: 'Hang tight, almost there...', sub: 'Finishing the reasoning pass on each repo.' },
  { at: 70000, text: 'This one is taking a while, thanks for your patience.', sub: 'Finishing the reasoning pass on each repo.' },
]

function formatStars(n) {
  if (typeof n !== 'number') return n ?? '?'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}

export default function App() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusStep, setStatusStep] = useState(0)
  const [error, setError] = useState('')
  const [repos, setRepos] = useState(null)
  const [roadmap, setRoadmap] = useState('')
  const timersRef = useRef([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  async function runSearch(overrideTopic) {
    const q = (overrideTopic ?? topic).trim()
    if (!q) {
      inputRef.current?.focus()
      return
    }

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    setLoading(true)
    setError('')
    setRepos(null)
    setRoadmap('')
    setStatusStep(0)

    timersRef.current = STATUS_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setStatusStep(i + 1), step.at)
    )

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: q }),
      })

      if (!res.ok) throw new Error('Request failed with status ' + res.status)

      const data = await res.json()

      let parsed = data.repos
      if (!parsed) {
        let raw = data.response ?? data
        if (typeof raw === 'string') {
          const cleaned = raw.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '')
          parsed = JSON.parse(cleaned)
        } else {
          parsed = raw
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No repos found for that topic. Try something broader.')
      }

      setRepos([...parsed].sort((a, b) => (b.score || 0) - (a.score || 0)))
      if (typeof data.roadmap === 'string' && data.roadmap.trim()) {
        setRoadmap(data.roadmap.trim())
      }
    } catch (err) {
      setError('Something went wrong: ' + err.message)
    } finally {
      timersRef.current.forEach(clearTimeout)
      setLoading(false)
    }
  }

  const status = STATUS_STEPS[statusStep]

  return (
    <div className="page">
      <div className="mesh" />
      <div className="wrap">
        <header>
          <div className="badge">
            <span className="dot" />
            n8n &times; K2 Horizon
          </div>
          <h1>
            Find repos that actually <span className="accent">teach you</span> something
          </h1>
          <p>Not stars, not hype: a ranked reading list scored for educational value, with reasoning for every pick.</p>
        </header>

        <div className={`search-card ${loading ? 'is-loading' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={topic}
            placeholder="What do you want to learn? e.g. 'systems design'"
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
          <button disabled={loading} onClick={() => runSearch()}>
            <span>{loading ? 'Ranking...' : 'Rank Repos'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setTopic(s)
                runSearch(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="status">
            <div className="status-blobs">
              <span className="blob blob-1" />
              <span className="blob blob-2" />
              <span className="blob blob-3" />
            </div>
            <div className="orbit">
              <span />
              <span />
            </div>
            <div className="status-text shimmer">{status.text}</div>
            <div className="status-sub">{status.sub}</div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {repos && (
          <div className="results">
            {repos.map((r, i) => (
              <div className="repo-card" key={r.url || r.name || i} style={{ animationDelay: `${i * 70}ms` }}>
                <div className={`rank ${i === 0 ? 'gold' : ''}`}>#{i + 1}</div>
                <div className="repo-body">
                  <div className="repo-top">
                    <div className="repo-name">
                      <a href={r.url || '#'} target="_blank" rel="noopener noreferrer">
                        {r.name || 'unknown'}
                      </a>
                    </div>
                    <div className="score-pill">Edu Score {r.score ?? '?'}/10</div>
                  </div>
                  <div className="meta">
                    <span>&#9733; {formatStars(r.stars)} stars</span>
                  </div>
                  <div className="reason">{r.reason || ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {roadmap && (
          <div className="roadmap">
            <h2>Suggested study order</h2>
            <div className="roadmap-sub">K2 Horizon's take on the order to work through these in</div>
            <pre>{roadmap}</pre>
          </div>
        )}

        <footer>Ranked by K2 Horizon, scored on clarity, depth, and real-world learning value</footer>
      </div>
    </div>
  )
}
