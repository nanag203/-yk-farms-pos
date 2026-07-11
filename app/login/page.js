'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { brand } from '@/lib/brand'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('Wrong email or password. Try again.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: brand.cream,
      padding: '1rem',
      fontFamily: "'Poppins', sans-serif",
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(38,71,45,0.1)',
        width: '100%',
        maxWidth: '380px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Image
            src="/IMG_2335.jpeg"

            alt="Yeboah Kudom Farms"
            width={220}
            height={83}
            style={{ height: 'auto', width: '70%', maxWidth: '220px' }}
            priority
          />
        </div>

        <h1 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: brand.forestGreen,
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}>
          Admin Login
        </h1>

        <label style={{ display: 'block', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 500 }}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.75rem', marginTop: '0.3rem',
              border: '1px solid #d8d8d8', borderRadius: '8px',
              fontFamily: 'inherit', fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '1.1rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 500 }}>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.75rem', marginTop: '0.3rem',
              border: '1px solid #d8d8d8', borderRadius: '8px',
              fontFamily: 'inherit', fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </label>

        {error && (
          <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '0.75rem', background: brand.forestGreen,
            color: 'white', border: 'none', borderRadius: '8px',
            fontWeight: 600, fontFamily: 'inherit', fontSize: '0.95rem',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p style={{
          textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem',
          color: '#999', letterSpacing: '0.02em',
        }}>
          Growing Quality, Feeding the Future
        </p>
      </form>
    </div>
  )
}
