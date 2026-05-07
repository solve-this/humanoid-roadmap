import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewsFeed from '../../components/NewsFeed'

const mockArticles = [
  { id: '1', title: 'Robots take over factories', url: 'https://example.com/1', source: 'Test Source', publishedAt: new Date().toISOString(), sentiment: 'negative' as const },
  { id: '2', title: 'New robot model creates jobs', url: 'https://example.com/2', source: 'Test Source', publishedAt: new Date().toISOString(), sentiment: 'positive' as const },
]

const mockLastUpdated = { timestamp: '2026-05-06T04:00:00.000Z' }

describe('NewsFeed', () => {
  it('renders without crashing', () => {
    const { container } = render(<NewsFeed articles={mockArticles} lastUpdated={mockLastUpdated} />)
    expect(container).toBeTruthy()
  })

  it('renders article titles as links', () => {
    render(<NewsFeed articles={mockArticles} lastUpdated={mockLastUpdated} />)
    const links = screen.getAllByRole('link')
    // articles are duplicated for seamless loop, so at least 2
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('shows the updated timestamp badge', () => {
    const { getByText } = render(<NewsFeed articles={mockArticles} lastUpdated={mockLastUpdated} />)
    expect(getByText(/UPDATED/)).toBeTruthy()
  })
})
