import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import '../App.css'

type Scores = {
  overall: number
  clarity: number
  pacing: number
  fillerWords: number
  confidence: number
  structure: number
}

type Mode = 'script' | 'topic'

type Feedback = {
  summary: string
  strengths: string[]
  improvements: string[]
  scores: Scores
  insights: {
    fillerWordsExamples: string[]
    strongMoments: string[]
    weakMoments: string[]
  }
  stage?: Mode
  checks?: {
    script?: {
      scriptText?: string
      matchScore: number
      feedback: string
      tone?: {
        requiredTone?: string
        detectedTone?: string
        toneScore: number
        toneNoticeable: boolean
        toneFeedback: string
      }
    }
    topic?: {
      topicText?: string
      relevanceScore: number
      feedback: string
    }
    time?: {
      timeLimitSeconds?: number
      actualSeconds?: number
      withinTimeLimit: boolean
      feedback: string
    }
    recommendedStage?: Mode
  }
}

type Session = {
  id: string
  createdAt: string
  transcript: string
  mode: Mode
  feedback: Feedback
}

const getSessionsKey = (userId: string | null) =>
  userId ? `speechprep-sessions-${userId}` : 'speechprep-sessions-guest'
const getStageKey = (userId: string | null) =>
  userId ? `speechprep-stage-${userId}` : 'speechprep-stage-guest'

const SCRIPT_DRILLS: Array<{ text: string; tone: string }> = [
  { text: 'Today I will clearly explain one idea in just one sentence.', tone: 'confident' },
  { text: 'My goal is to speak slowly, confidently, and with purpose.', tone: 'calm' },
  { text: 'I will pause between phrases to make every word easier to follow.', tone: 'thoughtful' },
  { text: 'I am practicing calm, clear speech so my ideas land with impact.', tone: 'energetic' },
  { text: 'I want my audience to feel focused, relaxed, and ready to listen.', tone: 'warm' },
  { text: 'This is a difficult situation that requires careful consideration.', tone: 'serious' },
  { text: 'I am so excited to share this amazing news with everyone!', tone: 'enthusiastic' },
  { text: 'I am not entirely sure about the details of this proposal.', tone: 'uncertain' },
  { text: 'Let me explain why this approach might not work as expected.', tone: 'concerned' },
  { text: 'We have achieved something truly remarkable together today.', tone: 'proud' },
]

const TOPIC_PROMPTS: { topic: string; timeLimitSeconds: number }[] = [
  { topic: 'A habit that changed your life', timeLimitSeconds: 90 },
  { topic: 'Explain your favorite product as if pitching it to investors', timeLimitSeconds: 120 },
  { topic: 'Teach a simple concept you understand well to a beginner', timeLimitSeconds: 120 },
  { topic: 'Describe a challenge you overcame and what you learned', timeLimitSeconds: 150 },
  { topic: 'Share a bold idea you believe in for the future', timeLimitSeconds: 150 },
]

export default function Practice() {
  const { user, logout } = useAuth()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const elapsedAtStopRef = useRef(0)
  const isCancelledRef = useRef(false)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stopMessage, setStopMessage] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [stage, setStage] = useState<Mode>('script')
  const [currentScript, setCurrentScript] = useState<string | null>(null)
  const [currentScriptTone, setCurrentScriptTone] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  const [currentTimeLimit, setCurrentTimeLimit] = useState<number | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      if (user?.id) {
        // Load from Supabase for authenticated users
        try {
          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

          if (error) {
            console.error('Error loading sessions:', error)
            // Fallback to localStorage
            const sessionsKey = getSessionsKey(user.id)
            const saved = window.localStorage.getItem(sessionsKey)
            if (saved) {
              try {
                const parsed: Session[] = JSON.parse(saved)
                setSessions(parsed)
              } catch {
                setSessions([])
              }
            } else {
              setSessions([])
            }
          } else if (data) {
            // Transform Supabase data to Session format
            const transformed: Session[] = data.map((s) => ({
              id: s.id,
              createdAt: s.created_at,
              mode: s.mode as Mode,
              transcript: s.transcript,
              feedback: s.feedback as Feedback,
            }))
            setSessions(transformed)
          } else {
            setSessions([])
          }
        } catch (error) {
          console.error('Error loading sessions:', error)
          setSessions([])
        }
      } else {
        // Load from localStorage for guest users
        const sessionsKey = getSessionsKey(null)
        const saved = window.localStorage.getItem(sessionsKey)
        if (saved) {
          try {
            const parsed: Session[] = JSON.parse(saved)
            setSessions(parsed)
          } catch {
            setSessions([])
          }
        } else {
          setSessions([])
        }
      }
    }

    loadSessions()
  }, [user?.id])

  useEffect(() => {
    const stageKey = getStageKey(user?.id || null)
    const savedStage = window.localStorage.getItem(stageKey) as Mode | null
    if (savedStage === 'script' || savedStage === 'topic') {
      setStage(savedStage)
    }
  }, [user?.id])

  const pickScript = () => {
    const next =
      SCRIPT_DRILLS[Math.floor(Math.random() * SCRIPT_DRILLS.length)]
    setCurrentScript(next.text)
    setCurrentScriptTone(next.tone)
  }

  const pickTopic = () => {
    const next =
      TOPIC_PROMPTS[Math.floor(Math.random() * TOPIC_PROMPTS.length)]
    setCurrentTopic(next.topic)
    setCurrentTimeLimit(next.timeLimitSeconds)
  }

  useEffect(() => {
    let timer: number | undefined
    if (isRecording) {
      timer = window.setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      setElapsed(0)
    }
    return () => {
      if (timer) {
        window.clearInterval(timer)
      }
    }
  }, [isRecording])


  const startRecording = async () => {
    try {
      setError(null)
      setStopMessage(null)
      
      // Request camera and mic permissions when user clicks "Start Practice"
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      chunksRef.current = []
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm',
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        // Only upload if there are chunks AND it wasn't cancelled
        if (!isCancelledRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          uploadRecording(blob)
        }
        // Clear chunks after processing
        chunksRef.current = []
        isCancelledRef.current = false
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setTranscript(null)
      setFeedback(null)
      setStopMessage(null)
      isCancelledRef.current = false
    } catch (err) {
      setError(
        'Could not access camera/microphone. Please allow permissions and try again.',
      )
    }
  }

  const cancelRecording = () => {
    // Cancel recording without analyzing
    isCancelledRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Clear the chunks so uploadRecording won't process them
      chunksRef.current = []
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    
    // Stop all tracks to release camera and mic
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
    setError(null)
    setStopMessage("No worries! Think about how to say it, and give it another shot!")
  }

  const stopRecording = () => {
    // Finish recording and analyze
    isCancelledRef.current = false
    if (!mediaRecorderRef.current) return
    if (mediaRecorderRef.current.state !== 'inactive') {
      elapsedAtStopRef.current = elapsed
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setStopMessage(null)
    
    // Stop all tracks to release camera and mic
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }

  const uploadRecording = async (blob: Blob) => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('video', blob, 'speech.webm')
      formData.append('mode', stage)
      if (currentScript) {
        formData.append('script', currentScript)
      }
      if (currentScriptTone) {
        formData.append('scriptTone', currentScriptTone)
      }
      if (currentTopic) {
        formData.append('topic', currentTopic)
      }
      if (currentTimeLimit != null) {
        formData.append('timeLimitSeconds', String(currentTimeLimit))
      }
      formData.append('elapsedSeconds', String(elapsedAtStopRef.current))

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to analyze recording')
      }

      const data = (await response.json()) as {
        transcript: string
        feedback: Feedback
      }

      setTranscript(data.transcript)
      setFeedback(data.feedback)

      const session: Session = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        mode: stage,
        transcript: data.transcript,
        feedback: data.feedback,
      }

      // Save to Supabase if user is authenticated
      if (user?.id) {
        try {
          const { error: supabaseError } = await supabase
            .from('sessions')
            .insert({
              id: session.id,
              user_id: user.id,
              created_at: session.createdAt,
              mode: session.mode,
              transcript: session.transcript,
              feedback: session.feedback,
              script: currentScript || null,
              script_tone: currentScriptTone || null,
              topic: currentTopic || null,
              time_limit_seconds: currentTimeLimit || null,
              elapsed_seconds: elapsedAtStopRef.current || null,
            })

          if (supabaseError) {
            console.error('Error saving session to Supabase:', supabaseError)
            // Fallback to localStorage
            const sessionsKey = getSessionsKey(user.id)
            const saved = window.localStorage.getItem(sessionsKey)
            const prev = saved ? JSON.parse(saved) : []
            const updated = [session, ...prev].slice(0, 20)
            window.localStorage.setItem(sessionsKey, JSON.stringify(updated))
          }
        } catch (error) {
          console.error('Error saving session:', error)
          // Fallback to localStorage
          const sessionsKey = getSessionsKey(user.id)
          const saved = window.localStorage.getItem(sessionsKey)
          const prev = saved ? JSON.parse(saved) : []
          const updated = [session, ...prev].slice(0, 20)
          window.localStorage.setItem(sessionsKey, JSON.stringify(updated))
        }
      } else {
        // Save to localStorage for guest users
        const sessionsKey = getSessionsKey(null)
        const saved = window.localStorage.getItem(sessionsKey)
        const prev = saved ? JSON.parse(saved) : []
        const updated = [session, ...prev].slice(0, 20)
        window.localStorage.setItem(sessionsKey, JSON.stringify(updated))
      }

      setSessions((prev) => {
        return [session, ...prev].slice(0, 20)
      })

      // simple progression: unlock topic stage after 3 strong script runs
      if (stage === 'script') {
        const scriptSessions = [
          session,
          ...sessions.filter((s) => s.mode === 'script'),
        ]
        const strongCount = scriptSessions.filter(
          (s) => s.feedback.scores.overall >= 75,
        ).length
        if (strongCount >= 3) {
          setStage('topic')
          const stageKey = getStageKey(user?.id || null)
          window.localStorage.setItem(stageKey, 'topic')
          pickTopic()
        } else if (!currentScript) {
          pickScript()
        }
      } else if (stage === 'topic' && !currentTopic) {
        pickTopic()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while analyzing.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const latestScore = sessions[0]?.feedback.scores.overall ?? null
  const previousScore = sessions[1]?.feedback.scores.overall ?? null
  const trend =
    latestScore != null && previousScore != null
      ? latestScore - previousScore
      : null

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="app">
      <section className="app-shell">
        <header className="app-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <img src="/logo.svg" alt="Speech Prep" style={{ height: '32px', width: 'auto' }} />
              <h2 className="app-title">Practice session</h2>
              {user ? (
                <div className="user-info">
                  <span>Welcome, {user.name}</span>
                  <button onClick={logout} className="link-button" style={{ marginLeft: '0.5rem' }}>
                    Log out
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="link-button">
                  Log in to save progress
                </Link>
              )}
            </div>
            <p className="subtitle">
              Public speaking practice with real-time recording, stages, and AI feedback.
            </p>
            <p className="stage-pill">
              Current stage:{' '}
              <strong>{stage === 'script' ? 'Script reading drills' : 'Own-topic speeches'}</strong>
            </p>
          </div>
          <div className="score-card">
            <span className="score-label">Your latest score</span>
            <div className="score-value">
              {latestScore != null ? Math.round(latestScore) : '—'}
            </div>
            {trend != null && (
              <span
                className={`score-trend ${
                  trend > 0 ? 'score-trend-up' : trend < 0 ? 'score-trend-down' : ''
                }`}
              >
                {trend > 0 ? `↑ +${Math.round(trend)}` : trend < 0 ? `↓ ${Math.round(trend)}` : '→ 0'}
              </span>
            )}
          </div>
        </header>

        <main className="layout">
        <section className="panel">
          <h2>1. Practice your speech</h2>
          <p className="panel-description">
            {stage === 'script'
              ? 'Start with short, AI-guided one-sentence scripts to build clarity and control.'
              : 'Now create your own speeches with a clear topic and time limit, just like a real talk.'}
          </p>

          {stage === 'script' ? (
            <div className="assignment">
              <h3>Script drill</h3>
              <p className="assignment-text">
                {currentScript ??
                  'Click "New script" to get a one-sentence line to read out loud.'}
              </p>
              {currentScriptTone && (
                <p className="assignment-tone">
                  <strong>Tone to convey:</strong> <em>{currentScriptTone}</em>
                </p>
              )}
              <button
                type="button"
                onClick={pickScript}
                disabled={isRecording || isAnalyzing}
              >
                New script
              </button>
            </div>
          ) : (
            <div className="assignment">
              <h3>Topic &amp; timebox</h3>
              <p className="assignment-text">
                {currentTopic
                  ? currentTopic
                  : 'Click "New topic" to get a prompt and time limit for your own mini talk.'}
              </p>
              <div className="assignment-meta">
                <span>
                  Time limit:{' '}
                  <strong>
                    {currentTimeLimit
                      ? `${Math.round(currentTimeLimit / 60)} min`
                      : '—'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={pickTopic}
                  disabled={isRecording || isAnalyzing}
                >
                  New topic
                </button>
              </div>
            </div>
          )}

          <div className="video-container">
            <video
              ref={videoRef}
              className="video-preview"
              autoPlay
              playsInline
              muted
            />
            {!stream && !isRecording && (
              <div className="video-overlay">
                <p>Camera &amp; mic will be requested when you click &quot;Start practice&quot;.</p>
              </div>
            )}
          </div>

          <div className="controls">
            <div className="timer">
              <span>{formatTime(elapsed)}</span>
              {isRecording && <span className="recording-dot" />}
            </div>
            <div className="buttons">
              {!isRecording ? (
                <button onClick={startRecording} className="primary" disabled={isAnalyzing}>
                  Start practice
                </button>
              ) : (
                <>
                  <button onClick={cancelRecording} className="secondary">
                    Stop
                  </button>
                  <button onClick={stopRecording} className="danger">
                    Finish &amp; analyze
                  </button>
                </>
              )}
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {stopMessage && <div className="status">{stopMessage}</div>}
          {isAnalyzing && (
            <div className="status">
              Analyzing your speech – extracting audio, transcribing, and generating feedback…
            </div>
          )}
        </section>

        <section className="panel">
          <h2>2. Get AI coaching</h2>
          <p className="panel-description">
            After you finish, SpeechPrep uses AI to review your speech, score key dimensions, and
            suggest concrete next steps.
          </p>

          {!feedback && !isAnalyzing && (
            <div className="placeholder">
              Record a speech to see detailed feedback here.
            </div>
          )}

          {feedback && (
            <div className="feedback">
              <div className="feedback-summary">
                <h3>Summary</h3>
                <p>{feedback.summary}</p>
              </div>

              <div className="feedback-grid">
                <div>
                  <h3>Scores</h3>
                  <ul className="scores-list">
                    <li>
                      <span>Overall</span>
                      <strong>{Math.round(feedback.scores.overall)}/100</strong>
                    </li>
                    <li>
                      <span>Clarity</span>
                      <strong>{feedback.scores.clarity}/10</strong>
                    </li>
                    <li>
                      <span>Pacing</span>
                      <strong>{feedback.scores.pacing}/10</strong>
                    </li>
                    <li>
                      <span>Filler words</span>
                      <strong>{feedback.scores.fillerWords}/10</strong>
                    </li>
                    <li>
                      <span>Confidence</span>
                      <strong>{feedback.scores.confidence}/10</strong>
                    </li>
                    <li>
                      <span>Structure</span>
                      <strong>{feedback.scores.structure}/10</strong>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3>Strengths</h3>
                  <ul>
                    {feedback.strengths.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Most impactful improvements</h3>
                  <ul>
                    {feedback.improvements.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {feedback.checks?.script?.tone && (
                <div className="tone-feedback">
                  <h3>Tone Analysis</h3>
                  <div className="tone-info">
                    <p>
                      <strong>Required tone:</strong> <em>{feedback.checks.script.tone.requiredTone}</em>
                    </p>
                    <p>
                      <strong>Detected tone:</strong> <em>{feedback.checks.script.tone.detectedTone}</em>
                    </p>
                    <p>
                      <strong>Tone score:</strong> {feedback.checks.script.tone.toneScore}/100
                    </p>
                    <p>
                      <strong>Tone noticeable:</strong>{' '}
                      {feedback.checks.script.tone.toneNoticeable ? (
                        <span style={{ color: '#16a34a' }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>✗ No</span>
                      )}
                    </p>
                  </div>
                  <div className="tone-feedback-text">
                    <strong>Feedback:</strong> {feedback.checks.script.tone.toneFeedback}
                  </div>
                </div>
              )}

              <details className="transcript">
                <summary>View full transcript &amp; detailed moments</summary>
                {transcript && (
                  <>
                    <h4>Transcript</h4>
                    <p className="transcript-text">{transcript}</p>
                  </>
                )}

                <div className="insights">
                  {feedback.insights.fillerWordsExamples.length > 0 && (
                    <div>
                      <h4>Filler words examples</h4>
                      <ul>
                        {feedback.insights.fillerWordsExamples.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.insights.strongMoments.length > 0 && (
                    <div>
                      <h4>Strong moments</h4>
                      <ul>
                        {feedback.insights.strongMoments.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.insights.weakMoments.length > 0 && (
                    <div>
                      <h4>Moments to improve</h4>
                      <ul>
                        {feedback.insights.weakMoments.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>3. Track your improvement</h2>
          <p className="panel-description">
            Every practice session is saved locally so you can see how your scores and comments
            evolve over time.
          </p>

          {sessions.length === 0 ? (
            <div className="placeholder">
              Your practice history will appear here after your first session.
            </div>
          ) : (
            <ul className="history-list">
              {sessions.map((session) => (
                <li key={session.id} className="history-item">
                  <div>
                    <div className="history-date">
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                    <div className="history-summary">
                      {session.feedback.summary.length > 120
                        ? session.feedback.summary.slice(0, 117) + '...'
                        : session.feedback.summary}
                    </div>
                  </div>
                  <div className="history-score">
                    {Math.round(session.feedback.scores.overall)}/100
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      </section>
    </div>
  )
}

